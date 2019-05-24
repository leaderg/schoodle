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
  knex('users').insert({
    name: req.body.name,
    email: req.body.email
  }, 'id').asCallback((err, result) => {
    console.log(result);
    if (err) {
      return console.error("Connection Error", err);
    }
    knex('events').insert({
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      creatorID: result[0],
      url: generateRandomString()
    }, 'url').asCallback((err, result) => {
      if (err) {
        return console.error("Connection Error", err);
      }
      console.dir(result);
      res.redirect(`${result[0]}/dates`);
    });
  });
});



app.get("/events/:eventID/url", (req, res) => {
  res.render("url");
});












app.get("/events/:eventID/dates", (req, res) => {
  console.log(req.params)
  knex.select('id').from('events').where('url', req.params.eventID).asCallback((err, result) => {
    if (err) {
      throw err;
    } else {
      let templateVars = { id: result };
      console.log(templateVars);
      res.render("dates", templateVars);
    }
  });
});

app.get("/events/:eventID/times", (req, res) => {
  console.log(req.params)
  knex.select('*').from('date').where('eventID', 2).asCallback((err, result) => {
    if (err) {
      throw err;
    } else {
      let templateVars = { dates: result };
      console.log(templateVars);
      res.render("times", templateVars);
    }
  });
});

app.post("/events/:eventID/times", (req, res) => {
  console.log(req.body);
  let results = req.body;
  for (let ids in results){
    console.log("ids", ids)
    for (let i = 0; i < results[ids].length; i++){
      knex('time').insert({
        dateID : ids,
        start_time: results[ids][i]
      }).asCallback((err, result) => {
        if(err){
          throw err;
        }
      });
    }
  }
  res.send("ok");
});

app.post("/events/:eventID/dates", (req, res) => {
  console.log(req.body);
  for (let id in req.body){
    for (let element of req.body[id].split(",")){
      console.log('id', id, 'date', element)
      knex('date').insert({
          eventID: id,
          date: element
        }).asCallback((err, result) => {
         if (err) {
          return console.error("Connection Error", err);
        }
      });
    }
  }

  res.redirect(`/${req.params.eventID}/times`);
});











app.get("/events/:sharedurl", (req, res) => {
  res.render("option");
});

app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});



function generateRandomString() {
   let result           = '';
   let characters       = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
   let charactersLength = characters.length;
   for ( let i = 0; i < 6; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   };
   return result;
};

