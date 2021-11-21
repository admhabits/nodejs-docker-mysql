const { body, validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const connect = require('../config/connect');
const e = require('express');
const database = connect.database;

router.get('/data', async (req, res, next) => {
   database.ref('/users').on('value', async (snapshot) => {
      let data = [];
      snapshot.forEach(snap => {
         let list = snap.val();
         let values = { ...list, id: snap.key };
         data.push(values);
      })
      if (data.length !== 0) {
         return res.status(200).send({ data, status: true })
      } else {
         return res.status(500).send({ message: 'Internal Error!' })
      }

   });
})

const requestBody = [
   body('email').isEmail().withMessage("Masukan email yang valid!"),
   body('password').isLength({ min: 6 }).withMessage("Password minimal 6 karakter!"),
];

router.post('/signup', requestBody, async (req, res) => {

   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(422).send({
         message: errors.array()
      })
   } else {

      const email = req.body.email;
      const password = req.body.password;
      let data = [];
      database.ref('/users').orderByChild('email').equalTo(email).on('value', snapshot => {
         snapshot.forEach(function (snapshot) {
            let list = snapshot.val();
            const values = { ...list, id: snapshot.key };
            data.push(values);
         })
         if (data.length !== 0) {
            res.status(422).send({ message: "E-mail has been taken by another user", status: false })
         } else {
            signup();
         }
      })
    

      function signup() {
         database.ref('/users/').push({ email, password, isVerified: false }, () => {
            res.status(200).send({ message: 'success' });
         })
      }
   }

})



module.exports = router;