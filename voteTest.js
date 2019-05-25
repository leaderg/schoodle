// $('document').ready(function() {
"use strict";

require('dotenv').config();

const ENV         = process.env.ENV || "development";
const knexConfig  = require("./knexfile");
const knex        = require("knex")(knexConfig[ENV]);
const knexLogger  = require('knex-logger');




function getEventIDFromURL(url) {
  knex.select('id').from('events').where('url', url).asCallback((err, result) => {
    if (err) {
      throw err;
    }
    console.log(result);
  });
}



// });
