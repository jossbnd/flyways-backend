const mongoose = require('mongoose');
 
const discussionSchema = mongoose.Schema({
    username: String,
    usernameFormatted: String,
    password: String,
    token: String,
});
 
const Discussion = mongoose.model("discussions", discussionSchema);
 
module.exports = Discussion;
