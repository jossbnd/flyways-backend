const express = require("express");
const router = express.Router();
const Discussion = require("../models/discussion");


router.get("/", (req, res) => {
  res.send("flyways discussions index");
});

router.get("/all", (req, res) => {
  Discussion.find().then((allDiscussions) =>
    res.json({
      allDiscussions,
    })
  );

});

module.exports = router;
