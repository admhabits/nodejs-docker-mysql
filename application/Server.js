const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

// user
const Users = require('./Routes/Users');
const Services = require('./Routes/Services');
// const Tema = require('./Routes/Tema');
const Vpn = require('./Routes/Vpn');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// this func allow users to visit this path 
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use('/carfile', express.static(path.join(__dirname, 'carfile')))
app.use(express.static(path.join(__dirname, 'react')))

app.get('/*', (req, res) => {
  // res.sendFile(path.join(__dirname, 'App', 'index.html'))
  res.json({ message: "Welcome to portal application." });
})

// API ROUTES
app.use('/api/users', Users);
app.use('/api/services', Services);
app.use('/api/vpn', Vpn);


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
server.listen(port, () => console.log(`app listen on port ${port}`))

