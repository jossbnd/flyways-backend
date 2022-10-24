const express = require("express");
const router = express.Router();
const Discussion = require("../models/discussion");


router.get("/", function(req, res, next) {
  res.send("flyways discussions index");
});

router.get("/all", function (req, res, next) {
  Discussion.find().then((allDiscussions) =>
    res.json({
      allDiscussions,
    })
  );

});

module.exports = router;
