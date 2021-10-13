const mysql = require('mysql');
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const router = express.Router();

// config data 
const DB_NAME = require('../config/data').DB_NAME;
const HOST = require('../config/data').HOST;
const DB_SECRET = require('../config/data').DB_SECRET;
const USER_NAME = require('../config/data').USER_NAME;

//end of


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


// conde for imge uploaded / some settings..


const MIME_TYPE_MAP = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": 'jpg',
    "application/vnd.curl.car": 'car'
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = MIME_TYPE_MAP[file.mimetype];
        let error = new Error("Invalid mime type");
        if (isValid) { error = null; }
        cb(error, ".car files");
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

    con.query('SELECT * FROM services', function (err, result, fields) {
        if (err) {
            const sql = 'CREATE TABLE services (id INT AUTO_INCREMENT PRIMARY KEY,nama VARCHAR(255), deskripsi VARCHAR(255), status BOOLEAN, userid VARCHAR(255) ) ';
            con.query(sql, function (err, result) {
                if (err) throw err;
            });
        }
    })

    con.query('SELECT * FROM users', function (err, result, fields) {
        if (err) {
            const sql = 'CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY,nama VARCHAR(255), password  VARCHAR(255), pic  VARCHAR(255), email  VARCHAR(255) Not Null UNIQUE, alamat VARCHAR(255), userid VARCHAR(255) ) ';
            con.query(sql, function (err, result) {
                if (err) throw err;
            });
        }
    })

    con.query('SELECT * FROM berita', function (err, result, fields) {
        if (err) {
            const sql = 'CREATE TABLE berita (id INT AUTO_INCREMENT PRIMARY KEY, judul  VARCHAR(150), konten VARCHAR(1000), userid VARCHAR(255) ) ';
            con.query(sql, function (err, result) {
                if (err) throw err;
            });
        }
    })
}

SelectOrCreateTable();

// end



// Create new user
router.post('/Register', async (req, res) => {
    const email = req.body.Data.email;
    const pass = req.body.Data.password;
    const nama = req.body.Data.nama;
    const userid = req.body.Data.userid;

    con.query(`SELECT * FROM users WHERE email = '${email}'`, function (err, result) {
        if (err) {
            res.send({ err: 'err' })
        }
        if (result.length === 0) {
            var sql = `INSERT INTO users (nama, email, password, userid) VALUES ('${nama}', '${email}', '${pass}', '${userid}')`;
            con.query(sql, function (err, result) {
                if (err) { throw err; }
                res.status(200).send({ result })
                console.log(result)
            })
        } else {
            return res.status(201).send({ message: 'Email ini telah digunakan sebelumnya !' })
        }
    })
})
// end

// Create new service
router.post('/sercreate', async (req, res) => {
    const Token = extractToken(req);
    console.log(Token);
    var decoded = jwt.decode(Token, { complete: true });
    const UserE = decoded.payload.UserEmail;

    const userid = req.body.Data.userid;
    const nama = req.body.Data.nama;
    const deskripsi = req.body.Data.deskripsi;
    const status = req.body.Data.status;

    // console.log(userid);
    con.query(`SELECT * FROM users WHERE email = '${UserE}' AND userid = '${userid}'`,
        function (err, result) {
            if (err) {
                res.send({ err: 'err' })
            }
            if (result.length !== 0) {
                var sql = `INSERT INTO services (nama, deskripsi, status, userid) VALUES ('${nama}', '${deskripsi}', '${status}', '${userid}')`;
                con.query(sql, function (err, result) {
                    if (err) { throw err; }
                    res.status(200).send({ result })
                    console.log(result)
                })
            } else {
                return res.status(201).send({ message: 'Akses ditolak !' })
            }
        })
})


router.post('/newscreate', async (req, res) => {
    const Token = extractToken(req);
    console.log(Token);
    var decoded = jwt.decode(Token, { complete: true });
    const UserE = decoded.payload.UserEmail;

    const userid = req.body.Data.userid;
    const judul = req.body.Data.judul;
    const konten = req.body.Data.konten;

    // console.log(userid);
    con.query(`SELECT * FROM users WHERE email = '${UserE}' AND userid = '${userid}'`,
        function (err, result) {
            if (err) {
                res.send({ err: 'err' })
            }
            if (result.length !== 0) {
                var sql = `INSERT INTO berita (judul, konten, userid) VALUES ('${judul}', '${konten}', '${userid}')`;
                con.query(sql, function (err, result) {
                    if (err) { throw err; }
                    res.status(200).send({ result })
                    console.log(result)
                })
            } else {
                return res.status(201).send({ message: 'Kamu tidak memiliki akses !' })
            }
        })
})
// end

const JwtPrivateSecrt = 'alam#ReactNodeProject';

// login in 
router.post('/Login', async (req, res) => {

    const email = req.body.Data.email;
    const pass = req.body.Data.password;
    // console.log(email, pass);
    con.query(`SELECT * FROM users WHERE email = '${email}' AND  password = '${pass}' `,
        async function (err, result) {
            if (result.length !== 0) {
                jwt.sign({ UserEmail: email }, JwtPrivateSecrt,
                    (err, token) => {
                        res.status(200).send({ token: token });
                    });
            }
            if (result.length === 0) {
                res.status(400).send({ message: 'error not found' });
            }
        });

});



// get user services
router.get('/getservice/:userid', async (req, res) => {
    const userid = req.params.userid;
    const Token = extractToken(req);
    console.log(Token);

    var decoded = jwt.decode(Token, { complete: true });
    const UserE = decoded.payload.UserEmail;

    const theSQL = `SELECT * FROM users WHERE email = '${UserE}'`;
    con.query(theSQL, function (err, result) {
        if (err) throw err;
        if (result.length !== 0) {
            const theSQL = `SELECT * FROM services WHERE userid = '${userid}'`;
            con.query(theSQL, function (err, result) {
                if (err) throw err;
                res.status(200).send({ result });
            });
        }
    })



})

