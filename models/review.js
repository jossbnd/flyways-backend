const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema({
  userToken: String, // utilisateur qui est noté
  authorToken: String, // utilisateur qui laisse l'avis
  score: Number,
  text: String,
  date: Date,
});

const Review = mongoose.model("reviews", reviewSchema);

module.exports = Review;
