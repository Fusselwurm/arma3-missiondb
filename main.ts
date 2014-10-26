require('typescript-require');
/// <reference path="./typings/tsd.d.ts" />

import async = require('async');
import bunyan = require('bunyan');

import Pbo = require('./lib/Pbo');
import Webserver = require('./lib/Webserver');

var logger = bunyan.createLogger({name: 'main'});

async.parallel([
    Pbo.init,
    Webserver.init
], function (err) {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    logger.info('ready!');
});
