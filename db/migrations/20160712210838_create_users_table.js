exports.up = function(knex, Promise) {
  return knex.schema
  .createTable('users', function (table) {
    table.increments('id');
    table.string('name');
    table.string('email');
  })
  .createTable('cookies', function (table) {
    table.integer('cookieid');
    table.biginteger('usersID').references('id').inTable('users');
  })
  .createTable('events', function (table) {
    table.increments('id');
    table.string('title');
    table.string('description', [500]);
    table.string('location');
    table.string('url');
    table.biginteger('creatorID').references('id').inTable('users');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('events').dropTable('cookies').dropTable('users');
};
