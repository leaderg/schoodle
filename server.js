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
      res.redirect(`events/${result[0]}/dates`);
    });
  });
});




app.get("/events/:eventID/url", (req, res) => {

  res.render("url");
});

app.get("/events/:sharedurl", (req, res) => {
  let templatevars = {};
  let targetEvent = req.params.sharedurl;
  knex('events').where({url: targetEvent})
  .then( x => {
    templatevars.eventTitle = x[0].title;
    templatevars.eventDescription = x[0].description;
    templatevars.eventLocation = x[0].location;
    return x[0].id;
  })
  .then( y => {
    knex('options').where({events_id: y}).then( output => {
      templatevars.datedata = output;
      console.log(templatevars);
      res.render('option', templatevars);
    });
  });
});









app.get("/events/:eventID/dates", (req, res) => {
  console.log(req.params)
  knex.select('id').from('events').where('url', req.params.eventID).asCallback((err, result) => {
    if (err) {
      throw err;
    } else {
      let templateVars = { id: result,
                           url: req.params.eventID };
      console.log("templateVars",templateVars);
      res.render("dates", templateVars);
    }
  });
});

app.get("/events/:eventID/times", (req, res) => {
console.log("test 1");
  knex.select('id').from('events').where('url', req.params.eventID).asCallback((err,result)=>{
    if (err) {
console.log("err")
      throw err;
    } else {
console.log("test 2", result[0].id)
      knex.select('*').from('date').where('eventID', result[0].id).asCallback((err, result) => {
        if (err) {
console.log("err 2")
          throw err;
        } else {
console.log("test 3")
          let templateVars = { dates: result };
          console.log(templateVars);
          res.render("times", templateVars);
        }
      });
    }
  });
});

app.post("/events/:eventID/times", (req, res) => {

  let results = req.body;
  for (let ids in results){
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

app.post("/events/:eventID/:id/dates", (req, res) => {
  let id = Number(req.params.id);
  console.log('params',req.params);
  // console.log('body',req.body)
  console.log(id,typeof(id))

  for (let element of req.body[id].split(",")){
    let rows = [{
                  eventID: id,
                  date: element
                }];
    knex.batchInsert('date', rows)
        .then((result) => {
          console.log("test on the then")
          res.redirect(`/events/${req.params.eventID}/times`);
          })
        .catch((err)=>{
          return console.error("Connection Error", err);
        });
  }
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

