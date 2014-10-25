var async = require('async');

async.parallel([
    require(__dirname + '/lib/pbo.js').init,
    require(__dirname +  '/lib/webserver.js').init
], function (err, results) {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    console.log('ready...');
});
