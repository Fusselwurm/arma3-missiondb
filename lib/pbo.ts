var cpbo = 'wine ' + __dirname + '/../bin/cpbo.exe',
    cpboExtract = cpbo + ' -e %s %s',
    fs = require('fs'),
    exec = require('child_process').exec,
    crypto = require('crypto'),
    pboCachedir = require(__dirname + '/config.js').pboCachedir || '/tmp';

function getDescriptionExtFilename(directory: String) {
    if (fs.existsSync(directory + '/description.ext')) {
        return 'description.ext';
    } else if (fs.existsSync(directory + '/Description.ext')) {
        return 'Description.ext';
    }
}

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

        exec(cpboExtract.replace('%s', pboFilename).replace('%s', pboDirname), function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);

            if (stderr) {
                callback(new Error(stderr));
            } else {
                callback(null, pboDirname);
            }
        });
    });
}

exports.getDescriptionExt = function (pboString: String, fn: Function) {

    extractPbo(pboString, function (err, unpackedDirName: String) {
        var fName = getDescriptionExtFilename(unpackedDirName),
            content;
        if (fName) {
            content = fs.readFileSync(unpackedDirName + '/' + fName, 'UTF-8');
            fn(null, content);
        } else {
            fn(new Error('couldnt find description.ext after extraction'));
        }
    });
};

exports.init = function (callback) {
    fs.stat(pboCachedir, function (err, stats) {
        if (err) {
            fs.mkdir(pboCachedir, function (err) {
                if (err) {
                    throw err;
                }
                callback();
            });
            return;
        }
        if (!stats.isDirectory()) {
            throw new Error('cachedir ' + pboCachedir + ' exists but is no directory');
        }
        callback();
    });
};
