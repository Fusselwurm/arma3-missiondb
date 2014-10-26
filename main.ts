require('typescript-require');
/// <reference path="./typings/tsd.d.ts" />

import async = require('async');

import Pbo = require('./lib/Pbo');
import Webserver = require('./lib/Webserver');

async.parallel([
    Pbo.init,
    Webserver.init
], function (err) {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    console.log('ready!');
});
