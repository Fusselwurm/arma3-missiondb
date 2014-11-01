/// <reference path="../typings/tsd.d.ts" />

import parse = require('arma-class-parser');
import bunyan = require('bunyan');
import Mission = require('./Mission');
import _ = require('underscore');

var logger = bunyan.createLogger({name: 'missionConverter'});

function collectionsToArrays(parsedClass) {
    _.each(parsedClass, function (val, key) {
        if (val && (typeof val === 'object')) {
            parsedClass[key] = collectionsToArrays(val);
        }
    });
    if (typeof parsedClass['items'] === 'number' && (Object.getOwnPropertyNames(parsedClass).length === parsedClass['items'] + 1)) {
        return _.values(parsedClass).filter(function (val) { return val && (typeof val === 'object');});
    }
    return parsedClass;
}

function getParsedFile(missionSqm: string) {
    var
        result: any = {};
    try {
        result = parse(missionSqm);
        logger.debug(result);
        result = collectionsToArrays(result);
        logger.debug(result);
    } catch (e) {
        logger.error(e);
        logger.info(missionSqm);
    }
    return result;
}

export class MissionView {
    version: number;
    groups: Array<Mission.Group>;
    addOns: Array<string>;
    author: string;
    title: string;
    description: string;
    respawn: number;
    respawnDelay: number;
}

export function convert(missionSqm: string, descriptionExt: string): MissionView {
    var
        result = new MissionView(),
        missionSqmParsed = getParsedFile(missionSqm),
        descriptionExtParsed = getParsedFile(descriptionExt);

    result.version = missionSqmParsed.version;
    result.groups = getGroups(missionSqmParsed.Mission);
    result.author = descriptionExtParsed.author;
    result.title = descriptionExtParsed.onLoadMission;
    result.description = descriptionExtParsed.onLoadText;
    result.respawn = descriptionExtParsed.respawn;
    result.respawnDelay = descriptionExtParsed.respawnDelay;
    try {
        result.addOns = missionSqmParsed.Mission.addOns;
    } catch (e) {
        logger.error(e);
    }
    return result;
}

function getGroups(mission): Array<Mission.Group> {
    try {
        return mission.Groups.map(function (group) {
            var result = new Mission.Group();
            result.players = group.Vehicles.map(function (vehicle) {
                return {
                    className: vehicle.vehicle
                };
            });
            result.side = group.side;
            return result;
        });
    } catch (e) {
        logger.error(e);
        return [];
    }
}
