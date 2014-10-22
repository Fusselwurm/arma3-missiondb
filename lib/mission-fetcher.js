var
    http = require('http'),
    url = require('url');

exports.fetchHttp = function (missionUrl, fn) {
    var urlBits = url.parse(missionUrl);
    var options = {
        hostname: urlBits.host,
        port: urlBits.port || 80,
        path: urlBits.path + urlBits.query || '',
        method: 'GET'
    };

    var req = http.request(options, function (res) {
        var response = '';
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
            response += chunk;
        });
        res.on('end', function () {
            fn(null, response)
        });
    });
    req.on('error', function (err) {
        fn(err);
    });
    req.end();

};
