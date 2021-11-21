
 const extractToken = (req) => {

    this.authorization = req.headers.authorization;
    this.isBearer = req.headers.authorization.split(' ')[0] === 'Bearer';
    if (this.authorization && this.isBearer) {
        return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        return req.query.token;
    }
    
    return null;
};

const isObjEmpty = (obj) => {

    for (var prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }
    return JSON.stringify(obj) === JSON.stringify({});

};

module.exports = { extractToken, isObjEmpty };