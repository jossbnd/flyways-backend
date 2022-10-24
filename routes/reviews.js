const express = require("express");
const router = express.Router();
const Review = require("../models/review");


router.get("/", (req, res) => {
  res.send("flyways reviews index");
});

router.get("/all", (req, res) => {
  Review.find().then((allReviews) =>
    res.json({
      allReviews,
    })
  );

});


module.exports = router;
