const express = require('express');
const router = express.Router();
const fs = require('fs');
const con = require('../config/connect');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const { body, validationResult } = require('express-validator');
const e = require('express');

// Pilih atau Buat Tabel Services
const SELECT = 'SELECT * FROM vpn';
const CREATE = `CREATE TABLE vpn (
                    id INT AUTO_INCREMENT PRIMARY KEY, 
                    vpnName VARCHAR(255), 
                    ipVpnServer VARCHAR(255), 
                    domainVpnServer VARCHAR(255),
                    vpnType ENUM('1', '2'), 
                    credentialType ENUM('group', 'certificate', 'basic'),
                    username VARCHAR(255),
                    password VARCHAR(255),
                    groupName VARCHAR(255),
                    groupPassword VARCHAR(255),
                    userCertificate BLOB,
                    serverCertificate BLOB,
                    userid VARCHAR(255)
                )`;

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

function extractToken(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        return req.query.token;
    }
    return null;
}

/* ==== KETERANGAN ==== */
/* VPN TYPE = 1 ====> PERLU 1 KALI AUTH */
/* VPN TYPE = 2 ====> PERLU 2 KALI AUTH */
/* CREDENTIAL TYPE ====>  ["basic", "group", "certificate"] */


// CREATE VPN
const createBodyRequest = [
    body('vpnName').notEmpty(),
    body('ipVpnServer').notEmpty(),
    body('domainVpnServer').notEmpty(),
    body('vpnType').isInt().notEmpty(),
    body('credentialType').notEmpty(),
    body('username').notEmpty(),
    body('password').notEmpty(),
    body('groupName').optional(),
    body('groupPassword').optional()
];

// UPDATE VPN
const UpdateBodyRequest = [
    body('vpnName').notEmpty(),
    body('ipVpnServer').notEmpty(),
    body('domainVpnServer').notEmpty(),
    body('credentialType').notEmpty()
];


// CREATE VPN
router.post('/create', createBodyRequest, async (req, res, next) => {
    var Token, decoded, userid;
    if (req.headers.authorization) {
        Token = extractToken(req);
        decoded = jwt.decode(Token, { complete: true });
        userid = decoded.payload.userid;
    } else {
        return res.status(500).send({
            status: false,
            message: 'Authorization is required !'
        })
    }

    /* === VALIDASI BODY REQ == */
    const errors = validationResult(req);
    console.log(`APAKAH ARRAY OBJECT ERROR KOSONG ? ${errors.isEmpty()}`, errors); // ;
    if (!errors.isEmpty()) {
        res.status(422).send({
            errors: errors.array(),
        });
    }
    const { vpnName, ipVpnServer, domainVpnServer, vpnType, credentialType, username, password, groupName, groupPassword } = req.body;

    /* === CETAK NILAI BODY KEDALAM CONSOLE === */
    console.log(`Berikut nilai body yang dikirimn : \n`);
    console.table([{ vpnName, ipVpnServer, domainVpnServer, vpnType, credentialType, username, password, groupName, groupPassword, userid }]);

    con.query(`SELECT * FROM vpn WHERE userid = '${userid}' AND username = '${username}'`, (err, rows) => {
        if (err) throw err;
        if (rows.length !== 0) {
            console.log(`vpn username ${username} telah digunakan!`);
            res.send({
                message: `vpn username ${username} telah digunakan!`,
                status: false
            });
        } else {
            var query1 = `INSERT INTO vpn (vpnName, ipVpnServer, domainVpnServer, vpnType, credentialType, username, password, userid) VALUES ('${vpnName}', '${ipVpnServer}', '${domainVpnServer}',' ${vpnType}', '${credentialType}', '${username}', '${md5(password)}', '${userid}')`;
            var query2 = `INSERT INTO vpn (vpnName, ipVpnServer, domainVpnServer, vpnType, credentialType, username, password, groupName, groupPassword, userid) VALUES ('${vpnName}', '${ipVpnServer}', '${domainVpnServer}', '${vpnType}', '${credentialType}', '${username}', '${md5(password)}', '${groupName}', '${md5(groupPassword)}', '${userid}')`;

            if (!groupName && !groupName && vpnType == 2) {
                console.log('Group Name && Group Password can not be empty!');
                return res.status(405).json({
                    message: 'Group Name && Group Password can not be empty!',
                    status: false
                })
            } else if (groupName && groupName && vpnType == 1) {
                console.log('Group Name && Group Password must be empty!');
                return res.status(405).json({
                    message: 'Group Name && Group Password must be empty!',
                    status: false
                })
            }

            if (vpnType == 1 && credentialType == 'basic' || credentialType == 'group' || credentialType == 'certificate') {
                buatVpnService(query1);
            } else if (vpnType == 2 && credentialType == 'basic' || credentialType == 'group' || credentialType == 'certificate') {
                buatVpnService(query2);
            } else if (vpnType != 1 || vpnType != 2) {
                return res.status(500).json({
                    message: 'Invalid Type Vpn or Credential!',
                    status: false
                })
            }
        }
    })

    const buatVpnService = (query) => {
        con.query(query, async (err, rows) => {
            if (err) throw err;
            if (rows.length !== 0) {
                res.status(201).send({
                    status: true,
                    message: 'Vpn berhasil dibuat!',
                    result: rows[0]
                })
            }
        })
    };

})


