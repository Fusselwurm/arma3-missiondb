var
    frisby = require('frisby'),
    endpoint = 'http://localhost:8080';

frisby.
    create('get resource').
    get(endpoint + '/resources/testmission.pbo').
    expectStatus(200).
    toss();


frisby.
    create('get resource').
    get(endpoint + '/resources/testresource').
    expectStatus(200).
    expectBodyContains('\n fää').
    toss();