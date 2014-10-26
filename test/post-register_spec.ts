var
    frisby = require('frisby'),
    sleep = require('sleep'),
    endpoint = 'http://localhost:8080';

frisby.globalSetup({timeout: 15000});

frisby.
    create('register URL that exists!').
    post(endpoint + '/register', {url: endpoint + '/resources/testmission.pbo'}).
    expectStatus(202).
    expectJSONTypes({location: String}).
    afterJSON(function(response) {

        frisby.
            create('get raw data of registered Mission, before it has been fetched').
            get(response.location + '/raw').
            expectStatus(404).
            toss();

        sleep.sleep(10);

        frisby.
            create('get raw data of registered Mission after it has been fetched').
            get(response.location + '/raw').
            expectStatus(200).
            toss();
        frisby.
            create('get description.ext of known Mission').
            expectMaxResponseTime(20000).
            get(response.location + '/description.ext').
            expectStatus(200).
            expectBodyContains('gameType = COOP').
            toss();
        frisby.
            create('get mission.sqm of registered Mission').
            expectMaxResponseTime(20000).
            get(response.location + '/mission.sqm').
            expectStatus(200).
            expectBodyContains('class Mission').
            toss();

    }).
    toss();
