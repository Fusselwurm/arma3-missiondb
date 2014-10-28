var
    frisby = require('frisby'),
    endpoint = 'http://localhost:8080',
    missionDigest = '59a93b6e0fdeda562100265ff69d7b70b5da4595', // test/missions/TvT%20busted.ProvingGrounds_PMC.pbo
    missionsUrl = endpoint + '/missions';

frisby.
    create('getting missions list').
    get(missionsUrl).
    expectStatus(200).
    expectJSONTypes(0, {
        originUrl: String,
        contentDigest: String,
        url: String
    }).
    toss();
