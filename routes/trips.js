const express = require("express");
const router = express.Router();
const Trip = require("../models/trip");

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

module.exports = router;
