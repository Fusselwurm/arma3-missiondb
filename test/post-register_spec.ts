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


    }).
    toss();
