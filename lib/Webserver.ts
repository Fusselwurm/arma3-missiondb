/// <reference path="../typings/tsd.d.ts" />

import url = require('url');
import restify = require('restify');
import bunyan = require('bunyan');

import Config = require('./Config');
import MissionRepository = require('./MissionRepository');
import Pbo = require('./Pbo');
import ResourceFetcher = require('./ResourceFetcher');

var
    baseUrl = Config.get('baseUrl'),
    logger = bunyan.createLogger({name: 'webserver'});

function respondHelllo(req, res, next) {
    res.send('hello ' + req.params.name);
    next();
}
function validUrl(urlString: string) {
    var bits = url.parse(urlString);

    return bits.protocol === 'http:' && bits.host && bits.path;
}

function registerUrl(req, res, next) {
    var
        missionUrl = req.params && req.params.url,
        location,
        mission: MissionRepository.Mission,
        status;

    if (!missionUrl || !validUrl(missionUrl)) {
        res.send(400);
        return next();
    }

    try {
        mission = MissionRepository.registerMission(missionUrl);
    } catch (e) {
        console.error(e);
        if (e instanceof MissionRepository.ErrorUrlException) {
            res.send(400);
        } else {
            res.send(500);
        }
        return next();
    }

    if (mission.status === MissionRepository.MissionStatus.Known) {
        status = 201;
        location = mission.getContentDigest();
    } else {
        location = mission.getUrlDigest();
        status = 202;
    }
    res.send(status, {location: baseUrl + '/mission/' + location});
    return next();
}

function getMissions(req, res, next) {
    res.send([]);
    next();
}

function exceptionLoggingDecorator(decorated: Function) {
    return function () {
        try {
            decorated.apply(this, arguments);
        } catch (e) {
            console.log(e);
            throw e;
        }
    };
}

function getMissionRaw(req, res, next) {
    var
        digest, mission;

    digest = req.params.digest;

    logger.debug('someone is getting raw data by digest ' + digest + '...');

    mission = MissionRepository.getMission(digest);

    logger.debug('and did not find a mission');

    if (!mission) {
        res.send(404);
        return next();
    }
    if (mission.getContent()) {
        res.setHeader('Content-Type', 'application/x-pbo');
        res.send(200, mission.getContent());
        return next();
    }

    res.send(500);
    next();
}

function getMission() {}

function getMissionFileHandler(filename) {
    return function (req: restify.Request, res: restify.Response, next: Function) {
        var digest, mission;

        digest = req.params.digest;
        logger.debug('getting ' + filename + ' with digest ' + digest + ' ...');
        mission = MissionRepository.getMission(digest);

        logger.debug('still alive ... ,mission is ' + mission);

        if (!mission) {
            res.send(404);
            return next();
        }
        if (!mission.getContent()) {
            logger.warn('couldnt find mission content for mission %s', mission.getUrl());
            res.send(500);
            return next();
        }
        if (!mission.getFile(filename)) {
            logger.warn('couldnt find file %s', filename)
            res.send(404);
            return next();
        }

        res.contentType = 'text/plain';
        res.send(200, mission.getFile(filename));
        next();
    }
}

function filenameToContentType(filename: string): string {
    var extension = filename.split('.').pop();

    var map = {
        'pbo': 'application/x-pbo'
    };
    return map[extension] || 'text/plain';
}

function getResource(req, res, next) {
    var contents = '';
    try {
        contents = ResourceFetcher.getRaw(req.url);
        res.writeHead(200, {
            'Content-Length': Buffer.byteLength(contents),
            'Content-Type': filenameToContentType(req.url)
        });
        res.write(contents);
        res.end();
    } catch (e) {
        res.send(404);
    }
    next();
}

export function init(callback: Function) : void {
    var
        server;

    server = restify.createServer();
    server.use(restify.bodyParser());
    server.get('/hello/:name', respondHelllo);
    server.head('/hello/:name', respondHelllo);

    server.post('/register', exceptionLoggingDecorator(registerUrl));
    server.get('/missions/', getMissions);
    server.get('/mission/:digest', getMission);
    server.get('/mission/:digest/raw', getMissionRaw);
    server.get('/mission/:digest/description.ext', getMissionFileHandler('description.ext'));
    server.get('/mission/:digest/mission.sqm', getMissionFileHandler('mission.sqm'));

    server.get('/resources/:filename', getResource);

    server.listen(8080, function() {
        logger.info('%s listening at %s', server.name, server.url);
        callback();
    });
}
