const connection = require('./db-config');
require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require('express-session');

// connection

connection.connect((err) => {
  if (err) {
    console.error('error connecting: ' + err.stack);
  } else {
    console.log(
      'connected to database with threadId :  ' + connection.threadId
    );
  }
});

// middleware

app.use(express.json());
app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {
      // 24 hours
      expires: 1000 * 60 * 60 * 24,
      sameSite: 'strict',
    },
  })
);

// routes
// initial check if logged in
app.get('/login', (req, res) => {
  if (req.session.user) {
    console.log('logged in user: ', req.session.user);
    res.send({
      loggedIn: true,
      userName: req.session.user[0].name,
      userId: req.session.user[0].id,
    });
  } else {
    console.log('not logged in');
    res.send({ loggedIn: false });
  }
});

// register
app.post('/register', (req, res) => {
  const name = req.body.name;
  const password = req.body.password;

  connection.query(
    'SELECT * FROM users WHERE name = ?;',
    name,
    (err, result) => {
      if (err) {
        res.send({ error: err });
      }

      if (result.length > 0) {
        res.send({ userCreated: false, message: 'Username already exists' });
      } else {
        bcrypt.hash(password, saltRounds, (err, hashedPw) => {
          if (err) {
            console.log(err);
          }
          connection.query(
            'INSERT INTO users (name, password) VALUES (?,?)',
            [name, hashedPw],
            (err, response) => {
              if (err) {
                res.send({ error: err });
              }
              if (response.affectedRows === 1) {
                res.send({ userCreated: true, message: 'User created' });
              }
            }
          );
        });
      }
    }
  );
});

// login
app.post('/login', (req, res) => {
  const name = req.body.name;
  const password = req.body.password;

  connection.query(
    'SELECT * FROM users WHERE name = ?;',
    name,
    (err, result) => {
      if (err) {
        res.send({ error: err });
      }

      if (result.length > 0) {
        bcrypt.compare(password, result[0].password, (error, response) => {
          if (error) {
            res.send({ error: error });
          }
          if (response) {
            req.session.user = result;
            console.log(req.session.user);
            res.send({ loggedIn: true, message: 'Login successful' });
          } else {
            res.send({ loggedIn: false, message: 'Wrong password' });
          }
        });
      } else {
        res.send({ message: "User doesn't exist" });
      }
    }
  );
});

// logout
app.get('/logout', (req, res) => {
  if (req.session) {
    console.log('destroying session');
    req.session.destroy((err) => {
      if (err) {
        res.send({ sessionDestroyed: false });
        console.log('Unable to log out');
      } else {
        console.log('Logout successful');
        res.send({ sessionDestroyed: true });
      }
    });
  }
});

// highscores
app.get('/quiz/scores', (req, res) => {
  connection
    .promise()
    .query('SELECT * FROM highscores')
    .then((result) => res.status(200).send(result))
    .catch((error) => res.status(500).send(error));
});

app.post('/quiz/scores', (req, res) => {
  const { name, score, date } = req.body;
  connection
    .promise()
    .query(
      'INSERT INTO highscores (name, score, date) VALUES (?, ?, ?)',
      [name, score, date],
      (err, result) => {
        if (err) {
          res.status(500).send('Error saving the Highscore');
        } else {
          res.status(201).send('Highscore successfully saved');
        }
      }
    )
    .then((result) => res.status(200).send(result))
    .catch((error) => res.status(500).send(error));
});

// listen
app.listen(port, () => console.log(`Server listening on Port ${port}`));
