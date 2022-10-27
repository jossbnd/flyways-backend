const mongoose = require("mongoose");

const passengerSchema = mongoose.Schema({
  isLeader: Boolean,
  passengerToken: String,
  firstName: String || null,
  lastName: String || null,
  rating: Number || null,
  languagesSpoken: Array || null,
});

const airportInfoSchema = mongoose.Schema({
  name: String, // nom de l'aéroport
  terminal: String,
  gate: String,
});

// const addressSchema = mongoose.Schema({
//   name: String,
//   street: String,
//   streetNumber: String,
//   postalCode: String,
//   city: String,
//   region: String,
//   country: String,
//   additionalInfo: String,
//   airportInfo: airportInfoSchema,
// });

const coordSchema = mongoose.Schema({
  latitude: Number,
  longitude: Number,
  description: String,
})

const tripSchema = mongoose.Schema({
  token: String,
  // passengers: [{ type: mongoose.Schema.Types.ObjectId, ref: "trips" }], // le 1er passager est le leader
  passengers: [passengerSchema], // tableau de tokens
  departureCoords: coordSchema || null,
  arrivalCoords: coordSchema || null,
  date: Date,
  capacity: Number,
  isFull: Boolean,
  isDone: Boolean,
});

const Trip = mongoose.model("trips", tripSchema);

module.exports = Trip;
