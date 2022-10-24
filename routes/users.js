const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const User = require("../models/user");

const {
  checkFieldsRequest,
  checkFields,
} = require("../modules/checkFieldsRequire");

router.get("/", (req, res) => {
  res.send("flyways users index");
});

router.get("/all", (req, res) => {
  User.find().then((allUsers) =>
    res.json({
      allUsers,
    })
  );
});

router.post("/signup", async (req, res) => {
  // check si un champ est vide
  if (
    !checkFieldsRequest(req.body, [
      "firstName",
      "lastName",
      "password",
      "email",
      "dob",
    ])
  ) {
    res.json({
      // si un des champs est vide, stop
      result: false,
      msg: "Missing or empty fields",
    });
    return;
  }

  // destructuration
  const { firstName, lastName, password, email, dob } = req.body;
  const emailFormatted = email.toLowerCase(); // met email en minuscule pour les checks

  // TODO: check typeof dob, only accept date
  // if (typeof dob !== "date") {
  //   res.json({
  //     result: false,
  //     msg: "date invalid (wrong format)",
  //   });
  //   return;
  // }
  console.log(typeof dob);

  // check si l'email est pris
  User.findOne({
    email: emailFormatted,
  }).then((emailTaken) => {
    if (emailTaken) {
      // si l'email est pris, stop
      res.json({
        result: false,
        msg: "Email is already taken",
      });
      return;
    }

    // les champs sont remplis et l'email n'est pas pris: enregistre le nouvel utilisateur
    const hash = bcrypt.hashSync(password, 10);
    const token = uid2(32);

    const newUser = new User({
      firstName,
      lastName,
      dob,
      email: emailFormatted,
      password: hash,
      token,

      // null par défault: pourront être renseignés par l'utilisateur plus tard
      phone: { number: null, isVerified: false },
      gender: null,
      nationality: null,
      profilePicture: null,
      bankInfo: null,
      averageRating: null,
    });
    newUser.save().then(
      // l'utilisateur a été enregistré, on renvoie firstName, lastName et token pour les utiliser sur le frontend
      res.json({
        result: true,
        msg: `user ${firstName} ${lastName} saved`,
        firstName,
        lastName,
        token,
      })
    );
  });
});

module.exports = router;
