const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const moment = require("moment");
const User = require("../models/user");

// liste des routes:
// GET /all: montre tous les utilisateurs
// POST /signup: enregistrer un nouvel utilisateur
// POST /signin: se connecter
// GET /info: cherche les infos utilisateur pour le profil
// PUT /update: mettre à jour une donnée simple utilisateur
// PUT /verify: vérifie un utilisateur
// PUT /updatePaymentMethod: met à jour le moyen de paiement
// DELETE /delete: supprime un utilisateur

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
      error: "Missing or empty fields",
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

  // check si l'email est pris
  User.findOne({
    email: emailFormatted,
  }).then((emailTaken) => {
    if (emailTaken) {
      // si l'email est pris, stop
      res.json({
        result: false,
        error: "Email is already taken",
      });
      return;
    }

    // check la validité du password
    if (!testPassword(password)) {
      res.json({
        result: false,
        error:
          "Invalid password: must be 6-20 characters long, include at least one lower case, one upper case, one digit, and no white space",
      });
      return;
    }

    // les champs sont remplis, l'email n'est pas pris, et le password est valide: enregistre le nouvel utilisateur
    const hash = bcrypt.hashSync(password, 10);
    const token = uid2(32);

    // transforme la date (string) en date JS
    const dobLocal = moment(dob, "DD/MM/YYYY").toDate(); // local date
    const t = dobLocal.getTimezoneOffset(); // calcule la différence entre UTC et local
    const dobMidnightUtc = new Date(dobLocal.getTime() - t * 60000); // stocke la date de naissance en UTC minuit

    const newUser = new User({
      firstName,
      lastName,
      dob: dobMidnightUtc,
      email: emailFormatted,
      password: hash,
      token,

      // null par défault: pourront être renseignés par l'utilisateur plus tard
      // phone: { number: null, isVerified: false },
      phone: null,
      isVerified: null,
      languagesSpoken: [],
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
        user: {
          firstName,
          lastName,
          token,
        },
      })
    );
  });
});

// liste des checks (dans cet ordre):
// -les champs sont remplis
// -l'email existe dans la db
// -le password correspond
router.post("/signin", (req, res) => {
  if (!checkFieldsRequest(req.body, ["password", "email"])) {
    res.json({
      // si un des champs est vide, stop
      result: false,
      error: "Missing or empty fields",
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
        error: "email not found",
      });
      return;
    } else if (!bcrypt.compareSync(password, findUser.password)) {
      // si l'email existe mais le password est incorrect, stop
      res.json({
        result: false,
        error: "Incorrect password",
      });
      return;
    } else {
      // l'email existe et le passwordest correct, signin
      // on renvoie le token, firstName et lastName pour pouvoir les utiliser sur le frontend
      res.json({
        result: true,
        user: {
          token: findUser.token,
          firstName: findUser.firstName,
          lastName: findUser.lastName,
        },
      });
    }
  });
});

// cherche les infos utilisateur du profil
router.get("/info/:token", (req, res) => {
  const { token } = req.params;

  if (!token) {
    // s'il manque le token, stop (ne devrait pas arriver sous des conditions normales car géré par le frontend)
    res.json({
      result: false,
      error: "no user token",
    });
    return;
  }

  User.findOne({ token })
  .populate("trips")
  .populate("reviews")
  .then((userData) => {
    res.json({
      result: true,
      user: {
        gender: userData.gender,
        dob: userData.dob,
        languagesSpoken: userData.languagesSpoken,
        nationality: userData.nationality,
        profilePicture: userData.profilePicture,
        trips: userData.trips,
        averageRating: userData.averageRating,
        reviews: userData.reviews,
      },
    });
  });
});


// mettre à jour une donnée d'utilisateur simple (photo de profil, date de naissance, etc)
router.put("/update/:token", (req, res) => {
  const { phone, gender, dob, nationality, profilePicture } = req.body;
  const { token } = req.params;

  // met à jour une donnée simple en fonction de ce qu'il y a dans la requête
  if (phone) {
    User.updateOne({ token }, { phone, isVerified: false }).then(
      res.json({
        result: true,
        msg: "user phone updated",
      })
    );
  } else if (gender) {
    User.updateOne({ token }, { gender }).then(
      res.json({
        result: true,
        msg: "user gender updated",
      })
    );
  } else if (dob) {
    User.updateOne({ token }, { dob }).then(
      res.json({
        result: true,
        msg: "user dob updated",
      })
    );
  } else if (nationality) {
    User.updateOne({ token }, { nationality }).then(
      res.json({
        result: true,
        msg: "user nationality updated",
      })
    );
  } else if (profilePicture) {
    User.updateOne({ token }, { profilePicture }).then(
      res.json({
        result: true,
        msg: "user profile picture updated",
      })
    );
  } else {
    res.json({
      // s'il manque la donnée à mettre à jour, erreur (ne devrait pas arriver sous conditions normales)
      result: false,
      error: "no data to update",
    });
  }
});

router.put("/verify/:token", (req, res) => {
  const { token } = req.params;

  User.updateOne({ token }, { isVerified: true }).then(
    res.json({
      result: true,
      msg: "user has been verified",
    })
  );
});

// create add/remove language route

// ajouter une carte de paiement
router.put("/updatePaymentMethod/:token", (req, res) => {
  if (
    !checkFieldsRequest(req.body, [
      "cardType",
      "firstName",
      "lastName",
      "cardNumber",
      "cvv",
    ])
  ) {
    res.json({
      // si un des champs est vide, stop
      result: false,
      error: "Missing or empty fields",
    });
    return;
  }

  const { cardType, firstName, lastName, cardNumber, cvv } = req.body;
  const { token } = req.params;

  const newPaymentMethod = {
    cardType,
    firstName,
    lastName,
    cardNumber,
    cvv,
  };

  // cherche un utilisateur avec son token, et assigne l'objet newPaymentMethod à bankInfo
  User.updateOne({ token }, { bankInfo: newPaymentMethod }).then(
    (addPaymentData) => {
      if (addPaymentData.modifiedCount === 0) {
        res.json({
          result: false,
          error: "could not add payment method",
        });
      } else {
        res.json({
          result: true,
          msg: "payment method added",
        });
      }
    }
  );
});

// supprimer un utilisateur
router.delete("/delete/:token", (req, res) => {
  if (!checkFieldsRequest(req.body, ["email"])) {
    res.json({
      // si un des champs est vide, stop
      result: false,
      error: "Missing or empty fields",
    });
    return;
  }

  const { token } = req.params

  User.deleteOne({
    token,
  }).then((deletedUser) => {
    if (deletedUser.deletedCount > 0) {
      res.json({
        result: true,
        msg: `user deleted`,
      });
    } else {
      res.json({
        result: false,
        error: `user not found`,
      });
    }
  });
});

module.exports = router;
