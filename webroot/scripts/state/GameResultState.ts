import { config } from "../model/Config";
import { GameResult } from "../model/GameResult";

const resultsKey = "gameResults";
const lifetimeStatsKey = "lifetimeStats";
let latestGameResultIndex = -1;

/** Save a player's score on the list of high scores */
export function saveGameResult(gameResult: GameResult): GameResult[] {
    let currentResults = getGameResults();
    for (let i = 0; i <= currentResults.length && i < config()["maxGamesStored"]; i++) {
        if (i == currentResults.length) {
            currentResults.push(gameResult);
            latestGameResultIndex = i;
            break;
        } else if (gameResult.score >= currentResults[i].score) {
            currentResults.splice(i, 0, gameResult);
            latestGameResultIndex = i;
            break;
        }
    }
    let lifetimeStats = getLifetimeStats();
    lifetimeStats.score += gameResult.score;
    lifetimeStats.gemsCollected += gameResult.gemsCollected;
    lifetimeStats.enemiesKilled += gameResult.enemiesKilled;
    lifetimeStats.shotsFired += gameResult.shotsFired;
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
