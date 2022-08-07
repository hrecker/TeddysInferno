const scoresKey = "highscores"

/** Save a player's score on the list of high scores */
export function saveHighScore(timer: number): number[] {
    let score = Math.floor(timer) / 1000.0
    let currentScores = getHighScores();
    for (let i = 0; i <= currentScores.length; i++) {
        if (i == currentScores.length) {
            currentScores.push(score);
            break;
        } else if (score >= currentScores[i]) {
            currentScores.splice(i, 0, score);
            break;
        }
    }
    //TODO limit the number of scores that can be saved?
    //TODO saving other stats (gems collected, shots fired, enemies killed, cause of death)
    //TODO saving all-time stats (time survived, deaths, all time gems collected, shots fired, enemies killed)
    localStorage.setItem(scoresKey, JSON.stringify(currentScores));
    return currentScores;
}

/** Get the current high score list for the player */
export function getHighScores(): number[] {
    let scores = localStorage.getItem(scoresKey)
    if (! scores) {
        return [];
    }
    return JSON.parse(scores);
}
