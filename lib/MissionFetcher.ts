/// <reference path="../typings/tsd.d.ts" />

import http = require('http');
import url = require('url');
import util = require('util');

var format = util.format;

export function fetchHttp(missionUrl, fn) {
    var urlBits = url.parse(missionUrl);
    var options = {
        hostname: urlBits.hostname,
        port: urlBits.port || 80,
        path: urlBits.path + (urlBits.query || ''),
        method: 'GET'
    };

    var req = http.request(options, function (res: http.ClientResponse) {
        var response = '';
        console.log(format('got document at %s with status %d ', res.statusCode));
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            response += chunk;
        });
        res.on('end', function () {
            fn(null, response)
        });
    });
    req.on('error', function (err) {
        fn(err);
    });
    req.end();
}
