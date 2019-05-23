"use strict";

require('dotenv').config();

const PORT        = process.env.PORT || 8080;
const ENV         = process.env.ENV || "development";
const express     = require("express");
const bodyParser  = require("body-parser");
const sass        = require("node-sass-middleware");
const app         = express();

const knexConfig  = require("./knexfile");
const knex        = require("knex")(knexConfig[ENV]);
const morgan      = require('morgan');
const knexLogger  = require('knex-logger');

// Seperated Routes for each Resource
const usersRoutes = require("./routes/users");

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));

// Log knex SQL queries to STDOUT as well
app.use(knexLogger(knex));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static("public"));

// Mount all resource routes
app.use("/api/users", usersRoutes(knex));

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/newevent", (req, res) => {
  res.render("newevent");
});

app.post("/newevent", (req, res) => {
  console.log("receiving request")
  knex('events').insert({
    title: req.body.title,
    description: req.body.description,
    // location: req.body.location
  }).asCallback((err, result) => {
   if (err) {
    return console.error("Connection Error", err);
  }
  console.dir(result);
  res.send("Got it");
  // req.body.name
  // req.body.email
});
});

app.get("/:eventID/times", (req, res) => {
  res.render("times");
});

app.get("/:eventID/url", (req, res) => {
  res.render("url");
});

app.get("/:sharedurl", (req, res) => {
  res.render("option");
});


app.post("/:eventID/times", (req, res) => {
  console.log("receiving request")
  console.log(req.body)
  knex('options').insert({
    time: req.body.date,
  }).asCallback((err, result) => {
   if (err) {
    return console.error("Connection Error", err);
  }
  console.dir(result);
  res.send("Got it");
});
});


app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});
