const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const User = require("../models/user");

//Routes
// POST /post: poster une nouvelle review

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
      User.findOneAndUpdate(
        { token: userToken },
        { $push: { reviews: reviewData._id } }
      ).then((userData) => {
        let newAverage;
        if (userData.averageRating) {
          const actualAverage = userData.averageRating;
          const reviewsCount = userData.reviews.length;
          console.log(reviewsCount);

          newAverage =
            Math.round(
              ((actualAverage * reviewsCount + Number(score)) /
                (reviewsCount + 1)) *
                10
            ) / 10;
        } else {
          newAverage = score;
        }

        User.updateOne(
          { token: userToken },
          { averageRating: newAverage }
        ).then((updatedData) => {
          if (updatedData.modifiedCount) {
            res.json({ result: true, msg: "New review posted!" });
          } else {
            res.json({ result: false, error: "User not updated" });
          }
        });
      });
    }
  });
});

module.exports = router;
