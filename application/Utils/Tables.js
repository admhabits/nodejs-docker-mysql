module.exports = function(connect, SelectTableQuery, CreateTableQuery){
    const SELECT = SelectTableQuery;
    const CREATE = CreateTableQuery;
    this.initDatabase = () => {
        connect.query(this.SELECT, function (err, result, fields) {
            if (err) {
                con.query(this.CREATE, function (err, result) {
                    if (err) throw err;
                });
            }
        })
    }
}