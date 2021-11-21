const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

// MODULE ROUTE
const Users = require('./Routes/Users');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// this func allow users to visit this path 
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use(express.static(path.join(__dirname, 'build')))

app.get('/', (req, res) => {
  // res.sendFile(path.join(__dirname, 'App', 'index.html'))
  res.json({ message: "Welcome Mailer Pray." });
})

// API ROUTES
app.use('/api/users', Users);


var key = fs.readFileSync(__dirname + '/certs/selfsigned.key');
var cert = fs.readFileSync(__dirname + '/certs/selfsigned.crt');
var options = {
  key: key,
  cert: cert
};

var server = https.createServer(options, app);

// PORT
const port = process.env.PORT || 4000;

// run the server 
server.listen(port, () => console.log(`App listen on port ${port}`))

