const mysql = require('mysql');
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const router = express.Router();
const fs = require('fs');

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
    console.log('Services Query Connected!');

})

con.on('error', () => console.log('err'))

var del = con._protocol._delegateError;
con._protocol._delegateError = function (err, sequence) {
    if (err.fatal) {
        console.trace('fatal error: ' + err.message);
    }
    return del.call(this, err, sequence);
};


// Pilih atau Buat Tabel User & Services

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

// Pengaturan Jenis Tipe Gambar
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
}).single("file");

// UPDATE SERVICE BY ID
router.post('/update/:id', upload, async (req, res, next) => {
    const Token = extractToken(req);
    // console.log(Token);
    var decoded = jwt.decode(Token, { complete: true });

    //GANTI METODE USER LOGIN
    let email = decoded.payload.email;
    let userid = decoded.payload.userid;
    let id = req.params.id;

    if (!email) {
        email = decoded.payload.username;
    }

    const buatFileName = `services-${userid}-${id}.car`;
    const URL = req.protocol + "://" + req.get("host");

    const fileURL = URL + "/carfile/" + buatFileName;
    fs.renameSync(req.file.path, req.file.path.replace(req.file.filename, buatFileName));

    const nama = req.body.nama;
    const deskripsi = req.body.deskripsi;


    const status = 0;
    const tanggal = new Date().toLocaleDateString().toString();

    console.log("GET TOKEN FROM BEARER : " + decoded);
    console.log("STATUS SERVICE : " + status);

    con.query(`SELECT userid FROM users WHERE email = '${email}' OR username = '${email}'`,
        function (err, result) {
            if (err) {
                res.send({ err: 'err' });
            }
            if (result.length !== 0) {
                //Panggil Update Services Function
                UpdateService(result);
            } else {
                return res.status(204).send({ message: 'Access denied!' });
            }
        })

    function UpdateService(rows) {
        const result = Object.values(JSON.parse(JSON.stringify(rows)));
        const userid = result[0].userid;
        console.log("Get UserID in UPDATE Services : " + result[0].userid);

        // Cari Services Berdasarkan User ID
        const queryServices = `SELECT userid FROM services WHERE userid = '${userid}' AND id = ${id}`;

        // Update Services Query
        const updateServices = `UPDATE services SET nama_service = '${nama}', file_upload = '${fileURL}', deskripsi = '${deskripsi}', status = '${status}', tanggal = '${tanggal}' WHERE userid = '${userid}' AND id = '${id}'`;

        con.query(queryServices, function (err, result) {
            if (err) {
                res.send({ error: 'Terjadi kesalahan!' })
            }
            if (result.length !== 0) {
                // Jika ada maka update
                // res.status(203).send({message: "Services telah dibuat !"})
                con.query(updateServices, function (err, result) {
                    if (err) { throw err; }
                    res.status(200).send({ message: `Service updated with id ${id}!` })
                })
            } else {
                res.status(404).send({ message: `Services tidak ditemukan dengan id ${id}!` })
            }
        })
    }
})


/* UPDATE SERVICE BY STATUS as TRUE (ADMIN)
==================================================
PLANNING NOTES USER PRIVILLEDGE :
    1. ROLE 234 => ADMIN
    2. ROLE 123 => REGULER USER
==================================================
*/

router.post('/update/status/:id', async (req, res, next) => {
    const Token = extractToken(req);
    var decoded = jwt.decode(Token, { complete: true });
    var status = req.query.active;
    console.log("GET status FROM QUERY PARAMS : " + status);

    //GANTI METODE USER LOGIN
    let email = decoded.payload.email;
    console.log("GET status FROM QUERY PARAMS : " + status);


    if (!email) {
        email = decoded.payload.username;
    }
    const id = req.params.id;

    if (status === 'true') {
        status = 1;
    } else {
        status = 0;
    }

    console.log("GET TOKEN FROM BEARER : " + decoded);
    console.log("ASSIGN VARIABLE Status AFTER CHECKING : " + status);

    con.query(`SELECT userid FROM users WHERE email = '${email}' OR username = '${email}'`,
        function (err, result) {
            if (err) {
                res.send({ err: 'err' });
            }
            if (result.length !== 0) {
                //Panggil Update Services Status Function
                UpdateServiceStatus(result);
            } else {
                return res.status(204).send({ message: 'Access denied!' });
            }
        })

    function UpdateServiceStatus(rows) {
        const result = Object.values(JSON.parse(JSON.stringify(rows)));
        const userid = result[0].userid;
        console.log("Get UserID in UPDATE Services : " + result[0].userid);

        // Cari Services Berdasarkan User ID
        const queryServices = `SELECT userid FROM services WHERE userid = '${userid}' AND id = ${id}`;

        // Update Services Query
        const updateServices = `UPDATE services SET status = '${status}' WHERE userid = '${userid}' AND id = '${id}'`;

        con.query(queryServices, function (err, result) {
            if (err) {
                res.send({ error: 'Terjadi kesalahan!' })
            }
            if (result.length !== 0) {
                // Jika ada maka update
                // res.status(203).send({message: "Services telah dibuat !"})
                con.query(updateServices, function (err, result) {
                    if (err) { throw err; }
                    if (status === 0) {
                        status = false;
                    } else {
                        status = true;
                    }
                    res.status(200).send({ message: `Status service updated with id ${id} & active is ${status}!` })
                })
            } else {
                res.status(404).send({ message: `Services tidak ditemukan dengan id ${id}!` })
            }
        })
    }
})


