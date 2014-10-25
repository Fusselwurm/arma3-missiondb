var fs = require('fs');

exports.getRaw = function (path) {
    var contents;
    if (path.indexOf('~') !== -1 || path.indexOf('..') !== -1) {
        throw new Error('fck off');
    }
    if (path.indexOf('/resources/') !== 0) {
        throw new Error('still nope');
    }
    contents = fs.readFileSync(__dirname + '/..' + path);
    return contents.toString();
};
