require("dotenv").config();

const connection = require("./models/connection");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const discussionsRouter = require("./routes/discussions");
const reviewsRouter = require("./routes/reviews");
const tripsRouter = require("./routes/trips");
const usersRouter = require("./routes/users");

const app = express();

// app.use()
app.use(helmet());
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.listen(3000);

// route prefixes
app.use("/", indexRouter);
app.use("/discussions", discussionsRouter);
app.use("/reviews", reviewsRouter);
app.use("/trips", tripsRouter);
app.use("/users", usersRouter);

module.exports = app;
