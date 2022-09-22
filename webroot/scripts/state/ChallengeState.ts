/** Enum for available game modes */
export enum Challenge {
    MainGame = "MainGame",
    TwinStick = "TwinStick",
    Chaos = "Chaos",
    Pacifism = "Pacifism",
    SpeedKills = "SpeedKills",
    InReverse = "InReverse",
    EngineFailure = "EngineFailure"
}

/** Get display name for a given challenge */
export function getChallengeDisplayName(challenge: Challenge): string {
    switch (challenge) {
        case Challenge.MainGame:
            return "Main Game";
        case Challenge.TwinStick:
            return "Twin-Stick";
        case Challenge.Chaos:
            return "Chaos";
        case Challenge.Pacifism:
            return "Pacifism";
        case Challenge.SpeedKills:
            return "Speed Kills";
        case Challenge.InReverse:
            return "In Reverse";
        case Challenge.EngineFailure:
            return "Engine Failure";
    }
}

let currentChallenge: Challenge = Challenge.MainGame;

/** Set the currently active challenge */
export function setChallenge(challenge: Challenge) {
    currentChallenge = challenge;
}

/** Set the currently active challenge back to the main game */
export function resetChallenge() {
    setChallenge(Challenge.MainGame);
}

/** Get the currently active challenge */
export function getCurrentChallenge(): Challenge {
    return currentChallenge;
}
