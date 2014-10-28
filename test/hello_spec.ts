var
    frisby = require('frisby'),
    endpoint = 'http://localhost:8080';

frisby.create('get "hello" moo')
    .get(endpoint + '/hello/moo')
    .expectStatus(200)
    .expectHeaderContains('content-type', 'application/json')
    .expectBodyContains("hello moo")
    .toss();
