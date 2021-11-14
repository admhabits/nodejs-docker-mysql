const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { pause } = require('../config/connect');

const Email = () => {

    const body = {
        "data": {
            "listEmail": [
                {
                    "email": "alamhafidz61@gmail.com"
                },
                {
                    "email": "alamhafidz60@gmail.com"
                },
                {
                    "email": "alamhafidz65@gmail.com"
                },
                {
                    "email": "alamhafidz64@gmail.com"
                },
                {
                    "email": "alamhafidz08@gmail.com"
                },
                {
                    "email": "alamhafidz02@gmail.com"
                }
            ],
            "waktuJeda": 5000,
            "jadwal":"*/1 * * * *",
            "from": "Alam Santiko Wibowo <no-reply@alamhafidz61@gmail.com>",
            "subject": "BELAJAR YUK NODEMAILER",
            "html": "Selamat pagi guys!"
        }
    };

    const daftarEmail = body.data.listEmail;
    const waktuJeda = body.data.waktuJeda;
    const jadwal = body.data.jadwal;

    const from = body.data.from;
    const subject = body.data.subject
    const html = body.data.html

    console.log(daftarEmail, waktuJeda, jadwal, from, subject, html);
    if (!body) {
        res.status(400).send({
            message: 'Err',
            status: false
        })
    }

    const transporterGmail = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS
        }
    })


    const kirimEmail = (jeda, data, from, subject, html) => {
        let interval = jeda;
        var list = data;
        let count = 0;

       
        const mailOptions = (penerima) => {
            return {
                from,
                to: penerima,
                subject,
                html
            }
        }

        const kirimSemuaEmail = () => {
            if (count === list.length || count > list.length) {
                // console.log('Kirim email selesai!');
                return false;
            } else {
                const email = list[count].email;
                console.table([{ penerima: email, count: count+1, pengirim: process.env.EMAIL }]);
                // console.table(list);
                transporterGmail.sendMail(mailOptions(email), function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
                count = count + 1;
            }
        }

        setInterval(kirimSemuaEmail, interval);
    }

    // kirimEmail(waktuJeda, daftarEmail, from, subject, html);

    cron.schedule(jadwal, () => {
        // Send e-mail
        console.log('1 menit kemudian');
        kirimEmail(waktuJeda, daftarEmail, from, subject, html);
    });
    
}

module.exports = Email;