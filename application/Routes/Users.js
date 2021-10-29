const mysql = require('mysql');
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const router = express.Router();
const md5 = require('md5');

// config data 
const DB_NAME = require('../config/data').DB_NAME;
const HOST = require('../config/data').HOST;
const DB_SECRET = require('../config/data').DB_SECRET;
const USER_NAME = require('../config/data').USER_NAME;


// Connect To DB
const con = mysql.createConnection({
    host: HOST,
    user: USER_NAME,
    password: DB_SECRET,
    database: DB_NAME,
    connectionLimit: 50,
    queueLImit: 50,
    waitForConnection: true
})

con.connect(function (err) {
    if (err) throw err;
    console.log('connected!', err)
})

con.on('error', () => console.log('err'))

var del = con._protocol._delegateError;
con._protocol._delegateError = function (err, sequence) {
    if (err.fatal) {
        console.trace('fatal error: ' + err.message);
    }
    return del.call(this, err, sequence);
};

function isEmpty(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }
    return JSON.stringify(obj) === JSON.stringify({});
}

// MIME TYPE FILE SETTINGS

const MIME_TYPE_MAP = {
    "image/png": 'png',
    "image/jpg": 'jpg',
    "image/jpeg": 'jpeg'
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = MIME_TYPE_MAP[file.mimetype];
        let error = new Error("Invalid Mime Type !");
        if (isValid) { error = null; }
        cb(error, " ektensi gambar !");
    }, filename: (req, file, cb) => {
        const name = file.originalname
            .toLowerCase()
            .split(" ")
            .join("-");

        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, name + "-" + Date.now() + "." + ext)
    }
})

// Select or Create the Users table & Services Table

function SelectOrCreateTable() {

    // con.query('SELECT * FROM services', function (err, result, fields) {
    //     if (err) {
    //         const sql = 'CREATE TABLE services (id INT AUTO_INCREMENT PRIMARY KEY,nama VARCHAR(255), url VARCHAR(255),  deskripsi VARCHAR(255), status BOOLEAN, userid VARCHAR(255) ) ';
    //         con.query(sql, function (err, result) {
    //             if (err) throw err;
    //         });
    //     }
    // })

    con.query('SELECT * FROM users', function (err, result, fields) {
        if (err) {
            const sql = 'CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY,username VARCHAR(255), password  VARCHAR(255), email  VARCHAR(255) Not Null UNIQUE, userid VARCHAR(255) ) ';
            con.query(sql, function (err, result) {
                if (err) throw err;
            });
        }
    })

    // con.query('SELECT * FROM vpn', function (err, result, fields) {
    //     if (err) {
    //         const sql = 'CREATE TABLE vpn (id INT AUTO_INCREMENT PRIMARY KEY, nama  VARCHAR(150), status BOOLEAN, url VARCHAR(255), userid VARCHAR(255) ) ';
    //         con.query(sql, function (err, result) {
    //             if (err) throw err;
    //         });
    //     }
    // })

    // con.query('SELECT * FROM tema', function (err, result, fields) {
    //     if (err) {
    //         const sql = 'CREATE TABLE tema (id INT AUTO_INCREMENT PRIMARY KEY, header  VARCHAR(150), footer VARCHAR(255), logo VARCHAR(255), userid VARCHAR(255) ) ';
    //         con.query(sql, function (err, result) {
    //             if (err) throw err;
    //         });
    //     }
    // })
}

SelectOrCreateTable();

const JwtPrivateSecrt = 'alamwibowo@ReactNodeMysql#PortalServices';

// Users Authentication
router.post('/login', async (req, res) => {
    var queryAuth;
    const pass = md5(req.body.password);
    const username = req.body.username;
    const email = req.body.email;
    // console.log(!email);
    queryAuth = `SELECT * FROM users WHERE email = '${email}' OR username = '${username}' AND  password = '${pass}' `;
    con.query(queryAuth, async function (err, result) {
        if (result.length !== 0) {
            if (username) {
                jwt.sign({ username: username }, JwtPrivateSecrt,
                    (err, token) => {
                        res.status(200).send({ token: token });
                    });
            } else if (email) {
                jwt.sign({ email: email }, JwtPrivateSecrt,
                    (err, token) => {
                        res.status(200).send({ token: token });
                    });
            }

        }
        if (result.length === 0) {
            res.status(400).send({ message: 'error not found' });
        }
    });

});

// Pendaftaran Users
router.post('/signup', async (req, res) => {
    const email = req.body.email;
    const pass = md5(req.body.password);
    const username = req.body.username;
    const userid = md5(email);
    if (username && email && pass) {
        con.query(`SELECT * FROM users WHERE email = '${email}' AND username = '${username}'`, function (err, result) {
            if (err) {
                res.send({ err: 'Something Went Wrong !' })
            }
            if (result.length === 0) {
                var sql = `INSERT INTO users (username, email, password, userid) VALUES ('${username}', '${email}', '${pass}', '${userid}')`;
                con.query(sql, function (err, result) {
                    if (err) { throw err; }
                    res.status(200).send({ result })
                    console.log(result)
                })

            } else {
                return res.status(201).send({ message: 'Email atau Username telah digunakan !' })
            }
        })
    } else {
        res.status(203).send({ message: "Required Valid field !" });
    }

})

module.exports = router;
