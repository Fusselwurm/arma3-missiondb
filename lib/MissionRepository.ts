var missions: Array<Mission> = [],
    scheduleMission = function (mission: Mission) {
        ///mission.urlDigest;
        /*
         missions[digest] = {
         url: url,
         lastUpdate: null
         };
         missionFetcher.fetchHttp(url, function (err, data) {
         if (err) {
         delete missions[digest];
         if (err.code === 'ENOTFOUND') {
         errorUrls[digest] = 404;
         }
         errorUrls[digest] = 500;
         }
         console.log('successfully fetched ' + url);
         missions[digest].content = data;
         missions[digest].lastUpdate = new Date();
         });
         */
    };

export enum MissionStatus {
    Unknown,
    Registered,
    Fetching,
    Known
}

export class Mission {
    url: string;
    urlDigest: string;
    content: string;
    contentDigest: string;
    status: MissionStatus = MissionStatus.Unknown;
}

export function registerMission(url: string): Mission {
    var
        newMission;

    missions.some(function (mission: Mission) {
        if (mission.url === url) {
            newMission = mission;
            return true;
        }
    });

    if (!newMission) {
        newMission = new Mission();
        missions.push(newMission);
        scheduleMission(newMission);
    }


    return newMission;
}
