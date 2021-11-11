const connection = require('./db-config');
require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

connection.connect((err) => {
  if (err) {
    console.error('error connecting: ' + err.stack);
  } else {
    console.log(
      'connected to database with threadId :  ' + connection.threadId
    );
  }
});

app.use(express.json());

// routes
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
