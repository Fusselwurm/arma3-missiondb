/// <reference path="../typings/tsd.d.ts" />
/// <reference path="./config.ts" />
/// <reference path="./MissionRepository.ts" />
/// <reference path="./MissionRepository.ts" />
/// <reference path="./ResourceFetcher.ts" />

import url = require('url');
import restify = require('restify');

var
    missions = {},
    errorUrls = {},
    missionRepository = new MissionRepository(),
    baseUrl = Config.get('baseUrl'),
    resourceFetcher = new ResourceFetcher();

function respondHelllo(req, res, next) {
    res.send('hello ' + req.params.name);
    next();
}
function validUrl(string) {
    var bits = url.parse(string);

    return bits.protocol === 'http:' && bits.host && bits.path;
}


function registerUrl(req, res, next) {
    var
        missionUrl = req.params && req.params.url,
        location,
        status;

    if (!missionUrl || !validUrl(missionUrl)) {
        res.send(400);
        return next();
    }

    var mission = missionRepository.registerMission(missionUrl);
    if (mission.status === MissionStatus.Known) {
        status = 201;
        location = mission.contentDigest;
    } else {
        location = mission.urlDigest;
        status = 202;
    }
    res.send(status, {location: baseUrl + '/mission/' + location});
    return next();
}

function getMissions(req, res, next) {
    res.send([]);
    next();
}

function getMissionRaw(req, res, next) {
    var digest = req.params.digest;
    if (!missions[digest]) {
        res.send(404);
    } else if (missions[digest].content) {
        res.send(200, missions[digest].content);
    } else {
        res.send(500);
    }
    next();
}

function getMission() {}

function getMissionFileHandler(filename) {
    return function (req, res, next) {
        var digest = req.params.digest;
        if (!missions[digest]) {
            res.send(404);
            return next();
        }

        if (!missions[digest].content) {
            res.send(500);
            return next();
        }

        pbo.getPboContentsFile(filename, missions[digest].content, function (err, content) {
            if (err) {
                res.send(500);
                return next();
            }

            res.send(200, content);
            next();
        });

    }
}

class Webserver {

    init(callback: Function) : void {

        var
            server;

        server = restify.createServer();
        server.use(restify.bodyParser());
        server.get('/hello/:name', respondHelllo);
        server.head('/hello/:name', respondHelllo);

        server.post('/register', registerUrl);
        server.get('/missions/', getMissions);
        server.get('/mission/:digest', getMission);
        server.get('/mission/:digest/raw', getMissionRaw);
        server.get('/mission/:digest/description.ext', getMissionFileHandler('description.ext'));
        server.get('/mission/:digest/mission.sqm', getMissionFileHandler('mission.sqm'));

        server.get('/resources/:filename', function (req, res, next) {
            var contents = '';
            try {
                contents = resourceFetcher.getRaw(req.url);
                res.writeHead(200, {
                    'Content-Length': Buffer.byteLength(contents),
                    'Content-Type': 'text/plain'
                });
                res.write(contents);
                res.end();
            } catch (e) {
                res.send(404);
            }
            next();
        });

        server.listen(8080, function() {
            console.log('%s listening at %s', server.name, server.url);
            callback();
        });

    }
}

