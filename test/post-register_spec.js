var
    frisby = require('frisby'),
    sleep = require('sleep'),
    endpoint = 'http://localhost:8080';

frisby.
    create('register URL that exists!').
    post(endpoint + '/register', {url: endpoint + '/resources/testmission.pbo'}).
    expectStatus(201).
    expectJSONTypes({location: String}).
    afterJSON(function(response) {
        sleep.sleep(1);
        frisby.
            create('check registered Mission for existance').
            get(response.location).
            expectStatus(200).
            toss();

    }).
    toss();
