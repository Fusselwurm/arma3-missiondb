var
    fs = require('fs'),
    rawConfig = fs.readFileSync(__dirname + '/../config.json'),
    config = JSON.parse(rawConfig);

module.exports = function (key: String) {
    if (config[key] === undefined) {
        throw new Error('could not find config key "%s"'.replace('%s', key));
    }
    return config[key];
};
