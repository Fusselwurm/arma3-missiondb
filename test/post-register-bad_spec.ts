var
    frisby = require('frisby'),
    endpoint = 'http://localhost:8080';

frisby.
    create('register invalid URL').
    post(endpoint + '/register', {url: 'meine-datei.pbo'}).
    expectStatus(400).
    toss();

frisby.
    create('register URL that does not exist').
    post(endpoint + '/register', {url: 'http://moo.test/doesnotexist/' + (new Date()).getTime()}).
    expectStatus(202).
    toss();

frisby.
    create('GETting results in 405').
    get(endpoint + '/register', {url: 'http://moo.test/doesnotexist/' + (new Date()).getTime()}).
    expectStatus(405).
    toss();