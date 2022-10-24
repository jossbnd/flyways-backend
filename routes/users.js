const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const User = require("../models/user");

router.get("/", function (req, res, next) {
  res.send("flyways users index");
});

router.get("/all", function (req, res, next) {
  User.find().then((allUsers) =>
    res.json({
      allUsers,
    })
  );

});

module.exports = router;
