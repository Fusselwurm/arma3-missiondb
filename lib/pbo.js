var cpbo = 'wine ' + __dirname + '/../bin/cpbo.exe',
    cpboExtract = cpbo + ' -e %s %s',
    fs = require('fs'),
    exec = require('child_process').exec,
    fCount = (new Date()).getTime();

function getDescriptionExtFilename(directory) {
    if (fs.existsSync(directory + '/description.ext')) {
        return 'description.ext';
    } else if (fs.existsSync(directory+ '/Description.ext')) {
        return 'Description.ext';
    }
}

exports.getDescriptionExt = function (pboString, fn) {
    var
        fileName = '/tmp/arma3-missiondb-' + fCount + '.pbo',
        unpackedDirName = '/tmp/arma3-missiondb-' + fCount;
    fCount += 1;

    fs.writeFileSync(fileName, pboString);

    exec(cpboExtract.replace('%s', fileName).replace('%s', unpackedDirName), function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
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
