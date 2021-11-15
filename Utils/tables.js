const connect = require('../config/connect');

const tables = (SelectTableQuery, CreateTableQuery) => {
    connect.query(SelectTableQuery, function (err, result, fields) {
        if (err) {
            con.query(CreateTableQuery, function (err, result) {
                if (err) throw err;
            });
        }
    })
}

module.exports = { tables };