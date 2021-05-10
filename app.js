
const {Storage} = require('@google-cloud/storage');

const {format} = require('util');
const Multer = require('multer');
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

require("dotenv").config();

const bcrypt = require('bcryptjs');
const saltRounds = 10;

const jwt = require('jsonwebtoken');

app.use(cors());
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

const TOKEN_ARG = 2;
const tokenPath = process.argv[TOKEN_ARG];
process.env.GOOGLE_APPLICATION_CREDENTIALS = tokenPath;

const storage = new Storage();
const bucketName = 'voice-note-io-audios'
const bucket = storage.bucket(bucketName);
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});


app.post('/audios/:userId/:audioId', multer.single('file'), (req, res, next) => {
  const { userId, audioId } = req.params;

  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  // Create a new blob in the bucket and upload the file data.
  const blob = bucket.file(userId + "-" + audioId + ".flac");
  const blobStream = blob.createWriteStream();

  blobStream.on('error', err => {
    next(err);
  });

  blobStream.on('finish', () => {
    // The public URL can be used to directly access the file via HTTP.
    const publicUrl = format(
      `https://storage.googleapis.com/${bucket.name}/${blob.name}`
    );
    res.status(200).send(publicUrl);
  });

  blobStream.end(req.file.buffer);
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.get("/here", (req, res) => {
  res.send("HERE");
});

app.listen(process.env.PORT || 5000);
module.exports = app;