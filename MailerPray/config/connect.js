const firebase = require('firebase');
const firebaseConfig = {
   apiKey: "AIzaSyAfXXveOa_5n-kivYXHp7_b-BJyFkg7K3o",
   authDomain: "starlova.firebaseapp.com",
   databaseURL: "https://starlova-default-rtdb.asia-southeast1.firebasedatabase.app",
   projectId: "starlova",
   storageBucket: "starlova.appspot.com",
   messagingSenderId: "784696998527",
   appId: "1:784696998527:web:b1079641643cf110019d4a",
   measurementId: "G-00V2BTD0V2"
};
firebase.initializeApp(firebaseConfig);
module.exports.database = firebase.database();
