const mongoose = require("mongoose");

// subdocument models

const bankInfoSchema = mongoose.Schema({
  cardType: String,
  firstName: String,
  lastName: String,
  cardNumber: String,
  expDate: Date,
  cvv: Number,
});

const airportInfoSchema = mongoose.Schema({
  name: String, // nom de l'aéroport
  terminal: String,
  gate: String,
});

const addressSchema = mongoose.Schema({
  name: String,
  street: String,
  streetNumber: String,
  postalCode: String,
  city: String,
  region: String,
  country: String,
  additionalInfo: String,
  airportInfo: airportInfoSchema,
});

// les champs qui comportent "|| null" sont null par défault lors de la création d'un utilisateur
const userSchema = mongoose.Schema({
  token: String,
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  phone: String || null,
  isVerified: Boolean,
  gender: String || null,
  dob: Date || String, // date of birth
  languagesSpoken: Array,
  nationality: String || null,
  profilePicture: String || null, // url
  trips: [{ type: mongoose.Schema.Types.ObjectId, ref: "trips" } || null],
  bankInfo: bankInfoSchema || null,
  addresses: [addressSchema] || null,
  discussions: [{ type: mongoose.Schema.Types.ObjectId, ref: "discussions" } || null],
  averageRating: Number || null,
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "reviews" } || null],
});

const User = mongoose.model("users", userSchema);

module.exports = User;
