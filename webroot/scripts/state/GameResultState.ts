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
    return JSON.parse(results);
}

/** Get lifetime stats for the player */
export function getLifetimeStats(): GameResult {
    let results = localStorage.getItem(lifetimeStatsKey)
    if (! results) {
        return {
            score: 0,
            gemsCollected: 0,
            enemiesKilled: 0,
            shotsFired: 0
        };
    }
    return JSON.parse(results);
}

/** Get the index of the latest game result in the stored array */
export function getLatestGameResultIndex() {
    return latestGameResultIndex;
}

/** Get the latest game result */
export function getLatestGameResult() {
    return latestGameResult;
}
