/// <reference path="../typings/tsd.d.ts" />

import parse = require('./../vendor/arma-class-to-json.js');
import bunyan = require('bunyan');
import Mission = require('./Mission');

var logger = bunyan.createLogger({name: 'missionConverter'});

function getMissionSqm(missionSqm: string): Object {
    var
        result = {},
        parsed;
    try {
        result = parse(missionSqm);
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

    return result;
}

function getGroups(mission: Object): Array<Mission.Groups> {
    try {
        return mission.Mission.Groups.map(function () {
            return new Mission.Group();
        });
    } catch (e) {
        return [];
    }
}