// get user data

function extractToken(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        return req.query.token;
    }
    return null;
}

router.get('/GetUserData', async (req, res) => {
    const Token = extractToken(req);

    console.log(Token);
    var decoded = jwt.decode(Token, { complete: true });
    const UserE = decoded.payload.UserEmail;

    const theSQL = `Select * FROM users  WHERE email = '${UserE} AND userid = '${userid}'`;
    con.query(theSQL, function (err, result) {
        if (err) throw err;
        res.status(200).send({ result });
    })

})

router.get('/getservices', async (req, res) => {
    const theSQL = `SELECT * FROM services WHERE id = '57ba647b-5d1a-442a-9ff2-fef022a34f6b'`;
    con.query(theSQL, function (err, result) {
        if (err) throw err;
        res.status(200).send({ result });
        // res.json({result});
    });
})




// Update services data

const uploadcar = multer({
    storage: storage, limits: { fieldSize: 12 * 1024 * 1024 }
}).single("car");


router.put('/edit/:userid', uploadcar, (req, res, next) => {

    const userid = req.params.userid;
    const status = req.body.Data.status;
    const nama = req.body.Data.nama;
    const deskripsi = req.body.Data.deskripsi;
    // updata with mysql 

    if (req.file && req.file !== '') {
        const userid = req.body.Data.userid;
        const status = req.body.Data.status;

        const URL = req.protocol + "://" + req.get("host");
        const fileCar = URL + "/carfile/" + req.file.filename;

        const nama = req.body.Data.nama;
        const deskripsi = req.body.Data.deskripsi;

        con.query(`SELECT * FROM services WHERE userid = '${userid}'`, function (err, result) {
            if (err) {
                res.send({ err: 'err' })
            }
            if (result.length !== 0) {
                // Update Mysql 

                const sqql = `UPDATE services SET nama = '${nama}', deskripsi = '${deskripsi}', status = '${status}' WHERE userid = '${userid}'`;
                con.query(sqql, function (err, result) {
                    if (err) { throw err; }
                    res.status(200).send({ result })
                    console.log(result)
                })
            } else {
                return res.status(404).send({ message: 'Services tidak ditemukan !' })
            }
        })

    } else {
        const userid = req.body.Data.userid;
        const status = req.body.Data.status;
        const nama = req.body.Data.nama;
        const deskripsi = req.body.Data.deskripsi;
        // updata with mysql 

        con.query(`SELECT * FROM services WHERE userid = '${userid}'`, function (err, result) {
            if (err) {
                res.send({ err: 'err' })
            }
            if (result.length !== 0) {
                // Update Mysql 

                const sqql = `UPDATE services SET nama = '${nama}', deskripsi = '${deskripsi}', status = '${status}' WHERE userid = '${userid}'`;
                con.query(sqql, function (err, result) {
                    if (err) { throw err; }
                    res.status(200).send({ result })
                    console.log(result)
                })
            } else {
                return res.status(404).send({ message: 'Services portal tidak ditemukan !' })
            }
        })
    }
})

// Updataa user data name pic address

const upload = multer({
    storage: storage, limits: { fieldSize: 12 * 1024 * 1024 }
}).single("image");


router.put('/edit/:id', upload, (req, res, next) => {
    if (req.file && req.file !== '') {
        const id = req.params.id;
        const URL = req.protocol + "://" + req.get("host");
        const pic = URL + "/images/" + req.file.filename;

        const nama = req.body.nama;
        const alamat = req.body.alamat;
        // updata with mysql
        const sqql = `UPDATE users SET nama = '${nama}', alamat = '${alamat}', pic = '${pic}' WHERE id = '${id}'`;
        con.query(sqql, function (err, result) {
            if (err) throw err;
            res.status(200).send({ message: "sucsessfuly", result })
        })
    } else {
        const id = req.params.id;
        const nama = req.body.nama;
        const alamat = req.body.alamat;
        // updata with mysql 
        const sqql = `UPDATE users SET nama = '${nama}', alamat = '${alamat}' WHERE id = '${id}'`;
        con.query(sqql, function (err, result) {
            if (err) throw err;
            res.status(200).send({ message: 'updataed', result })
        })
    }
})



// delete one services

router.delete('/services/:id/:userid', (req, res, next) => {
    const userid = req.params.userid;
    const id = req.params.id;

    con.query(`SELECT * FROM services WHERE id ='${id}' AND userid = '${userid}'`,
        async function (err, result) {
            if (result.length !== 0) {
                // the password is correct
                con.query(`DELETE FROM services WHERE id = '${id}'`,
                    async function (err, result) {
                        if (err) throw (err);
                        res.status(200).send({ message: result })
                    })
            }
            if (result.length === 0) {
                res.status(400).send({ message: 'Parameter id salah !' });
            }
        })

})

// delete one user 

router.delete('/delete/:id/:password', (req, res, next) => {

    const id = req.params.id;
    const Pass = req.params.password;


    con.query(`SELECT * FROM users WHERE id='${id}' AND Password = '${Pass}'`,
        async function (err, result) {
            if (result.length !== 0) {
                // the password is correct
                con.query(`DELETE FROM users WHERE id = '${id}'`,
                    async function (err, result) {
                        if (err) throw (err);
                        res.status(200).send({ message: result })
                    })
            }
            if (result.length === 0) {
                res.status(400).send({ message: 'error the password is not correct' });
            }
        })
})




module.exports = router;
