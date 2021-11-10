const express = require('express');
const router = express.Router();
const fs = require('fs');
const con = require('../config/connect');
const jwt = require('jsonwebtoken');
const Tables = require('../Utils/Tables');
const { body, validationResult } = require('express-validator');

// Pilih atau Buat Tabel Services
const SELECT = 'SELECT * FROM vpn';
const CREATE = `CREATE TABLE vpn (
                    id INT AUTO_INCREMENT PRIMARY KEY, 
                    vpnName VARCHAR(255), 
                    ipVpnServer VARCHAR(255), 
                    domainVpnServer VARCHAR(255),
                    vpnType VARCHAR(255), 
                    credentialType VARCHAR(255),
                    username VARCHAR(255),
                    password VARCHAR(255),
                    groupName VARCHAR(255),
                    groupPassword VARCHAR(255),
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

// CREATE VPN
const checkReqBody = [
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

router.post('/create', checkReqBody, async (req, res, next) => {

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
    console.table([{ vpnName, ipVpnServer, domainVpnServer, vpnType, credentialType, username, password, groupName, groupPassword }]);

    con.query(`SELECT * FROM vpn WHERE userid = '${userid}' AND username = '${username}'`, (err, rows) => {
        if (err) throw err;
        if (rows.length !== 0) {
            console.log(`vpn username ${username} telah digunakan!`);
            res.send({
                message: `vpn username ${username} telah digunakan!`,
                status: false
            });
        } else {
            var query1 = `INSERT INTO vpn (vpnName, ipVpnServer, domainVpnServer, vpnType, credentialType, username, password, userid) VALUES ('${vpnName}', '${ipVpnServer}', '${domainVpnServer}',' ${vpnType}', '${credentialType}', '${username}', '${password}', '${userid}')`;
            var query2 = `INSERT INTO vpn (vpnName, ipVpnServer, domainVpnServer, vpnType, credentialType, username, password, groupName, groupPassword, userid) VALUES ('${vpnName}', '${ipVpnServer}', '${domainVpnServer}', '${vpnType}', '${credentialType}', '${username}', '${password}', '${groupName}', '${groupPassword}', '${userid}')`;

            if (!groupName && !groupName && vpnType == 2) {
                return res.status(405).json({
                    message: 'Group Name && Group Password can not be empty!',
                    status: false
                })
            }
            
            if (vpnType == 1) {
                buatVpnService(query1);
            } else if (vpnType == 2) {
                buatVpnService(query2);
            } else if (vpnType != 1 || vpnType != 2) {
                return res.status(500).json({
                    message: 'Invalid Type Vpn!',
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
                    data: rows[0]
                })
            }
        })
    };

})


module.exports = router;
