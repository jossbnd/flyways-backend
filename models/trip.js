const mongoose = require('mongoose');
 
const tripSchema = mongoose.Schema({
    username: String,
    usernameFormatted: String,
    password: String,
    token: String,
});
 
const Trip = mongoose.model("trips", tripSchema);
 
module.exports = Trip;
