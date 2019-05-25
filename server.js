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
const cookieSession = require('cookie-session');

// Seperated Routes for each Resource
const usersRoutes = require("./routes/users");

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));

// Log knex SQL queries to STDOUT as well
app.use(knexLogger(knex));

//Sets up cookies
app.use(cookieSession({
  name: 'session',
  keys: ['key1'],
  maxAge: 24 * 60 * 60 * 1000
}));

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
  let genCookie = generateRandomString();
  req.session.cookie_id = genCookie;
  knex('users').insert({
    name: req.body.name,
    email: req.body.email,
    cookieid: genCookie
  }, 'id').asCallback((err, result) => {
    // console.log(result);
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
      res.redirect(`/events/dates/${result}`);
    });
  });
});

app.get("/events/dates/:eventID", (req, res) => {
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




app.get("/events/url/:eventID", (req, res) => {
  res.render("url");
});

app.get("/events/dates/:eventID", (req, res) => {
  console.log(req.params)
  knex.select('id').from('events').where('url', req.params.eventID).asCallback((err, result) => {
    if (err) {
      throw err;
    } else {
      let templateVars = {
                          id: result,
                          eventURL: req.params.eventID
                         };
      console.log(templateVars);
      res.render("dates", templateVars);
    }
  });
});


app.get("/events/vote/:sharedurl", (req, res) => {
  if (!req.session.cookie_id){
    let templatevars = {};
    templatevars.sharedurl = req.params.sharedurl;
    res.render("participant", templatevars);
  } else {
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
  }
});





app.get("/events/times/:eventID", (req, res) => {
  knex.select('id').from('events').where('url', req.params.eventID).asCallback((err,result)=>{
    if (err) {
      throw err;
    } else {
      knex.select('*').from('date').where('eventID', result[0].id).asCallback((err, result) => {
        if (err) {
          throw err;
        } else {
          let templateVars = { dates: result,
                               eventURL: req.params.eventID
                              };
          console.log(templateVars);
          res.render("times", templateVars);
        }
      });
    }
  });
});




app.post("/events/times/:eventID", (req, res) => {
  let results = req.body;
  console.log(results);
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


app.post("/events/dates/:eventID/:id", (req, res) => {
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
          res.redirect(`/events/times/${req.params.eventID}`);
          })
        .catch((err)=>{
          return console.error("Connection Error", err);
        });
  }
});


app.get("/events/:sharedurl", (req, res) => {
  res.render("option");
});
app.post("/newuser", (req, res) => {
  let genCookie = generateRandomString();
  req.session.cookie_id = genCookie;
  knex('users').insert({
    name: req.body.name,
    email: req.body.email,
    cookieid: genCookie
  })
  .then(x => res.redirect(`/events/vote/${req.body.sharedurl}`))
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

