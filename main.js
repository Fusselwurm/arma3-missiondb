#!/bin/env node

var restify = require('restify'),
    url = require('url'),
    crypto = require('crypto'),
    missionFetcher = require('./lib/mission-fetcher.js'),
    baseUrl = 'http://localhost:8080',
    missions = {},
    errorUrls = {};


function respondHelllo(req, res, next) {
    res.send('hello ' + req.params.name);
    next();
}

function register(digest, url) {
    missions[digest] = url;
    missionFetcher.fetchHttp(url, function (err, data) {
        if (err) {
            delete missions[digest];
            if (err.code === 'ENOTFOUND') {
                errorUrls[digest] = 404;
            }
            errorUrls[digest] = 500;
        }
        console.log('successfully fetched ' + url);
    });
}

function validUrl(string) {
    var bits = url.parse(string);

    return bits.protocol === 'http:' && bits.host && bits.path;
}

function registerUrl(req, res, next) {
    var
        missionUrl = req.params && req.params.url,
        hash = crypto.createHash('sha1'),
        digest;

    hash.update(missionUrl);
    digest = hash.digest('hex');
    if (!missionUrl) {
        res.send(400);
    } else if (!validUrl(missionUrl)) {
        res.send(400);
    } else {
        register(digest, missionUrl);
        res.send(201, {location: baseUrl + '/mission/' + digest})
    }
    next();
}

function getMissions(req, res, next) {
    res.send([]);
    next();
}

var server = restify.createServer();
server.use(restify.bodyParser());
server.get('/hello/:name', respondHelllo);
server.head('/hello/:name', respondHelllo);

server.post('/register', registerUrl);
server.get('/missions/', getMissions);

server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});