/// <reference path="../typings/tsd.d.ts" />

import crypto = require('crypto');
import util = require('util');
import bunyan = require('bunyan');
import fs = require('fs');
import async = require('async');

import MissionFetcher = require('./MissionFetcher');
import Pbo = require('./Pbo');

var
    missions: Array<Mission> = [],
    errorUrls: Array<string> = [],
    format = util.format,
    logger = bunyan.createLogger({name: 'missionRepository'});

function readPboFiles(mission: Mission, dirname) {

    logger.debug('reading extracted files...');
    async.parallel([
        function (next) {
            fs.readFile(dirname + '/description.ext', function (err, contents) {
                if (err) {
                    logger.error('couldnt read description.ext :( ' + err);
                } else {
                    mission.setFile('description.ext', contents.toString('utf-8'));
                }
                next(err);
            });
        },
        function (next) {
            fs.readFile(dirname + '/mission.sqm', function (err, contents) {
                if (err) {
                    logger.error('couldnt read mission.sqm :( ' + err);
                } else {
                    mission.setFile('mission.sqm', contents.toString('utf-8'));
                }
                next(err);
            });
        },
    ], function (err, results) {
        if (err) {
            logger.error(err);
            removeMission(mission);
            errorUrls.push(mission.getUrl());
        }
        logger.debug('completed mission extration. nice');
        mission.status = MissionStatus.Known;
    });
}

function scheduleMission(mission: Mission) {
    if ([MissionStatus.Fetching, MissionStatus.Extracting].indexOf(mission.status) !== -1) {
        logger.warn('mission statuis already being fetched or extracted, not doing anything');
        return;
    }
    mission.status = MissionStatus.Fetching;
    setTimeout(function () {
        MissionFetcher.fetchHttp(mission.getUrl(), function (err: Error, data: Buffer) {
            var missionUrl = mission.getUrl();
            if (err) {
                removeMission(mission);
                errorUrls.push(missionUrl);
                logger.warn(format('removed mission with invalid URL %s ', missionUrl));
                return;
            }
            logger.info(format('successfully fetched %s', missionUrl));
            mission.setContent(data);
            mission.status = MissionStatus.Extracting;

            logger.debug('calling pbo module...');

            try {
                Pbo.extractPbo(data, function (err, dirname:string) {
                    if (err) {
                        logger.error('arrrgs');
                        logger.error(err);
                        return;
                    }
                    readPboFiles(mission, dirname);
                });
            } catch (e) {
                logger.error(e);
            }
        });
    }, 1000);
}

function removeMission(mission: Mission) {
    var idx = missions.indexOf(mission);
    missions.splice(idx, 1);
}

function getSha1(str) {
    var sha1 = crypto.createHash('sha1');
    sha1.update(str);

    return sha1.digest('hex');
}

export enum MissionStatus {
    Unknown,
    Fetching,
    Extracting,
    Known
}

export class Mission {
    private url: string;
    private urlDigest: string;
    private content: Buffer;
    private contentDigest: string;
    private files: Object = {};

    status: MissionStatus = MissionStatus.Unknown;

    setUrl(url) {
        this.url = url;
        this.urlDigest = getSha1(url);
    }
    getUrl(): string {
        return this.url;
    }
    setContent(content: Buffer) {
        this.content = content;
        this.contentDigest = getSha1(content);
    }
    getContent(): Buffer {
        return this.content;
    }
    getUrlDigest(): string {
        return this.urlDigest;
    }
    getContentDigest(): string {
        return this.contentDigest;
    }
    setFile(filename: string, content: string) {
        this.files[filename] = content;
    }
    getFile(filename: string): string {
        return this.files[filename] || '';
    }
}

export declare class Error {
    public name: string;
    public message: string;
    public stack: string;
    constructor(message?: string);
}

export class ErrorUrlException extends Error {

    constructor(public message: string) {
        super(message);
        this.name = 'Exception';
        this.message = message;
        this.stack = (<any>new Error()).stack;
    }
    toString() {
        return this.name + ': ' + this.message;
    }
}

export function registerMission(url: string): Mission {
    var
        newMission;

    if (errorUrls.indexOf(url) !== -1) {
        throw new ErrorUrlException('url has been marked as erroneous');
    }

    missions.some(function (mission: Mission) {
        if (mission.getUrl() === url) {
            newMission = mission;
            return true;
        }
    });

    if (!newMission) {
        newMission = new Mission();
        newMission.setUrl(url);
        missions.push(newMission);
        logger.info('pushed mission ' + newMission);
        scheduleMission(newMission);
    }

    return newMission;
}

export function getMission(digest: string): Mission {
    var result: Mission;
    logger.debug('getting mission by digest ' + digest + ', theres ' + missions.length + ' missions available');
    missions.some(function (mission: Mission) {
        if ((mission.getUrlDigest() === digest) || mission.getContentDigest() === digest) {
            result = mission;
            return true;
        }
    });

    logger.debug('getMission: got mission ' + result + ' from repo');

    return result;
}
