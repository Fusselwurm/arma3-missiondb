/// <reference path="../typings/tsd.d.ts" />

import fs = require('fs');
import async = require('async');
import bunyan = require('bunyan');
import Config = require('./Config');
import MissionRepository = require('./MissionRepository');

var
    logger = bunyan.createLogger({name: 'missionFetcherLocal'}),
    localDirectories = Config.get('localDirectories') || [];

logger.level(bunyan.DEBUG);

function getDirectoryMissions(path, callback: {(err: Error, results: Array<Buffer>): any}): void {
    fs.readdir(path, function (err, filenames: Array<string>) {
        var fileReader = function (callback) {
            var filepath = path + '/' + filenames.pop();
            logger.debug('reading %s', filepath);
            fs.readFile(filepath, function (err: Error, buf: Buffer) {
                MissionRepository.addPbo(filepath, buf);
                callback();
            });
        };

        async.parallel(filenames.map(function () {
            return fileReader;
        }), callback);
    });
}

function getLocalMissionContents(callback: {(err: Error, results: Array<Buffer>): any}): void {

    function readlocalDir(next) {
        getDirectoryMissions(localDirectories.pop(), next);
    }

    async.waterfall(
        localDirectories.map(function () { return readlocalDir; }),
        callback
    );
}

export function init(callback): void {
    logger.debug('reading missions from local directories...');
    getLocalMissionContents(function (err: Error, results: Array<Buffer>) {
        if (err) {
            logger.error(err);
        }
        logger.info('registered %d local missions in repository.', results.length);
        callback();
    });
}