require("dotenv").config();
 
const mongoose = require('mongoose');
 
const connectionString = process.env.CONSTR + process.env.DB;
 
mongoose.connect(connectionString, {connectTimeoutMS: 2000})
    .then(() => console.log(`connected to ${process.env.DB} database`))
    .catch(error => console.error(error));
