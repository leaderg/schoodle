DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS cookies;
DROP TABLE IF EXISTS options;

CREATE TABLE users (
  id serial PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(50) NOT NULL
);

CREATE TABLE cookies (
  id VARCHAR(100) PRIMARY KEY,
  user_id int REFERENCES users(id)
);

CREATE TABLE events (
  id serial PRIMARY KEY,
  title VARCHAR(50) NOT NULL,
  description VARCHAR(400),
  creator_id int REFERENCES users(id)
);

CREATE TABLE options (
  id serial PRIMARY KEY,
  user_id int REFERENCES users(id),
  event_id int REFERENCES events(id),
  available_time date NOT NULL
);
