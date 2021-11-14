const connection = require('./db-config');
require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

const bcrypt = require('bcrypt');
const saltRounds = 10;

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

// routes

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
        res.send({ message: 'Username already exists' });
      } else {
        bcrypt.hash(password, saltRounds, (err, hashedPw) => {
          if (err) {
            console.log(err);
          }
          connection.query(
            'INSERT INTO users (name, password) VALUES (?,?)',
            [name, hashedPw],
            (err, result) => {
              if (err) {
                res.send({ error: err });
              }
              if (result.affectedRows === 1) {
                res.send({ message: 'User created' });
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
            res.send({ message: 'Login successful' });
          } else {
            res.send({ message: 'Wrong password' });
          }
        });
      } else {
        res.send({ message: "User doesn't exist" });
      }
    }
  );
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
