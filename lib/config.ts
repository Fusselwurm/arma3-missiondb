/// <reference path="./../typings/tsd.d.ts" />

import fs = require('fs');

var
    rawConfig = fs.readFileSync('./../config.json'),
    config = JSON.parse(rawConfig.toString());

class Config {
    static get(key: string) {
        if (config[key] === undefined) {
            throw new Error('could not find config key "%s"'.replace('%s', key));
        }
        return config[key];
    }
}
