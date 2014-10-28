var
    frisby = require('frisby'),
    endpoint = 'http://localhost:8080',
    missionDigest = '59a93b6e0fdeda562100265ff69d7b70b5da4595', // test/missions/TvT%20busted.ProvingGrounds_PMC.pbo
    missionUrl = endpoint + '/mission/' + missionDigest;

frisby.
    create('get mission.sqm of local mission').
    expectMaxResponseTime(1000).
    get(missionUrl + '/mission.sqm').
    expectStatus(200).
    expectBodyContains('class Mission').
    toss();
