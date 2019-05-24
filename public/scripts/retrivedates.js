$(document).ready(function() {
  var knex = require('knex')({
    client: 'pg',
    connection: {
        host : '127.0.0.1',
        user : 'labber',
        password : 'labber',
        database : 'midterm'
    }
  });
  console.log('Searching...');


  knex.select('date').from('date').asCallback((err, res) => {
     console.log(res)
    for (element of res){
      const d =  $("<div>");
       $("<h3>").text(element.date).appendTo(d);
       $("<input>").type(text).name(element.date).appendTo(d);
       $('.testt').append(d);
    }
    return knex.destroy();
  });




      // for (let index in res){
      //   let custdate = res[index].birthdate.toLocaleDateString();
      //   console.log(`-${Number(index) + 1}: ${res[index].first_name} ${res[index].last_name}, born '${custdate}'`);
      // }
});
