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

// Initialisation de Pusher
const Pusher = require("pusher");
const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// liste des routes:
// GET /all: montre tous les trips
// POST /create: créée un nouveau trip
// PUT /addPassenger: ajoute un passager à un trip
// PUT /removePassenger: supprime un passager d'un trip
// DELETE /removeTrip: supprime un trip
// PUT /search: chercher des trips
// POST /postmessage: nouveau message dans le chat du trip

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
      "departureDescription",
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
    departureDescription,
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
        description: departureDescription,
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
      messages: [],
    });
    const leaderData = {
      firstName: leader.firstName,
      lastName: leader.lastName,
      profilePicture: leader.profilePicture,
      rating: leader.averageRating,
    };

    // push le trip dans le tableau trips de l'utilisateur
    User.updateOne(
      { token: passengerToken },
      { $push: { trips: newTrip._id } }
    ).then();

    newTrip.save().then(
      // enregistre le trip en db, puis renvoie les infos pour le frontend
      res.json({
        result: true,
        trip: {
          newTripId: newTrip._id,
          token,
          leaderData,
          departureCoordsLat,
          departureCoordsLong,
          arrivalCoordsLat,
          arrivalCoordsLong,
          arrivalDescription,
          date,
          capacity,
          messages: [],
        },
      })
    );
  });
});

router.put("/addPassenger", (req, res) => {
  const { tripId, passengerToken } = req.body;

  Trip.findOne({ _id: tripId }).then((trip) => {
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
    User.findOneAndUpdate(
      { token: passengerToken }, // trouve un utilisateur avec son token
      { $push: { trips: tripId } } // push le trip dans son tableau
    ).then((user) => {
      console.log(user);

      const newPassenger = {
        isLeader: false,
        passengerToken,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        rating: user.averageRating,
        languagesSpoken: user.languagesSpoken,
      };

      // ajoute un nouveau passager au tableau "passengers"
      Trip.updateOne(
        { _id: tripId },
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
            Trip.updateOne({ _id: tripId }, { isFull: true }).then();
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
      "rangeTime",
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
    maxDist,
    rangeTime,
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

      let maxDateFormatted = moment(minDateFormatted)
        .add(rangeTime, "m")
        .toDate();
      console.log(maxDateFormatted);

      // expects: "20/01/2020 09:15" (local)

      if (
        dist <= maxDist &&
        tripFound.date >= minDateFormatted &&
        tripFound.date <= maxDateFormatted
      ) {
        // push seulement les trips inférieurs ou égaux à la maxDist ET avant la date/heure max (paramétrés par l'utilisateur)
        tripsFoundResult.push({
          tripId: tripFound._id,
          tripFoundToken: tripFound.token,
          date: tripFound.date,
          passengers: tripFound.passengers,
          passengersNumber: tripFound.passengers.length,
          capacity: tripFound.capacity,
          arrivalCoords: tripFound.arrivalCoords,
          departureCoords: tripFound.departureCoords,
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

// post a message on the trip discussions
router.post("/postmessage/:token", (req, res) => {
  const message = req.body;
  const { token } = req.params;

  pusher.trigger(token, "message", message);

  Trip.updateOne({ token }, { $push: { messages: message } }).then((data) => {
    if (data.modifiedCount) {
      console.log(data);
      res.json({ result: true, msg: "new message posted on trip discussion" });
    } else {
      res.json({ result: false, error: "error - message not posted" });
    }
  });
});

// Join chat
router.put("/joinchat/:token", (req, res) => {
  const { token } = req.params;
  const { firstName, lastName } = req.body;

  pusher.trigger(token, "join", {
    firstName,
    lastName,
  });

  res.json({ result: true });
});

// Leave chat
router.delete("/leavechat/:token", (req, res) => {
  const { token } = req.params;
  const { firstName, lastName } = req.body;

  pusher.trigger(token, "leave", {
    firstName,
    lastName,
  });

  res.json({ result: true });
});

module.exports = router;
