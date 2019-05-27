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

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.post("/newevent", (req, res) => {
  let genCookie = generateRandomString();
  let eventSerial = generateRandomString();
  let scopeUserId;
  let scopeEventId;
  req.session.cookie_id = genCookie;
  knex('users')
    .insert({
      name: req.body.name,
      email: req.body.email,
      cookieid: genCookie
    }, 'id')
    .asCallback((err, result) => {
    if (err) {
      return console.error("Connection Error", err);
    }
    scopeUserId = Number(result[0]);
    knex('events')
      .insert({
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        users_id: result[0],
        url: eventSerial
      }, "events_id")
      .asCallback((err, output) => {
        if (err) {
          return console.error("Connection Error", err);
        }
        console.log(`
          output: ${output}
          output[0]: ${output[0]}
          Number(output[0]): ${Number(output[0])}`)
        knex('participants')
        .insert({
          users_id: scopeUserId,
          events_id: Number(output[0])
        })
        .then(x => {
          res.redirect(`/events/dates/${eventSerial}`);
        });
      });
  });
});

app.get("/events/dates/:eventID", (req, res) => {
  console.log(req.params)
  knex.select('events_id').from('events').where('url', req.params.eventID).asCallback((err, result) => {
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

app.get("/events/vote/:sharedurl", (req, res) => {
  if (!req.session.cookie_id){
    let templatevars = {};
    templatevars.sharedurl = req.params.sharedurl;
    res.render("participant", templatevars);
  // } else if () {
  // People with cookie not part of event shouldn't see it ---stretch
  } else {
    let templatevars = {};
    templatevars.targetEvent = req.params.sharedurl;
    knex('users').select('id').where('cookieid', '=', req.session.cookie_id)
    .then( x => {
      templatevars.viewingUser = x[0].id;
      res.render('option', templatevars);
    })
  }
});

app.get("/events/url/:eventID", (req, res) => {
  let templatevars = {};
  let targetEvent = req.params.eventID;
  knex.select('users_id', 'events.events_id', 'date', 'start_time').from('date')
      .leftOuterJoin('time', 'date.id', 'dateID')
      .leftOuterJoin('events', 'events_id', 'eventID')
      .where('events.url', '=', targetEvent)
  .then( x => {
  let rows = x;
  knex.batchInsert('options', rows)
      .then((result) => {
        res.render("url", {url: req.params.eventID});
        })
      .catch((err)=>{
        return console.error("Connection Error", err);
      });
  });
});


app.get("/events/dates/:eventID", (req, res) => {
  console.log(req.params)
  knex.select('events_id').from('events').where('url', req.params.eventID).asCallback((err, result) => {
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


app.get("/events/times/:eventID", (req, res) => {
  knex.select('events_id').from('events').where('url', req.params.eventID).asCallback((err,result)=>{
console.log(result)
    if (err) {
console.log("err1")
      throw err;
    } else {
console.log('test1')
      knex.select('*').from('date').where('eventID', result[0].events_id).asCallback((err, result) => {
        if (err) {
console.log('err2')
          throw err;
        } else {
console.log('test2')
          let templateVars = {
            dates: result,
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
console.log('test1')
      knex('time').insert({
                            dateID : ids,
                            start_time: results[ids][i]
                          }).asCallback((err, result) => {
        if(err){
console.log('err1')
          throw err;
        }
      });
    }
  }
  res.redirect(`/events/url/${req.params.eventID}`);
});


app.post("/events/dates/:eventID/:id", (req, res) => {
  let id = Number(req.params.id);
console.log('params',req.params);
console.log(id,typeof(id));
console.log('body', req.body)

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
  let scopeUserId;
  let scopeEventId;
  knex('events').select('events_id').where('url', req.body.sharedurl)
    .then(result => {
      scopeEventId = result[0].events_id;
      knex('users').insert({
        name: req.body.name,
        email: req.body.email,
        cookieid: genCookie
        }, "id")
    .then(output => {
      knex('participants').insert({
        users_id: Number(output[0]),
        events_id: scopeEventId
      })
    .then(x => res.redirect(`/events/vote/${req.body.sharedurl}`))
    })
  })
});

app.post("/optionchoice", (req, res) => {
  knex('options')
  .insert({
      users_id: req.body.users_id,
      events_id: req.body.events_id,
      date: req.body.date,
      start_time: req.body.start_time
    })
  .asCallback(function() {
    res.send('Received');
  })
});

app.post("/optionremove", (req, res) => {
  knex('options')
  .where({
      users_id: req.body.users_id,
      events_id: req.body.events_id,
      date: req.body.date,
      start_time: req.body.start_time
    })
  .del()
  .asCallback(function() {
    res.send('Received');
  })
});



app.post("/refresh", (req, res) => {
  console.log(`Receive JSON get request.`)
  console.log(`looking for "url" = ${req.body.eventSerial}`)
  buildObjectFromURL(req.body.eventSerial, function(output) {
    res.json(output);
  });

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

function buildObjectFromURL(url, cb) {
  let jsonReply = {};
  knex.select('*').from('events').where('url', url)
  .then((result) => {
      jsonReply.event = result[0];
    return result[0].events_id;
    })
  .then((eventID) => {
    knex.select('*').from('options').where('events_id', eventID).then((optionList) => {
      jsonReply.options = optionList;
      return eventID
    })
  .then((eventID) => {
    //this could be better using joins.
    knex('participants').where('events_id', eventID)
    .join('users', 'users.id', 'participants.users_id')
    .select('users.id','users.name')
    .then((participantList) => {
      jsonReply.participants = participantList;
      cb(jsonReply);
    })
  })

});
}
