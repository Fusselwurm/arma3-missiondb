/// <reference path="./typings/tsd.d.ts" />
/// <reference path="./lib/Pbo.ts" />
/// <reference path="./lib/webserver.ts" />

import Pbo = require('lib/Pbo');

var
    pbo = new Pbo(),
    webserver = new Webserver();

async.parallel([
    pbo.init,
    webserver.init
], function (err, results) {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    console.log('ready...');
});
