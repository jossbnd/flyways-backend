const mongoose = require("mongoose");

const passengerSchema = mongoose.Schema({
  isLeader: Boolean,
  passengerToken: String,
  firstName: String || null,
  lastName: String || null,
  profilePicture: String || null,
  rating: Number || null,
  languagesSpoken: [String] || null,
});

const coordSchema = mongoose.Schema({
  latitude: Number,
  longitude: Number,
  description: String,
});

const messageSchema = mongoose.Schema({
  userToken: String, 
  firstName: String, 
  lastName: String, 
  text: String,
  date: Date
})

const tripSchema = mongoose.Schema({
  token: String,
  passengers: [passengerSchema], // tableau de tokens
  departureCoords: coordSchema || null,
  arrivalCoords: coordSchema || null,
  date: Date,
  capacity: Number,
  isFull: Boolean,
  isDone: Boolean,
  messages: [messageSchema]
});

const Trip = mongoose.model("trips", tripSchema);

module.exports = Trip;
