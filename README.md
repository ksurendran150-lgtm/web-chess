# Zen Chess: Real-Time Multiplayer & AI ♟️

A fully responsive, browser-based chess application featuring real-time multiplayer synchronization, a built-in Stockfish AI engine, and a custom user interface with a chat overlay. The core of this project is the hidden **Ai mode**,live-analysis overlay designed for training and having fun with friends. By pressing the `~` key during a live multiplayer match, a Web Worker running the Stockfish 10 AI silently spins up in the background, calculates the optimal counter-move to your opponent, and draws a glowing SVG arrow on your screen, allowing you to seamlessly play at a Grandmaster level without breaking the UI.

##  Features

* **Real-Time Multiplayer:** Instant move synchronization and live room states powered by Firebase Realtime Database.
* **Engine Integration:** Play against the computer using the Stockfish 10 AI, integrated seamlessly via Web Workers so it never freezes the UI.
* **Live Match Chat:** A chat overlay that allows players to communicate in real-time within their specific multiplayer room.
* **Ai Mode Assist:** A secret developer toggle (using the `~` key) that activates Stockfish analysis during a live game, drawing SVG arrows on the board to indicate the best possible engine move.
* **Responsive Design:** Custom CSS Grid architecture ensures the board scales perfectly across desktop, tablet, and mobile displays without requiring pinch-to-zoom.
* **Legal Move Validation:** Full chess rule enforcement (including castling, en passant, promotion, and check/checkmate detection) powered by `chess.js`.

##  Tech Stack

* **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+)
* **Backend / Database:** Firebase Realtime Database
* **Libraries:** 
  * `chess.js` (Move validation and board state)
  * `stockfish.js` (Browser-based AI opponent)
* **Deployment:** Netlify / GitHub Pages

##  How to Run Locally

1. Clone the repository:
```bash
   git clone [https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git](https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git)