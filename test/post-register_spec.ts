var
    frisby = require('frisby'),
    sleep = require('sleep'),
    _ = require('underscore'),
    http = require('http'),
    async = require('async'),
    endpoint = 'http://localhost:8080';

function waitFor(condition, callback) {
    (function check() {
        condition(function (err, result) {
            if (err) {
                return callback(err);
            } else if (result) {
                return callback(null);
            } else {
                sleep.sleep(1);
                check();
            }
        });
    }());
}

function waitForHttpStatus(url, statuscode, callback) {
    var now = _.now();
    waitFor(function (callback) {
        if (_.now() > (now + 5000)) {
            callback(new Error('wait timeout!'));
        }
        frisby.
            create('GETting data after it has been fetched gets you... data!').
            get(url).
            after(function (err, response) {
                if (response.statusCode === statuscode) {
                    callback(null, true);
                } else if (err) {
                    callback(err);}
                else {
                    callback(null, false);
                }
            }).
            toss();
    }, callback);
}

frisby.globalSetup({timeout: 15000});


frisby.
    create('register URL that exists!').
    post(endpoint + '/register', {url: endpoint + '/resources/testmission.pbo'}).
    expectStatus(202).
    expectJSONTypes({location: String}).
    afterJSON(function (response) {
        var missionUrl = response.location;

        frisby.
            create('GETting data before it has been fetched results in error').
            get(missionUrl + '/raw').
            expectStatus(503).
            toss();

        async.waterfall([
            function (next) {
                waitForHttpStatus(missionUrl + '/raw', 200, function (err) {
                    if (err) {
                        throw err;
                    }

                    frisby.
                        create('GETting data after it has been fetched gets you... data!').
                        get(missionUrl + '/raw').
                        expectStatus(200).
                        expectHeader('Content-Type', 'application/x-pbo').
                        toss();

                    next();
                });
            },
            function (next) {
                waitForHttpStatus(missionUrl + '/description.ext', 200, function () {
                    frisby.
                        create('get description.ext of known Mission').
                        expectMaxResponseTime(1000).
                        get(missionUrl + '/description.ext').
                        expectStatus(200).
                        expectBodyContains('gameType = COOP').
                        toss();
                    next();
                });
            },
            function (next) {
                waitForHttpStatus(missionUrl + '/description.ext', 200, function () {
                    frisby.
                        create('get mission.sqm of registered Mission').
                        expectMaxResponseTime(1000).
                        get(missionUrl + '/mission.sqm').
                        expectStatus(200).
                        expectBodyContains('class Mission').
                        toss();

                    next();
                });
            }
        ]);

    }).
    toss();
