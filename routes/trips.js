const express = require("express");
const router = express.Router();
const moment = require("moment");
const Trip = require("../models/trip");
const User = require("../models/user");
const uid2 = require("uid2");

const {
  checkFieldsRequest,
  checkFields,
} = require("../modules/checkFieldsRequire");
const { getDistFromCoords } = require("../modules/getDistance");

// liste des routes:
// GET /all: montre tous les trips
// POST /create: créée un nouveau trip
// PUT /addPassenger: ajoute un passager à un trip
// PUT /removePassenger: supprime un passager d'un trip
// DELETE /removeTrip: supprime un trip
// PUT /search: chercher des trips

router.get("/", (req, res) => {
  res.send("flyways trips index");
});

router.get("/all", (req, res) => {
  Trip.find().then((allTrips) =>
    res.json({
      allTrips,
    })
  );
});

// créer un nouveau trip
router.post("/create", (req, res) => {
  if (
    !checkFieldsRequest(req.body, [
      "passengerToken",
      "departureCoordsLat",
      "departureCoordsLong",
      "arrivalCoordsLat",
      "arrivalCoordsLong",
      "arrivalDescription",
      "date",
      "capacity",
    ])
  ) {
    res.json({
      // si un des champs est vide, stop
      result: false,
      error: "Missing or empty fields",
    });
    return;
  }

  const {
    passengerToken,
    departureCoordsLat,
    departureCoordsLong,
    arrivalCoordsLat,
    arrivalCoordsLong,
    arrivalDescription,
    date, // Mon Oct 24 2022 12:33:50 GMT+0200
    capacity,
  } = req.body;

  const token = uid2(32);

  User.findOne({ token: passengerToken }).then((leader) => {
    const newTrip = new Trip({
      token,
      passengers: {
        passengerToken,
        isLeader: true, // l'utilisateur qui créée le trip est leader
        firstName: leader.firstName,
        lastName: leader.lastName,
        profilePicture: leader.profilePicture,
        rating: leader.averageRating,
        languagesSpoken: leader.languagesSpoken, // FIXME: creates broken "languagesSpoken" array
      },
      departureCoords: {
        latitude: departureCoordsLat,
        longitude: departureCoordsLong,
      },
      arrivalCoords: {
        latitude: arrivalCoordsLat,
        longitude: arrivalCoordsLong,
        description: arrivalDescription,
      },
      date,
      capacity,
      isFull: false,
      isDone: false,
    });
    const leaderData = {
      firstName: leader.firstName,
      lastName: leader.lastName,
      profilePicture: leader.profilePicture,
      rating: leader.averageRating,
      // languagesSpoken: leader.languagesSpoken,
    };
    newTrip.save().then(
      // enregistre le trip en db, puis renvoie les infos pour le frontend
      res.json({
        result: true,
        trip: {
          token,
          leaderData,
          departureCoordsLat,
          departureCoordsLong,
          arrivalCoordsLat,
          arrivalCoordsLong,
          arrivalDescription,
          date,
          capacity,
        },
      })
    );
  });
});

router.put("/addPassenger", (req, res) => {
  const { tripToken, passengerToken } = req.body;
  // const filter = { token: tripToken }; // trouve un trip avec son token

  Trip.findOne({ token: tripToken }).then((trip) => {
    // si le trip est complet, stop
    if (trip.isFull) {
      console.log(trip);
      res.json({
        result: false,
        error: "trip is full",
      });
      return;
    }

    // si le trip n'est pas complet, ajoute un nouveau passager
    // add user.find here
    User.findOne({ token: passengerToken }).then((user) => {
      console.log(user);
      
      const newPassenger = {
        isLeader: false,
        passengerToken,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        rating: user.averageRating,
        languagesSpoken: user.languagesSpoken,
        // $push: { languagesSpoken: user.languagesSpoken[0] },
      };
  
      // ajoute un nouveau passager au tableau "passengers"
      Trip.updateOne(
        { token: tripToken },
        { $push: { passengers: newPassenger } }
      ).then((tripInfo) => {
        if (tripInfo.modifiedCount === 0) {
          // n'a pas pu ajouter un passager au trip (ne devrait pas arriver sous conditions normales)
          res.json({
            result: false,
            error: "could not add passenger to trip",
            tripInfo,
          });
        } else {
          // a bien ajouté un passager au trip
          res.json({
            result: true,
            tripInfo,
          });
          if (trip.passengers.length + 1 >= trip.capacity) {
            // si le trip + le nouveau passager atteint la capacité max, isFull devient true
            Trip.updateOne({ token: tripToken }, { isFull: true }).then();
          }
        }
      });
    });

    });
});

