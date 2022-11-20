const express = require("express");
const router = express.Router();
const Discussion = require("../models/discussion");

// NOTE: ces routes ne sont finalement pas utilisées, les discussions ont été intégrées aux trips
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