//UPDATE VPN BY ID
router.post('/update/:id', UpdateBodyRequest, async (req, res, next) => {
    var Token, decoded, userid;
    const id = req.params.id;
    if (req.headers.authorization) {
        Token = extractToken(req);
        decoded = jwt.decode(Token, { complete: true });
        userid = decoded.payload.userid;
    } else {
        return res.status(500).send({
            status: false,
            message: 'Authorization is required !'
        })
    }

    /* === VALIDASI BODY REQ == */
    const errors = validationResult(req);
    console.log(`APAKAH ARRAY OBJECT ERROR KOSONG ? ${errors.isEmpty()}`, errors); // ;
    if (!errors.isEmpty()) {
        res.status(422).send({
            errors: errors.array(),
        });
    }
    const { vpnName, ipVpnServer, domainVpnServer, credentialType } = req.body;

    /* === CETAK NILAI BODY KEDALAM CONSOLE === */
    console.log(`Berikut nilai body yang dikirimn : \n`);
    console.table([{ vpnName, ipVpnServer, domainVpnServer, credentialType }]);

    con.query(`SELECT * FROM vpn WHERE userid = '${userid}' AND id = '${id}'`, (err, rows) => {
        if (err) throw err;
        if (rows.length === 0) {
            console.log(`Tidak ditemukan data!`);
            res.send({
                message: `data tidak ditemukan!`,
                status: false
            });
        } else {
            var query1 = `UPDATE vpn SET vpnName = '${vpnName}', ipVpnServer = '${ipVpnServer}', domainVpnServer = '${domainVpnServer}', credentialType = '${credentialType}' WHERE id = '${id}'`;
            if(credentialType == 'basic' || credentialType == 'group' || credentialType == 'certificate'){
                updateVPN(query1);
            } else {
                res.status(400).send({
                    status: false,
                    message: 'Invalid type credential!'
                })
            }
           
        }
    })

    const updateVPN = (query) => {
        con.query(query, async (err, rows) => {
            if (err) throw err;
            if (rows.length !== 0) {
                console.log("UPDATE VPN BERHASIL DENGAN ID : " + id)
                console.table([rows]);
                res.status(201).send({
                    status: true,
                    message: 'Vpn berhasil diupdate!',
                    result: rows
                })
            }
        })
    };


})


