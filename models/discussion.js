const mongoose = require('mongoose');
 
const messageSchema = mongoose.Schema({
    firstName: String,
    token: String,
    date: Date,
    text: String,
})

const discussionSchema = mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" } || null],
  trip: [{ type: mongoose.Schema.Types.ObjectId, ref: "trips" } || null],
  messages: [messageSchema],
});
 
const Discussion = mongoose.model("discussions", discussionSchema);
 
module.exports = Discussion;
