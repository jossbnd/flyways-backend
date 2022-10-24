const express = require("express");
const router = express.Router();
const Review = require("../models/review");


router.get("/", function(req, res, next) {
  res.send("flyways reviews index");
});

router.get("/all", function (req, res, next) {
  Review.find().then((allReviews) =>
    res.json({
      allReviews,
    })
  );

});


module.exports = router;
