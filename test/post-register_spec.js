var
    frisby = require('frisby'),
    sleep = require('sleep'),
    endpoint = 'http://localhost:8080';

frisby.globalSetup({timeout: 15000});

frisby.
    create('register URL that exists!').
    post(endpoint + '/register', {url: endpoint + '/resources/testmission.pbo'}).
    expectStatus(201).
    expectJSONTypes({location: String}).
    afterJSON(function(response) {
        sleep.sleep(1);
        frisby.
            create('get raw data of registered Mission').
            get(response.location + '/raw').
            expectStatus(200).
            toss();

        frisby.
            create('get description.ext of registered Mission').
            expectMaxResponseTime(20000).
            get(response.location + '/description.ext').
            expectStatus(200).
            expectBodyContains('gameType = COOP').
            toss();

    }).
    toss();
