const express = require('express');
const router = express.Router();
const fs = require('fs');
const con = require('../config/connect');
const initDatabase = require('../Utils/Tables');
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
                )`;

initDatabase(con, SELECT, CREATE);

// CREATE VPN

const checkBody = [
    body('vpnName').notEmpty(),
];

router.post('/create', checkBody, async (req, res, next) => {

    /* === VALIDASI BODY REQ == */
    const errors = validationResult(req);
    console.log(`BODY REQUEST APAKAH KOSONG ? ${errors.isEmpty()}`);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            errors: errors.array()
        });
    }

})


module.exports = router;
