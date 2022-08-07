import { config } from "../model/Config";
import { GameResult } from "../model/GameResult";

const resultsKey = "gameResults";

/** Save a player's score on the list of high scores */
export function saveGameResult(gameResult: GameResult): GameResult[] {
    let currentResults = getGameResults();
    for (let i = 0; i <= currentResults.length && i < config()["maxGamesStored"]; i++) {
        if (i == currentResults.length) {
            currentResults.push(gameResult);
            break;
        } else if (gameResult.score >= currentResults[i].score) {
            currentResults.splice(i, 0, gameResult);
            break;
        }
    }
    //TODO saving all-time stats (time survived, deaths, all time gems collected, shots fired, enemies killed)
    localStorage.setItem(resultsKey, JSON.stringify(currentResults));
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
