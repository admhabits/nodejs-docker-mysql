const mysql = require('mysql');
// GET CONFIG DATA FROM VARIABLE
const { HOST, DB_NAME, USER_NAME, DB_SECRET } = require('./data');

// CONNECT TO DB
const con = mysql.createConnection({
  host: HOST,
  user: USER_NAME,
  password: DB_SECRET,
  database: DB_NAME,
  connectionLimit: 50,
  queueLImit: 50,
  waitForConnection: true
});

con.connect(function (err) {
    if (err) throw err;
    console.log(` + ============ DATABASE CONNECTED ============ + \n`);
})

con.on('error', () => console.log('err'))

var del = con._protocol._delegateError;
con._protocol._delegateError = function (err, sequence) {
    if (err.fatal) {
        console.trace(`FATAL ERROR : ${err.message} `);
    }
    return del.call(this, err, sequence);
};

module.exports = con;