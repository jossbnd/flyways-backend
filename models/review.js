const mongoose = require('mongoose');
 
const reviewSchema = mongoose.Schema({
    username: String,
    usernameFormatted: String,
    password: String,
    token: String,
});
 
const Review = mongoose.model("reviews", reviewSchema);
 
module.exports = Review;
