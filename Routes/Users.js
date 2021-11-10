const con = require('../config/connect');
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const md5 = require('md5');

// Pilih atau Buat Tabel Services
const SELECT = 'SELECT * FROM users';
const CREATE = 'CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), password  VARCHAR(255), email VARCHAR(255) NOT NULL UNIQUE, userid VARCHAR(255) ) ';

function SelectOrCreateTable() {

    con.query(SELECT, function (err, result, fields) {
        if (err) {
            con.query(CREATE, function (err, result) {
                if (err) throw err;
            });
        }
    })
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
    queryAuth = `SELECT userid FROM users WHERE email = '${email}' OR username = '${username}' AND  password = '${pass}' `;
    con.query(queryAuth, async function (err, result) {
        if (result.length !== 0) {
            // GET USER ID
            GetUserId(result)
        }
        if (result.length === 0) {
            res.status(400).send({ message: 'error not found' });
        }
    });
    function GetUserId(rows) {
        const result = Object.values(JSON.parse(JSON.stringify(rows)));
        const userid = result[0].userid;
        console.log("Get ID in CREATE TOKEN LOGIN : " + result[0].userid);
        if (username) {
            jwt.sign({ username: username, userid: userid }, JwtPrivateSecrt,
                (err, token) => {
                    res.status(200).send({ token: token, message: "Token User Generated!" });
                });
        } else if (email) {
            jwt.sign({ email: email, userid: userid }, JwtPrivateSecrt,
                (err, token) => {
                    res.status(200).send({ token: token, message: "Token Email Generated!" });
                });
        }
    }
});

// Pendaftaran Users
router.post('/signup', async (req, res) => {
    console.log(req.body);
    const email = req.body.signup.email;
    const pass = md5(req.body.signup.password);
    const username = req.body.signup.username;
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
                    res.status(200).send({ result, message: 'Pendaftaran berhasil!', code: 200 })
                    console.log(result)
                })

            } else if(result.length !== 0){
                // return res.status(201).send({ message: 'Email atau Username telah digunakan !', code: 201})
                // Jika ada data users maka Buat Token
                buatToken();
                
            }
        })
    } else {
        res.status(203).send({ message: "Required Valid field !" });
    }

    function buatToken(){
        var queryAuth = `SELECT userid FROM users WHERE email = '${email}' OR username = '${username}' AND  password = '${pass}' `;
        con.query(queryAuth, async function (err, result) {
            if (result.length !== 0) {
                // GET USER ID
                GetUserId(result)
            }
            if (result.length === 0) {
                res.status(400).send({ message: 'error not found' });
            }
        });
        function GetUserId(rows) {
            const result = Object.values(JSON.parse(JSON.stringify(rows)));
            const userid = result[0].userid;
            console.log("Get ID in CREATE TOKEN LOGIN : " + result[0].userid);
    
            if (email) {
                jwt.sign({ email: email, userid: userid }, JwtPrivateSecrt,
                    (err, token) => {
                        res.status(204).send({ token: token, message: "Token Email Generated!" });
                    });
            }
        }
    }

})

module.exports = router;
