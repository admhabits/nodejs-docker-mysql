const connect = require('../config/connect');

module.tables = function(SelectTableQuery, CreateTableQuery){
    connect.query(SelectTableQuery, function (err, result, fields) {
        if (err) {
            con.query(CreateTableQuery, function (err, result) {
                if (err) throw err;
            });
        }
    })
}