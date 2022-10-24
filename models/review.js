const mongoose = require("mongoose");

const reviewSubdocSchema = mongoose.Schema({
  authorToken: String, // utilisateur qui laisse l'avis
  score: Number,
  text: String,
});

const reviewSchema = mongoose.Schema({
  userToken: String, // utilisateur qui est noté
  reviews: [reviewSubdocSchema],
});

const Review = mongoose.model("reviews", reviewSchema);

module.exports = Review;
