var
    fs = require('fs'),
    config = fs.readFileSync(__dirname + '/../config.json');

module.exports = function (key: String) {
    return config[key];
};