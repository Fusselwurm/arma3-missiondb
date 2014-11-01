/// <reference path="../typings/tsd.d.ts" />

import crypto = require('crypto');
import util = require('util');
import bunyan = require('bunyan');
import fs = require('fs');
import async = require('async');
import _ = require('underscore');
import MissionConverter = require('./MissionConverter');

import MissionFetcher = require('./MissionFetcher');
import Pbo = require('./Pbo');

var
    missions: Array<Mission> = [],
    errorUrls: Array<string> = [],
    format = util.format,
    logger = bunyan.createLogger({name: 'missionRepository'});

logger.level(bunyan.DEBUG);

function readPboFiles(mission: Mission, dirname) {

    logger.debug('reading extracted files...');
    async.parallel([
        function (callback: AsyncSingleResultCallback<Buffer>) {
            fs.readFile(dirname + '/description.ext', function (err, contents) {
                if (err) {
                    logger.error('couldnt read description.ext :( ' + err);
                } else {
                    mission.setFile('description.ext', contents.toString('utf-8'));
                }
                callback(null, contents);
            });
        },
        function (callback: AsyncSingleResultCallback<Buffer>) {
            fs.readFile(dirname + '/mission.sqm', function (err, contents) {
                if (err) {
                    logger.error('couldnt read mission.sqm :( ' + err);
                } else {
                    mission.setFile('mission.sqm', contents.toString('utf-8'));
                }
                callback(null, contents);
            });
        },
    ], function (err, results: Array<Buffer>) {
        if (results.filter(function (n: Buffer): boolean { return !!n; }).length === 0) {
            logger.error('no data extracted. removing mission url: %s, content: %s', mission.getUrlDigest(), mission.getContentDigest());
            removeMission(mission);
            errorUrls.push(mission.getUrl());
        }

        logger.info('completed mission file extraction. getting meta data...');
        mission.setMeta(MissionConverter.convert(mission.getFile('mission.sqm'), mission.getFile('description.ext')));
        logger.info('completed mission meta data extraction. nice :)');
        mission.status = MissionStatus.Known;
    });
}

function extractMission(mission: Mission) {
    mission.status = MissionStatus.Extracting;

    logger.debug('calling pbo module...');

    try {
        Pbo.extractPbo(mission.getContent(), function (err, dirname:string) {
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
            extractMission(mission);
        });
    }, 1000);
}

export function addPbo(url, pbo: Buffer) {
    var mission = new Mission();
    mission.setContent(pbo);
    mission.setUrl(url);
    missions.push(mission);
    extractMission(mission);
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
    private meta;

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
    setMeta(meta) {
        this.meta = meta;
    }
    getMeta() {
        return this.meta
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

export function getMissions(): Array<Mission> {
    return _.compact(missions);
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