//UPDATE VPN CERTIFICATE BY ID
router.post('/update/certificate/:id', async (req, res, next) => {
    var Token, decoded, userid;
    const id = req.params.id;
    if (req.headers.authorization) {
        Token = extractToken(req);
        decoded = jwt.decode(Token, { complete: true });
        userid = decoded.payload.userid;
    } else {
        return res.status(500).send({
            status: false,
            message: 'Authorization is required !'
        })
    }

    /* === VALIDASI BODY REQ == */
    // const errors = validationResult(req);
    // console.log(`APAKAH ARRAY OBJECT ERROR KOSONG ? ${errors.isEmpty()}`, errors); // ;
    // if (!errors.isEmpty()) {
    //     res.status(422).send({
    //         errors: errors.array(),
    //     });
    // }
    const { userCertificate, serverCertificate } = req.file;

    /* === CETAK NILAI BODY KEDALAM CONSOLE === */
    // console.log(`Berikut nilai body yang dikirimn : \n`);
    // console.table([{ vpnName, ipVpnServer, domainVpnServer, credentialType }]);

    con.query(`SELECT * FROM vpn WHERE userid = '${userid}' AND id = '${id}'`, (err, rows) => {
        if (err) throw err;
        if (rows.length === 0) {
            console.log(`Tidak ditemukan data!`);
            res.send({
                message: `data tidak ditemukan!`,
                status: false
            });
        } else {
            var query1 = `UPDATE vpn SET userCertificate = '${userCertificate}', serverCertificate = '${serverCertificate}' WHERE id = '${id}'`;
            if(!credentialType && credentialType == 'certificate'){
                updateVPN(query1);
            } else {
                res.status(400).send({
                    status: false,
                    message: 'Invalid type credential!'
                })
            }
           
        }
    })

    const updateVPN = (query) => {
        con.query(query, async (err, rows) => {
            if (err) throw err;
            if (rows.length !== 0) {
                console.log("UPDATE VPN BERHASIL DENGAN ID : " + id)
                console.table([rows]);
                res.status(201).send({
                    status: true,
                    message: 'Vpn berhasil diupdate!',
                    result: rows
                })
            }
        })
    };


})

const getVpnBodyRequest = [
    body('type').isString().notEmpty()
];

//GET VPN BY ID
router.patch('/getvpnbyid', getVpnBodyRequest, (req, res, next) => {
    var Token, decoded, userid;

    /* === CHECK HEADERS AUTHORIZATION === */
    if (req.headers.authorization) {
        Token = extractToken(req);
        decoded = jwt.decode(Token, { complete: true });
        userid = decoded.payload.userid;
    } else {
        return res.status(500).send({
            status: false,
            message: 'Headers authorization is required!'
        })
    }

    /* === CHECK BODY VALIDATION === */
    const errors = validationResult(req);
    console.log(`APAKAH ARRAY OBJECT ERROR KOSONG ? ${errors.isEmpty()}`, errors); // ;
    const { type, id } = req.body;
    console.table([{ type, id }])

    if (!errors.isEmpty()) {
        res.status(500).send({
            errors: errors.array()
        });
    } else if (req.body.type == 'vpn') {
        const id = req.body.id;
        con.query(`SELECT * FROM vpn WHERE id = '${id}' AND userid = '${userid}'`, (err, rows) => {
            if (err) throw err;
            if (rows.length !== 0) {
                console.log(`HASIL DATA DARI ID : ${id}`);
                console.table([rows[0]]);
                return res.status(200).send({
                    status: true,
                    result: rows[0],
                    message: `success fetching vpn with id ${id}`,
                })
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Tidak ditemukan data!',
                })
            }
        })
    } else {
        return res.status(500).json({
            status: false,
            message: 'Invalid type body request!'
        })
    }


})

//GET VPN ALL
router.patch('/getvpns', getVpnBodyRequest, (req, res, next) => {
    var Token, decoded, userid;

    /* === CHECK HEADERS AUTHORIZATION === */
    if (req.headers.authorization) {
        Token = extractToken(req);
        decoded = jwt.decode(Token, { complete: true });
        userid = decoded.payload.userid;
    } else {
        return res.status(500).send({
            status: false,
            message: 'Headers authorization is required!'
        })
    }

    /* === CHECK BODY VALIDATION === */
    const errors = validationResult(req);
    console.log(`APAKAH ARRAY OBJECT ERROR KOSONG ? ${errors.isEmpty()}`, errors); // ;
    const { type } = req.body;
    console.table([{ type }])

    if (!errors.isEmpty()) {
        res.status(500).send({
            errors: errors.array()
        });
    } else if (req.body.type == 'vpn') {
        const id = req.body.id;
        con.query(`SELECT * FROM vpn WHERE userid = '${userid}' ORDER BY id desc`, (err, rows) => {
            if (err) throw err;
            console.log("SEMUA DATA LIST VPN : " + rows.length);
            console.table(rows);
            if (rows.length !== 0) {
                return res.status(200).send({
                    status: true,
                    result: rows,
                    message: `success fetching vpn list`,
                })
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Tidak ditemukan data!',
                })
            }
        })
    } else {
        return res.status(500).json({
            status: false,
            message: 'Invalid type body request!'
        })
    }


})




module.exports = router;
