/// <reference path="../typings/tsd.d.ts" />

import child_process = require('child_process');
import util = require('util');
import crypto = require('crypto');
import fs = require('fs');
import async = require('async');
import bunyan = require('bunyan');

import Config = require('./Config');

var
    cpbo = 'wine ' + __dirname + '/../bin/cpbo.exe',
    cpboExtract = cpbo + ' -e %s %s',
    exec = child_process.exec,
    pboCachedir = Config.get('pboCachedir'),
    format = util.format,
    logger = bunyan.createLogger({name: "pbo"});

/**
 *
 * @param pbo Buffer
 * @param callback receives path to extracted pbo
 */
function extractPbo(pbo: Buffer, callback: Function) {
    var
        sha1 = crypto.createHash('sha1'),
        digest,
        pboFilename,
        pboDirname;

    sha1.update(pbo);
    digest = sha1.digest('hex');

    pboFilename = pboCachedir + '/' + digest + '.pbo';
    pboDirname = pboCachedir + '/' + digest;

    fs.stat(pboDirname, function (err) {
        if (!err) {
            return callback(null, pboDirname);
        }

        fs.writeFileSync(pboFilename, pbo);

        exec(format(cpboExtract, pboFilename, pboDirname), function (error, stdout, stderr) {
            logger.debug('stdout: ' + stdout);
            logger.debug('stderr: ' + stderr);

            if (stderr) {
                callback(new Error(stderr.toString()));
            } else {
                lowercaseDir(pboDirname, function (err) {
                    if (err) {
                        throw err;
                    }
                    logger.debug('...lowercased all filenames.');
                    callback(null, pboDirname);
                });

            }
        });
    });
}

function lowercaseDir(dirname: string, callback) {
    fs.readdir(dirname, function (err: Error, filenames: Array<string>) {
        var lowercaseFile = function (callback: Function) {
            var
                origFilename = filenames.pop(),
                lowercaseFilename = origFilename.toLowerCase();

            if (origFilename === lowercaseFilename) {
                return callback();
            }

            fs.rename(format('%s/%s', dirname, origFilename), format('%s/%s', dirname, lowercaseFilename), function (err) {
                if (!err) {
                    logger.debug(format('renamed %s => %s', origFilename, lowercaseFilename));
                }
                callback(err);
            });
        };

        async.parallel(filenames.map(function () {return lowercaseFile; }), callback);
    });
}

export function getPboContentsFile(filename: string, pbo: Buffer, fn: Function) {
    extractPbo(pbo, function (err, unpackedDirName: String) {
        fs.readFile(unpackedDirName + '/' + filename, 'UTF-8', function (err, content) {
            if (err) {
                fn(new Error(format('couldnt find %s after extraction', filename)));
            } else {
                fn(null, content);
            }
        });
    });
}

export function init(callback: Function) {

    fs.stat(pboCachedir, function (err, stats) {
        if (err) {
            fs.mkdir(pboCachedir, function (err) {
                if (err) {
                    throw err;
                }
                logger.info('cache dir created.');
                callback();
            });
            return;
        }
        if (!stats.isDirectory()) {
            throw new Error('cachedir ' + pboCachedir + ' exists but is no directory');
        }
        logger.info('cache dir exists.');
        callback();
    });
}
