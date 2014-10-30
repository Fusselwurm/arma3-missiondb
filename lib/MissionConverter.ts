/// <reference path="../typings/tsd.d.ts" />

import parse = require('./../vendor/arma-class-to-json.js');
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

function getMissionSqm(missionSqm: string) {
    var
        result = {};
    try {
        logger.info(parse);
        result = parse(missionSqm);
        logger.info(result);
        result = collectionsToArrays(result);
        logger.info(result);
    } catch (e) {
        logger.error(e);
    }
    return result;
}

export class MissionView {
    version: number;
    groups: Array<Mission.Group>;
}

export function convert(missionSqm: string, descriptionExt: string): MissionView {
    var
        result = new MissionView(),
        missionSqmParsed = getMissionSqm(missionSqm);

    result.groups = getGroups(missionSqmParsed.Mission);
    result.addOns = missionSqmParsed.Mission.addOns;
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