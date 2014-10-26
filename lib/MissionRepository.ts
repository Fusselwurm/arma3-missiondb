/// <reference path="../typings/tsd.d.ts" />

import crypto = require('crypto');
import util = require('util');
import bunyan = require('bunyan');
import MissionFetcher = require('./MissionFetcher');

var
    missions: Array<Mission> = [],
    errorUrls: Array<string> = [],
    format = util.format,
    logger = bunyan.createLogger({name: 'missionRepository'}),
    scheduleMission = function (mission: Mission) {
        if (mission.status === MissionStatus.Fetching) {
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
                mission.status = MissionStatus.Known;
            });
        }, 1000);
    };

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
    Registered,
    Fetching,
    Known
}

export class Mission {
    private url: string;
    private urlDigest: string;
    private content: Buffer;
    private contentDigest: string;

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