// supprimer un passager d'un trip
router.put("/removePassenger", (req, res) => {
  const { tripToken, passengerToken } = req.body;
  const filter = { token: tripToken }; // trouve un trip avec son token

  Trip.updateOne(
    { filter },
    { $pull: { passengers: { passengerToken } } } // supprime un passager avec son token
  ).then((tripInfo) => {
    // passe isFull à false
    Trip.updateOne({ filter }, { isFull: false }).then(
      res.json({
        result: true,
        tripInfo,
      })
    );
  });
});

// supprimer un trip
router.delete("/removeTrip", (req, res) => {
  const { tripToken } = req.body;
  Trip.deleteOne({ token: tripToken }).then((deletedTrip) =>
    res.json({
      result: true,
      deletedTrip,
    })
  );
});

// chercher des trips
router.put("/search", (req, res) => {
  // take search parameters: date, departure, destination
  // output the non-full trips closest to your destination
  if (
    !checkFieldsRequest(req.body, [
      "departureCoordsLat",
      "departureCoordsLong",
      "arrivalCoordsLat",
      "arrivalCoordsLong",
      "minDate",
      "maxDate",
      "maxDist",
    ])
  ) {
    res.json({
      // si un des champs est vide, stop
      result: false,
      error: "Missing or empty fields",
    });
    return;
  }

  const {
    departureCoordsLat,
    departureCoordsLong,
    arrivalCoordsLat,
    arrivalCoordsLong,
    minDate,
    maxDate,
    maxDist,
  } = req.body;
  // cherche seulement les trips pas finis
  Trip.find({ isDone: false }).then((tripsFound) => {
    let tripsFoundResult = [];
    let sortedResult = [];
    for (let tripFound of tripsFound) {
      let dist = getDistFromCoords(
        tripFound.arrivalCoords.latitude,
        tripFound.arrivalCoords.longitude,
        arrivalCoordsLat,
        arrivalCoordsLong
      );

      let minDateFormatted = moment(minDate, "DD/MM/YYYY HH:mm").toDate(); // local date
      let maxDateFormatted = moment(maxDate, "DD/MM/YYYY HH:mm").toDate(); // local date
      // expects: "20/01/2020 09:15" (local)

      if (
        dist <= maxDist &&
        tripFound.date >= minDateFormatted &&
        tripFound.date <= maxDateFormatted
      ) {
        // push seulement les trips inférieurs ou égaux à la maxDist ET avant la date/heure max (paramétrés par l'utilisateur)
        tripsFoundResult.push({
          tripFoundToken: tripFound.token,
          date: tripFound.date,
          passengers: tripFound.passengers,
          passengersNumber: tripFound.passengers.length,
          capacity: tripFound.capacity,
          arrivalCoords: tripFound.arrivalCoords,
          distToDestination: dist,
        });
      }
    }

    // 0 trip a été trouvé avec ces critères
    if (tripsFoundResult.length === 0) {
      res.json({
        result: false,
        error: "could not find any trip, please revise your search parameters",
      });
      return;
    }

    // trie les résultats du plus proche au plus loin de la destination
    sortedResult = tripsFoundResult.sort(
      (a, b) => a.distToDestination - b.distToDestination
    );

    res.json({
      result: true,
      sortedResult,
    });
  });
});

module.exports = router;
