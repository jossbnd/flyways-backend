const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const User = require("../models/user");

//Routes
// GET /all: récupérer toutes les reviews
// POST /post: poster une nouvelle review

// récupérer toutes les reviews
router.get("/all", (req, res) => {
  Review.find().then((allReviews) =>
    res.json({
      allReviews,
    })
  );
});

// route pour poster une review (:userToken => personne notée)
router.post("/post/:userToken", (req, res) => {
  const { userToken } = req.params;
  const { authorToken, score, text, date } = req.body;

  if (!authorToken || !score) {
    res.json({ result: false, error: "Missing or empty fields" });
  }

  const newReview = new Review({
    userToken, // utilisateur qui est noté
    authorToken, // utilisateur qui laisse l'avis
    score,
    text,
    date,
  });

  newReview.save().then((reviewData) => {
    if (!reviewData) {
      res.json({ result: false, error: "Error, review not posted" });
    } else {
      User.updateOne(
        { token: userToken },
        { $push: { reviews: reviewData._id } }
      ).then((userData) => {
        if (userData.modifiedCount) {
          res.json({ result: true, msg: "New review posted!" });
        } else {
          res.json({ result: false, error: "User not updated" });
        }
      });
    }
  });
});

module.exports = router;
