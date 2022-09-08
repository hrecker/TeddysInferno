import { config } from "../model/Config";
import { GameResult } from "../model/GameResult";

const resultsKey = "gameResults";
const lifetimeStatsKey = "lifetimeStats";
let latestGameResultIndex = -1;
let latestGameResult: GameResult;

/** Save a player's score on the list of high scores */
export function saveGameResult(gameResult: GameResult): GameResult[] {
    let currentResults = getGameResults();
    latestGameResult = gameResult;
    latestGameResultIndex = -1;
    for (let i = 0; i <= currentResults.length && i < config()["maxGamesStored"]; i++) {
        if (i == currentResults.length) {
            currentResults.push(latestGameResult);
            latestGameResultIndex = i;
            break;
        } else if (latestGameResult.score >= currentResults[i].score) {
            currentResults.splice(i, 0, latestGameResult);
            latestGameResultIndex = i;
            break;
        }
    }

    // Truncate array to max length
    if (currentResults.length > config()["maxGamesStored"]) {
        currentResults = currentResults.slice(0, config()["maxGamesStored"]);
    }

    let lifetimeStats = getLifetimeStats();
    lifetimeStats.score += latestGameResult.score;
    lifetimeStats.gemsCollected += latestGameResult.gemsCollected;
    lifetimeStats.enemiesKilled += latestGameResult.enemiesKilled;
    lifetimeStats.shotsFired += latestGameResult.shotsFired;
    lifetimeStats.deaths += latestGameResult.deaths;
    localStorage.setItem(resultsKey, JSON.stringify(currentResults));
    localStorage.setItem(lifetimeStatsKey, JSON.stringify(lifetimeStats));
    return currentResults;
}

/** Get the current high score list for the player */
export function getGameResults(): GameResult[] {
    let results = localStorage.getItem(resultsKey)
    if (! results) {
        return [];
    }
    let parsed = JSON.parse(results);
    let gameResults: GameResult[] = [];
    parsed.forEach(gameResult => {
        gameResults.push(parseGameResult(gameResult));
    });
    return gameResults;
}

/** Parse a game result from an object, setting default values for anything undefined */
function parseGameResult(json: any): GameResult {
    return {
        score: "score" in json ? json.score : 0,
        gemsCollected: "gemsCollected" in json ? json.gemsCollected : 0,
        enemiesKilled: "enemiesKilled" in json ? json.enemiesKilled : 0,
        shotsFired: "shotsFired" in json ? json.shotsFired : 0,
        deaths: "deaths" in json ? json.deaths : 0
    };
}

/** Get lifetime stats for the player */
export function getLifetimeStats(): GameResult {
    let results = localStorage.getItem(lifetimeStatsKey)
    if (! results) {
        return parseGameResult({});
    }
    return parseGameResult(JSON.parse(results));
}

/** Get the index of the latest game result in the stored array */
export function getLatestGameResultIndex() {
    return latestGameResultIndex;
}

/** Get the latest game result */
export function getLatestGameResult() {
    return latestGameResult;
}
