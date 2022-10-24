const express = require("express");
const router = express.Router();
const Trip = require("../models/trip");

router.get("/", function(req, res, next) {
  res.send("flyways trips index");
});

router.get("/all", function (req, res, next) {
  Trip.find().then((allTrips) =>
    res.json({
      allTrips,
    })
  );

});

module.exports = router;
