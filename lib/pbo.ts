var cpbo = 'wine ' + __dirname + '/../bin/cpbo.exe',
    cpboExtract = cpbo + ' -e %s %s',
    fs = require('fs'),
    exec = require('child_process').exec,
    crypto = require('crypto');

function getDescriptionExtFilename(directory) {
    if (fs.existsSync(directory + '/description.ext')) {
        return 'description.ext';
    } else if (fs.existsSync(directory+ '/Description.ext')) {
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
        digest;

    sha1.update(pboString);
    digest = sha1.digest('hex');


    fs.writeFileSync(fileName, pboString);

    exec(cpboExtract.replace('%s', fileName).replace('%s', unpackedDirName), function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);

        if (stderr) {
            callback(new Error(stderr));
        } else {
            callback(null, unpackedDirName);
        }

    });
}

exports.getDescriptionExt = function (pboString, fn) {

    extractPbo(function (err, unpackedDirName) {
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

