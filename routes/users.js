const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const User = require("../models/user");

const {
  checkFieldsRequest,
  checkFields,
} = require("../modules/checkFieldsRequire");
const { testPassword } = require("../modules/passwordValidityCheck");

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

// liste des checks (dans cet ordre):
// -tous les champs sont bien remplis
// -dob est bien une date JS
// -email pas pris
// -password valide
router.post("/signup", (req, res) => {
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

    // check la validité du password
    if (!testPassword(password)) {
      res.json({
        result: false,
        msg: "Invalid password: must be 6-20 characters long, include at least one lower case, one upper case, one digit, and no white space",
      });
      return;
    }

    // les champs sont remplis, l'email n'est pas pris, et le password est valide: enregistre le nouvel utilisateur
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

router.post("/signin", (req, res) => {
  if (!checkFieldsRequest(req.body, ["password", "email"])) {
    res.json({
      // si un des champs est vide, stop
      result: false,
      msg: "Missing or empty fields",
    });
    return;
  }

  const { email, password } = req.body;
  const emailFormatted = email.toLowerCase();

  User.findOne({
    // cherche l'email dans la db
    email: emailFormatted,
  }).then((findUser) => {
    if (!findUser) {
      // si l'email n'existe pas, stop
      res.json({
        result: false,
        msg: "email not found",
      });
      return;
    } else if (!bcrypt.compareSync(password, findUser.password)) {
      // si l'email existe mais le password est incorrect, stop
      res.json({
        result: false,
        msg: "Incorrect password",
      });
      return;
    } else {
      // l'email existe et le passwordest correct, signin
      // on renvoie le token, firstName et lastName pour pouvoir les utiliser sur le frontend
      res.json({
        result: true,
        msg: `user ${findUser.firstName} ${findUser.lastName} signed in`,
        token: findUser.token,
        firstName: findUser.firstName,
        lastName: findUser.lastName,
      });
    }
  });
});

module.exports = router;