// DELETE SERVICE BY ID
router.post('/delete/:id', async (req, res, next) => {
    const Token = extractToken(req);
    var decoded = jwt.decode(Token, { complete: true });

    //GANTI METODE USER LOGIN
    let email = decoded.payload.email;
    if (!email) {
        email = decoded.payload.username;
    }

    const id = req.params.id;
    console.log("GET TOKEN FROM BEARER : " + decoded);

    con.query(`SELECT userid FROM users WHERE email = '${email}' OR username = '${email}'`,
        function (err, result) {
            if (err) {
                res.send({ err: 'err' });
            }
            if (result.length !== 0) {
                //Panggil Update Services Function
                HapusService(result);
            } else {
                return res.status(204).send({ message: 'Access denied!' });
            }
        })

    function HapusService(rows) {
        const result = Object.values(JSON.parse(JSON.stringify(rows)));
        const userid = result[0].userid;
        console.log("Get UserID in DELETE Services : " + result[0].userid);

        // Cari Services Berdasarkan User ID
        const queryServices = `SELECT userid FROM services WHERE userid = '${userid}' AND id = ${id}`;

        // DELETE SERVICE QUERY
        const updateServices = `DELETE FROM services WHERE userid = '${userid}' AND id = '${id}'`;

        con.query(queryServices, function (err, result) {
            if (err) {
                res.send({ error: 'Terjadi kesalahan!' })
            }
            if (result.length !== 0) {
                // Jika ada maka dihapus
                con.query(updateServices, function (err, result) {
                    if (err) { throw err; }
                    res.status(200).send({ message: `Hapus service dengan id ${id}!` })
                })
            } else {
                res.status(404).send({ message: `Service tidak ditemukan dengan id ${id}!` })
            }
        })
    }
})

// CREATE SERVICES
router.post('/create', upload, async (req, res, next) => {
    const Token = extractToken(req);
    // console.log(Token);
    const status = 0; // Disable Status Service
    var decoded = jwt.decode(Token, { complete: true });
    const userid = decoded.payload.userid;
    const tanggal = new Date().toLocaleDateString();
    const nama = req.body.nama;
    const deskripsi = req.body.deskripsi;

    //GANTI METODE USER LOGIN
    var userAccount;

    if (!req.body.username) {
        userAccount = decoded.payload.username;
    } else {
        userAccount = decoded.payload.email;
    }

    con.query(`SELECT userid FROM users WHERE email = '${userAccount}' OR username = '${userAccount}'`,
        function (err, result) {
            if (err) throw err;
            if (result.length !== 0) {
                buatService(result);
            }
        }

    )

    function buatService(rows) {
        // Ambil UserID Setelah Menjalankan Query
        const row = Object.values(JSON.parse(JSON.stringify(rows)));
        const userID = row[0].userid;

        let namaFile = `services-${userid}.car`;
        const URL = req.protocol + "://" + req.get("host");
        let fileURL = URL + "/carfile/" + namaFile;

        // fs.renameSync(req.file.path, req.file.path.replace(req.file.filename, namaFile));
        console.log("GET TOKEN FROM BEARER : ", decoded);
        console.log("START create STATUS SERVICE WITH : " + status);
        console.log("FILE URI : " + fileURL + "\n");

        con.query(`INSERT INTO services (nama_service, file_upload, deskripsi, status, userid, tanggal) VALUES ('${nama}', '${fileURL}', '${deskripsi}', '${status}', '${userid}', '${tanggal}')`,
            function (err, result) {
                if (err) throw err;
                renameFile(result.insertId);
            })

        function renameFile(insertId) {
            namaFile = `services-${userid}-${insertId}.car`;
            const newURL = URL + "/carfile/" + namaFile;
            fs.renameSync(req.file.path, req.file.path.replace(req.file.filename, namaFile));
            con.query(`UPDATE services SET file_upload = '${newURL}' WHERE id = ${insertId}`, function (err, result) {
                if (err) throw err;
                res.status(200).send({
                    result,
                    message: 'success'
                })
            });
        }
    }

})




module.exports = router;
