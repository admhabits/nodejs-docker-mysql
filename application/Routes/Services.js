const mysql = require('mysql');
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const router = express.Router();
const md5 = require('md5');
// Data Configuration
const DB_NAME = require('../config/data').DB_NAME;
const HOST = require('../config/data').HOST;
const DB_SECRET = require('../config/data').DB_SECRET;
const USER_NAME = require('../config/data').USER_NAME;

// Database Connection
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




// Select or Create the Users table & Services Table

function SelectOrCreateTable() {

    con.query('SELECT * FROM services', function (err, result, fields) {
        if (err) {
            const sql = 'CREATE TABLE services (id INT AUTO_INCREMENT PRIMARY KEY,nama_service VARCHAR(255), file_upload VARCHAR(255),  deskripsi VARCHAR(255), status BOOLEAN, userid VARCHAR(255), tanggal VARCHAR(100) ) ';
            con.query(sql, function (err, result) {
                if (err) throw err;
            });
        }
    })
}

SelectOrCreateTable();

const JwtPrivateSecrt = 'alamwibowo@ReactNodeMysql#PortalServices';

//JWT Token Extractor
function extractToken(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        return req.query.token;
    }
    return null;
}

// MIME TYPE FILE SETTINGS

const MIME_TYPE_MAP = {
    "application/vnd.curl.car": 'car'
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = MIME_TYPE_MAP[file.mimetype];
        let error = new Error("Invalid Mime Type !");
        if (isValid) { error = null; }
        cb(error, "carfile");
    }, filename: (req, file, cb) => {
        const name = file.originalname
            .toLowerCase()
            .split(" ")
            .join("-");

        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, name + "-" + Date.now() + "." + ext)
    }
})


const upload = multer({
    storage: storage,
    limits: {
        fieldSize: 12 * 1024 * 1024
    }
});


// Membuat Services 
router.post('/create', upload.single("file"), async (req, res, next) => {
    const Token = extractToken(req);
    // console.log(Token);
    var decoded = jwt.decode(Token, { complete: true });
    console.log(decoded);

    let email = decoded.payload.email;
    if (!email) {
        email = decoded.payload.username;
    }
    const URL = req.protocol + "://" + req.get("host");
    const fileCar = URL + "/carfile/" + req.file.filename;

    const nama = req.body.nama;
    const deskripsi = req.body.deskripsi;

    const status = 0;
    const tanggal = new Date().toLocaleDateString().toString();

    // console.log(email);
    // return false;
    con.query(`SELECT userid FROM users WHERE email = '${email}' OR username = '${email}'`,
        function (err, result) {
            if (err) {
                res.send({ err: 'err' });
            }
            if (result.length !== 0) {
                // console.log(`${result.userid}`)
                AddEditServices(result);
            } else {
                return res.status(201).send({ message: 'Akses ditolak !' });
            }
        })

    function AddEditServices(rows) {
        const result = Object.values(JSON.parse(JSON.stringify(rows)));
        const userid = result[0].userid;
        console.log(result[0].userid);
        // Cari Services Berdasarkan User ID
        const queryServices = `SELECT userid FROM services WHERE userid = '${userid}'`;
        // Update Services Query
        const updateServices = `UPDATE services SET nama_service = '${nama}', file_upload = '${fileCar}', deskripsi = '${deskripsi}', status = '${status}', tanggal = '${tanggal}' WHERE userid = '${userid}'`;
        // Buat Services Query
        const buatServices = `INSERT INTO services (nama_service, file_upload, deskripsi, status, userid, tanggal) VALUES ('${nama}', '${fileCar}', '${deskripsi}', '${status}', '${userid}', '${tanggal}')`;

        con.query(queryServices, function (err, result) {

            if (err) {
                res.send({ error: 'Services tidak ditemukan' })
            }
            if (result.length !== 0) {
                // Jika ada maka update
                con.query(updateServices, function (err, result) {
                    if (err) { throw err; }
                    res.status(200).send({ message: "Service Updated !" })
                })
            }

            if (result.length === 0) {
                // Jika tidak ada maka buat 
                con.query(buatServices, function (err, result) {
                    if (err) { throw err; }
                    res.status(200).send({ message: "Service Created !" })
                })
            }
        })
    }
})

module.exports = router;
