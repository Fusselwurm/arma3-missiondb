
enum MissionStatus {
    Unknown,
    Registered,
    Fetching,
    Known
}

class Mission {
    url: string;
    urlDigest: string;
    content: string;
    status: MissionStatus = MissionStatus.Unknown;
}

class MissionRepository {
    private missions: Array<Mission>;
    private scheduleMission: Function = function (url) {
        var mission = new Mission();
        mission.url = url;
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
    registerMission(url: string): Mission {
        var
            newMission;

        this.missions.some(function (mission: Mission) {
            if (mission.url === url) {
                newMission = mission;
                return true;
            }
        });

        if (!newMission) {
            newMission = new Mission();
            this.missions.push(newMission);

        }

        return newMission;
    }
}
