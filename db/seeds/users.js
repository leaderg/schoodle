exports.seed = function(knex, Promise) {
  return knex('options').del()
    .then(function () {
      return Promise.all([
        knex('options').insert({id: 1, users_id: '1', events_id: '1', start_date: '2019-5-16', start_time: '7am'}),
        knex('options').insert({id: 1, users_id: '1', events_id: '1', start_date: '2019-5-16', start_time: '9am'}),
        knex('options').insert({id: 1, users_id: '1', events_id: '1', start_date: '2019-5-16', start_time: '3pm'}),
        knex('options').insert({id: 1, users_id: '1', events_id: '1', start_date: '2019-6-16', start_time: '11am'}),
        knex('options').insert({id: 1, users_id: '1', events_id: '1', start_date: '2019-6-16', start_time: '5pm'}),
        knex('options').insert({id: 1, users_id: '1', events_id: '1', start_date: '2019-7-16', start_time: '9am'})
      ]);
    });
};



