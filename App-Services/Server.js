const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// user
const Users = require('./Routes/Users');
const Services = require('./Routes/Services');
// const Tema = require('./Routes/Tema');
// const Vpn = require('./Routes/Vpn');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// config data 
const DB_NAME = require('./config/data').DB_NAME;
const HOST = require('./config/data').HOST;
const DB_SECRET = require('./config/data').DB_SECRET;
const USER_NAME = require('./config/data').USER_NAME;

//end of


// Connect To DB
const con = mysql.createConnection({
  host: HOST,
  user: USER_NAME,
  password: DB_SECRET,
  // database:'app_react_node'
  database: DB_NAME,
  connectionLimit: 50,
  queueLImit: 50,
  waitForConnection: true
})

con.connect(function (err) {
  if (err) throw err;
  console.log('Server Connected!');

})

con.on('error', () => console.log('err'))

var del = con._protocol._delegateError;
con._protocol._delegateError = function (err, sequence) {
  if (err.fatal) {
    console.trace('fatal error: ' + err.message);
  }
  return del.call(this, err, sequence);
};

// this func allow users to visit this path 
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use('/carfile', express.static(path.join(__dirname, 'carfile')))
app.use(express.static(path.join(__dirname, 'react')))

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'App', 'index.html'))
  // res.json({ message: "Welcome to portal application." });
})


// API ROUTES
app.use('/api/users', Users);
app.use('/api/services', Services);

// port

const port = process.env.PORT || 8000;

// run the server 
app.listen(port, () => console.log(`app listen on port ${port}`))

