const express = require("express");
const router = express.Router();
const Trip = require("../models/trip");
const uid2 = require("uid2");

// liste des routes:
// /all: montre tous les trips
// /create: créer un nouveau trip
// /addPassenger: ajouter un passager à un trip

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
  const { passengerToken, departureAddress, arrivalAddress, date, capacity } =
    req.body;

  const token = uid2(32);

  const newTrip = new Trip({
    token,
    passengers: { passengerToken, isLeader: true }, // l'utilisateur qui créée le trip est leader
    departureAddress: null,
    arrivalAddress: null,
    date,
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
        departureAddress,
        arrivalAddress,
        date,
        capacity,
      },
    })
  );
});

// ajouter un passenger à un trip
router.post("/addPassenger", (req, res) => {
  const { tripToken, passengerToken } = req.body;

  Trip.findOne({ token: tripToken }).then((trip) => {
    // si le trip est complet, stop
    // TODO: éviter de faire 2 fetchs
    if (trip.isFull) {
      res.json({
        result: false,
        error: "trip is full",
      });
      return;
    }

    const newPassenger = {
      passengerToken,
      isLeader: false,
    };

    Trip.updateOne(
      {
        token: tripToken, // trouve un trip avec son token
      },
      {
        $push: { passengers: newPassenger }, // ajoute un nouveau passager au tableau "passengers"
      }
    ).then((tripInfo) => {
      if (tripInfo.modifiedCount === 0) {
        // n'a pas pu ajouter un passager au trip (ne devrait pas arriver sous conditions normales)
        res.json({
          result: false,
          error: "could not add passenger to trip",
          tripInfo,
        });
      } else {
        // a ajouté un passager au trip
        res.json({
          result: true,
          tripInfo,
        });
        console.log(trip.capacity)
        console.log(trip.passengers.length+1)
        // TODO: change isFull to true if trip is full
      }
    });
  });
});

// supprimer un passager d'un trip
router.put("/removePassenger", (req, res) => {
  const { tripToken, passengerToken } = req.body;
  Trip.findOneAndUpdate(
    {
      token: tripToken,
    },
    {
      $pull: { passengers: { passengerToken } },
    }
  ).then((tripInfo) => {
    res.json({
      result: true,
      tripInfo,
    });
  });
});

module.exports = router;
