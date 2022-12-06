let config = require('./configs');
let mongoose = require('mongoose');
mongoose.Promise = global.Promise;

module.exports = function () {
    let db = mongoose.connect(config.db).then(
        (connect) => { console.log('MongoDB connected') },
        (err) => { console.log('MongoDB connection error', err) }
    );
    return db;
};