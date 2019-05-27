exports.up = function(knex, Promise) {
  return knex.schema
  .createTable('users', function (table) {
    table.increments('id');
    table.string('name');
    table.string('email');
    table.string('cookieid', [500]);
  })
  .createTable('events', function (table) {
    table.increments('events_id');
    table.string('title');
    table.string('description', [500]);
    table.string('location');
    table.string('url');
    table.biginteger('users_id').references('id').inTable('users');
  })
    .createTable('date', function (table) {
    table.increments('id');
    table.biginteger('eventID').references('events_id').inTable('events');
    table.string('date');
  })
    .createTable('time', function (table) {
    table.increments('id');
    table.biginteger('dateID').references('id').inTable('date');
    table.string('start_time');
  })
  .createTable('options', function (table) {
    table.increments('id');
    table.biginteger('users_id').references('id').inTable('users');
    table.biginteger('events_id').references('events_id').inTable('events');
    table.string('date');
    table.string('start_time');
  })
  .createTable('participants', function (table) {
    table.increments('id');
    table.biginteger('users_id').references('id').inTable('users');
    table.biginteger('events_id').references('events_id').inTable('events');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('participants').dropTable('options').dropTable('time')
  .dropTable('date').dropTable('events').dropTable('users');

// .dropTable('participants')
};
