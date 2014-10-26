/// <reference path="../typings/tsd.d.ts" />

import http = require('http');
import url = require('url');
import bunyan = require('bunyan');
import fs = require('fs');

var
    logger = bunyan.createLogger({name: 'missionFetcher'});

export function fetchHttp(missionUrl, fn) {
    var urlBits = url.parse(missionUrl);
    var options = {
        hostname: urlBits.hostname,
        port: urlBits.port || 80,
        path: urlBits.path + (urlBits.query || ''),
        method: 'GET'
    };

    var req = http.request(options, function (res: http.ClientResponse) {
        var response: Array<Buffer> = [];
        logger.info('getting document at %s with status %d ', missionUrl, res.statusCode);
        logger.info('HEADERS: ' + JSON.stringify(res.headers));
        res.on('data', function (chunk: Buffer) {
            response.push(chunk);
        });
        res.on('end', function () {
            var result: Buffer = Buffer.concat(response);
            logger.info('got document with %s bytes from %s', result.length, missionUrl);
            fn(null, Buffer.concat(response));
        });
    });
    req.on('error', function (err) {
        fn(err);
    });
    req.end();
}
