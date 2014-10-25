var
    frisby = require('frisby'),
    endpoint = 'http://localhost:8080';

frisby.create('get "hello" moo')
    .get(endpoint + '/hello/moo')
    .expectStatus(200)
    .expectHeaderContains('content-type', 'application/json')
    .expectBodyContains("hello moo")
    .toss();

frisby.
    create('register invalid URL').
    post(endpoint + '/register', {url: 'meine-datei.pbo'}).
    expectStatus(400).
    toss();

frisby.
    create('register URL that does not exist').
    post(endpoint + '/register', {url: 'http://moo.test/doesnotexist'}).
    expectStatus(201).
    toss();
