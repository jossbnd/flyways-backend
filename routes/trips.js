const express = require("express");
const router = express.Router();
const Trip = require("../models/trip");
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
    date,
    capacity,
  } = req.body;

  const token = uid2(32);

  const newTrip = new Trip({
    token,
    passengers: { passengerToken, isLeader: true }, // l'utilisateur qui créée le trip est leader
    departureCoords: {
      latitude: departureCoordsLat,
      longitude: departureCoordsLong,
    },
    arrivalCoords: { latitude: arrivalCoordsLat, longitude: arrivalCoordsLong },
    date: new Date(),
    capacity,
    isFull: false,
    isDone: false,
  });
  newTrip.save().then(
    // enregistre le trip en db, puis renvoie les infos pour le frontend
    res.json({
      result: true,
      trip: {
        token,
        // passengers,  FIXME: crashes the backend
        departureCoordsLat,
        departureCoordsLong,
        arrivalCoordsLat,
        arrivalCoordsLong,
        date,
        capacity,
      },
    })
  );
});

router.put("/addPassenger", (req, res) => {
  const { tripToken, passengerToken } = req.body;
  const filter = { token: tripToken }; // trouve un trip avec son token

  Trip.findOne({ filter }).then((trip) => {
    // si le trip est complet, stop
    if (trip.isFull) {
      res.json({
        result: false,
        error: "trip is full",
      });
      return;
    }

    // si le trip n'est pas complet, ajoute un nouveau passager
    const newPassenger = {
      passengerToken,
      isLeader: false,
    };

    // ajoute un nouveau passager au tableau "passengers"
    Trip.updateOne({ filter }, { $push: { passengers: newPassenger } }).then(
      (tripInfo) => {
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
            Trip.updateOne({ filter }, { isFull: true }).then();
          }
        }
      }
    );
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
      "date",
      "departureCoordsLat",
      "departureCoordsLong",
      "arrivalCoordsLat",
      "arrivalCoordsLong",
    ])
  ) {
    res.json({
      // si un des champs est vide, stop
      result: false,
      error: "Missing or empty fields",
    });
    return;
  }

  const { departureCoordsLat, departureCoordsLong, arrivalCoordsLat, arrivalCoordsLong } = req.body;
  // trouve les trips pas finis
  // push trips into array then sort them depending on distance
  Trip.find({ isDone: false }).then((tripsFound) => {
    let tripsFoundArray = [];
    res.json({ tripsFound });
    for (let tripFound of tripsFound) {
      let dist = getDistFromCoords(tripFound.arrivalCoords.latitude, tripFound.arrivalCoords.longitude, arrivalCoordsLat, arrivalCoordsLong);
      tripsFoundArray.push(
        {tripFoundToken: tripFound.token, distToDestination: dist}
      );
    }
    // sort array by disToDestination (lowest to largest)
    // console.log(tripsFoundArray);
    tripsFoundArray.sort((a, b) => b.distToDest - a.distToDestination)
    console.log(tripsFoundArray.sort((a, b) => a.distToDest - b.distToDestination));
  });
});

module.exports = router;
