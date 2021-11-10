module.exports = function(connect, SelectTableQuery, CreateTableQuery){
    const SELECT = SelectTableQuery;
    const CREATE = CreateTableQuery;
    this.InitDatabase = () => {
        connect.query(SELECT, function (err, result, fields) {
            if (err) {
                con.query(CREATE, function (err, result) {
                    if (err) throw err;
                });
            }
        })
    }
}