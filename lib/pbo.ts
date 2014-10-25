var
    cpbo = 'wine ' + __dirname + '/../bin/cpbo.exe',
    cpboExtract = cpbo + ' -e %s %s',
    fs = require('fs'),
    exec = require('child_process').exec,
    crypto = require('crypto'),
    async = require('async'),
    pboCachedir = require(__dirname + '/config.js')('pboCachedir'),
    format = require('util').format;

/**
 *
 * @param pboString
 * @param callback receives path to extracted pbo
 */
function extractPbo(pboString, callback: Function) {
    var
        sha1 = crypto.createHash('sha1'),
        digest,
        pboFilename,
        pboDirname;

    sha1.update(pboString);
    digest = sha1.digest('hex');

    pboFilename = pboCachedir + '/' + digest + '.pbo';
    pboDirname = pboCachedir + '/' + digest;

    fs.stat(pboDirname, function (err, stats) {
        if (!err) {
            return callback(null, pboDirname);
        }

        fs.writeFileSync(pboFilename, pboString);

        exec(format(cpboExtract, pboFilename, pboDirname), function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);

            if (stderr) {
                callback(new Error(stderr));
            } else {
                lowercaseDir(pboDirname, function (err) {
                    if (err) {
                        throw err;
                    }
                    console.log('...lowercased all filenames.');
                    callback(null, pboDirname);
                });

            }
        });
    });
}

function lowercaseDir(dirname: String, callback) {
    fs.readdir(dirname, function (err: Error, filenames: Array) {
        var lowercaseFile = function (callback) {
            var
                origFilename = filenames.pop(),
                lowercaseFilename = origFilename.toLowerCase();

            if (origFilename === lowercaseFilename) {
                return callback();
            }

            fs.rename(format('%s/%s', dirname, origFilename), format('%s/%s', dirname, lowercaseFilename), function (err) {
                if (!err) {
                    console.log(format('\trenamed %s => %s', origFilename, lowercaseFilename));
                }
                callback(err);
            });
        };

        async.parallel(filenames.map(function () {return lowercaseFile; }), callback);
    });
}

exports.getPboContentsFile = function(filename: String, pboString: String, fn: Function) {
    extractPbo(pboString, function (err, unpackedDirName: String) {
        fs.readFile(unpackedDirName + '/' + filename, 'UTF-8', function (err, content) {
            if (err) {
                fn(new Error(format('couldnt find %s after extraction', filename)));
            } else {
                fn(null, content);
            }
        });
    });
};

exports.init = function (callback) {
    fs.stat(pboCachedir, function (err, stats) {
        if (err) {
            fs.mkdir(pboCachedir, function (err) {
                if (err) {
                    throw err;
                }
                console.log('cache dir created.');
                callback();
            });
            return;
        }
        if (!stats.isDirectory()) {
            throw new Error('cachedir ' + pboCachedir + ' exists but is no directory');
        }
        console.log('cache dir exists.');
        callback();
    });
};
