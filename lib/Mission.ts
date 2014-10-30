
class ArmaClass {
    className: string;
}

export enum Side {
    blufor, opfor, independent
}

export class Group {
    side: Side;
    players: Array<Player>;
}

export class Player extends ArmaClass {
}