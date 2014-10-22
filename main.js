#!/bin/env node

var restify = require('restify');


function respondHelllo(req, res, next) {
    res.send('hello ' + req.params.name);
    next();
}

function registerUrl(req, res, next) {
    console.log(req);
}

function getMissions(req, res, next) {
    res.send([]);
    next();
}

var server = restify.createServer();
server.get('/hello/:name', respondHelllo);
server.head('/hello/:name', respondHelllo);

server.post('/register/', registerUrl);
server.get('/missions/', getMissions);

server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});