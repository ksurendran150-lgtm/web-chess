// ==========================================
// 1. FIREBASE SETUP
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDPbddhrxcORj0ZOnSGGgsti8T5a81BvxA",
    authDomain: "global-chess-8e600.firebaseapp.com",
    databaseURL: "https://global-chess-8e600-default-rtdb.firebaseio.com",
    projectId: "global-chess-8e600",
    storageBucket: "global-chess-8e600.firebasestorage.app",
    messagingSenderId: "700033618703",
    appId: "1:700033618703:web:86546e1e08b08ffd19e47a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==========================================
// 2. GAME VARIABLES
// ==========================================
const game = new Chess();
const boardElement = document.getElementById('chessboard');
let selectedSquare = null;
let lastMoveSquares = [];
let roomId = null;
let playerColor = 'w'; 
let gameMode = 'ai'; 
let godMode = false; 

const pieceImages = {
    'p': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
    'r': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    'n': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    'b': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    'q': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    'k': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
    'P': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    'R': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    'N': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    'B': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    'Q': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    'K': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg'
};

const initialPieces = {
    w: { p: 8, r: 2, n: 2, b: 2, q: 1 },
    b: { p: 8, r: 2, n: 2, b: 2, q: 1 }
};

// ==========================================
// 3. STOCKFISH AI ENGINE
// ==========================================
const workerScript = `importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');`;
const workerBlob = new Blob([workerScript], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(workerBlob);
const stockfishWorker = new Worker(workerUrl);
stockfishWorker.postMessage('uci');

stockfishWorker.onmessage = function(event) {
    const line = event.data;
    if (line.startsWith('bestmove')) {
        const parts = line.split(' ');
        const bestMove = parts[1];
        
        if (bestMove && bestMove !== '(none)') {
            document.getElementById('engine-best-move').innerText = `Best Move: ${bestMove}`;
            
            if (gameMode === 'ai' && game.turn() === 'b') {
                setTimeout(() => {
                    executeMove(bestMove.substring(0, 2), bestMove.substring(2, 4), bestMove.length > 4 ? bestMove[4] : 'q');
                }, 500);
            } else if (godMode && game.turn() === playerColor) {
                drawArrow(bestMove.substring(0, 2), bestMove.substring(2, 4));
            }
        }
    }
};

function executeMove(fromSq, toSq, promo = 'q') {
    const move = game.move({ from: fromSq, to: toSq, promotion: promo });
    if (move) {
        lastMoveSquares = [fromSq, toSq];
        renderBoard();
        hideArrow();
        
        if (gameMode === 'multiplayer') {
            db.ref(`rooms/${roomId}`).set({ fen: game.fen(), lastMove: [fromSq, toSq] });
        } else if (gameMode === 'ai' && game.turn() === 'b') {
            triggerStockfishAnalysis();
        }
    }
}

function drawArrow(fromSq, toSq) {
    const files = {a:0, b:1, c:2, d:3, e:4, f:5, g:6, h:7};
    const ranks = {'8':0, '7':1, '6':2, '5':3, '4':4, '3':5, '2':6, '1':7};
    
    let f1 = files[fromSq[0]]; let r1 = ranks[fromSq[1]];
    let f2 = files[toSq[0]]; let r2 = ranks[toSq[1]];
    
    if (playerColor === 'b') {
        f1 = 7 - f1; r1 = 7 - r1;
        f2 = 7 - f2; r2 = 7 - r2;
    }
    
    const x1 = f1 * 80 + 40; const y1 = r1 * 80 + 40;
    const x2 = f2 * 80 + 40; const y2 = r2 * 80 + 40;
    
    const arrow = document.getElementById('best-move-arrow');
    arrow.setAttribute('x1', x1); arrow.setAttribute('y1', y1);
    arrow.setAttribute('x2', x2); arrow.setAttribute('y2', y2);
    arrow.style.display = 'block';
}

function hideArrow() {
    document.getElementById('best-move-arrow').style.display = 'none';
}

function triggerStockfishAnalysis() {
    if (gameMode === 'ai' && game.turn() === 'b') {
        stockfishWorker.postMessage(`position fen ${game.fen()}`);
        stockfishWorker.postMessage('go depth 10');
    } else if (godMode && game.turn() === playerColor) {
        stockfishWorker.postMessage(`position fen ${game.fen()}`);
        stockfishWorker.postMessage('go depth 10');
    }
}

// ==========================================
// 4. GUI & RENDERING
// ==========================================
function renderBoard() {
    boardElement.innerHTML = '';
    const boardState = game.board();
    const currentPieces = { w: { p:0, r:0, n:0, b:0, q:0 }, b: { p:0, r:0, n:0, b:0, q:0 } };

    const rowOrder = playerColor === 'b' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const colOrder = playerColor === 'b' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

    const isCheck = game.in_check();
    const turnColor = game.turn();

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const r = rowOrder[i]; const c = colOrder[j];
            const squareDiv = document.createElement('div');
            const squareName = String.fromCharCode(97 + c) + (8 - r);
            const isDark = (r + c) % 2 !== 0;
            
            squareDiv.className = `square ${isDark ? 'dark' : 'light'}`;
            squareDiv.dataset.square = squareName;

            if (lastMoveSquares.includes(squareName)) {
                squareDiv.classList.add('highlight-last-move');
            }

            const piece = boardState[r][c];
            if (piece) {
                currentPieces[piece.color][piece.type]++;
                const img = document.createElement('img');
                img.src = pieceImages[piece.color === 'w' ? piece.type.toUpperCase() : piece.type];
                img.className = 'chess-piece';
                
                if (isCheck && piece.type === 'k' && piece.color === turnColor) {
                    squareDiv.classList.add('in-check');
                }

                squareDiv.appendChild(img);
            }

            squareDiv.addEventListener('click', () => handleSquareClick(squareName));
            boardElement.appendChild(squareDiv);
        }
    }
    updateCapturedPieces(currentPieces);
}
function updateCapturedPieces(current) {
    let capturedWhiteHTML = ''; let capturedBlackHTML = '';
    ['p', 'n', 'b', 'r', 'q'].forEach(type => {
        let missingBlack = initialPieces.b[type] - current.b[type];
        for(let i=0; i<missingBlack; i++) capturedWhiteHTML += `<img src="${pieceImages[type]}">`;
        let missingWhite = initialPieces.w[type] - current.w[type];
        for(let i=0; i<missingWhite; i++) capturedBlackHTML += `<img src="${pieceImages[type.toUpperCase()]}">`;
    });

    if (playerColor === 'w') {
        document.getElementById('top-captured').innerHTML = capturedBlackHTML;
        document.getElementById('bottom-captured').innerHTML = capturedWhiteHTML;
    } else {
        document.getElementById('top-captured').innerHTML = capturedWhiteHTML;
        document.getElementById('bottom-captured').innerHTML = capturedBlackHTML;
    }
}

function handleSquareClick(squareName) {
    if (gameMode === 'multiplayer' && game.turn() !== playerColor) return;
    if (gameMode === 'ai' && game.turn() === 'b') return;

    clearLegalHighlights();

    if (selectedSquare) {
        const fromSq = selectedSquare;
        selectedSquare = null;
        const isLegal = game.moves({ square: fromSq, verbose: true }).some(m => m.to === squareName);
        if (isLegal) {
            executeMove(fromSq, squareName, 'q');
            return;
        }
    }

    const piece = game.get(squareName);
    const validTurn = gameMode === 'ai' ? (piece && piece.color === 'w') : (piece && piece.color === playerColor);
    
    if (validTurn) {
        selectedSquare = squareName;
        const moves = game.moves({ square: squareName, verbose: true });
        moves.forEach(m => {
            const targetDiv = document.querySelector(`[data-square="${m.to}"]`);
            if (targetDiv) targetDiv.classList.add('highlight-legal-move');
        });
    }
}

function clearLegalHighlights() {
    document.querySelectorAll('.highlight-legal-move').forEach(el => el.classList.remove('highlight-legal-move'));
}

// ==========================================
// 5. MENUS, MULTIPLAYER & CHAT LOGIC
// ==========================================
document.getElementById('btn-vs-ai').addEventListener('click', () => {
    gameMode = 'ai';
    playerColor = 'w';
    document.getElementById('room-info-row').style.display = 'none';
    setupActiveGameWindow();
});

document.getElementById('btn-create-room').addEventListener('click', () => {
    const input = document.getElementById('input-room-id').value.trim();
    if (!input) {
        document.getElementById('menu-status').innerText = "Please type a room name!";
        return;
    }
    
    gameMode = 'multiplayer';
    roomId = input;
    playerColor = 'w';
    document.getElementById('room-info-row').style.display = 'block';
    
    db.ref(`rooms/${roomId}`).set({ fen: game.fen(), lastMove: [] });
    setupActiveGameWindow();
});

document.getElementById('btn-join-room').addEventListener('click', () => {
    const input = document.getElementById('input-room-id').value.trim();
    if (!input) {
        document.getElementById('menu-status').innerText = "Please type a room name!";
        return;
    }
    
    db.ref(`rooms/${input}`).once('value', snapshot => {
        if (snapshot.exists()) {
            gameMode = 'multiplayer';
            roomId = input;
            playerColor = 'b';
            document.getElementById('room-info-row').style.display = 'block';
            setupActiveGameWindow();
        } else {
            document.getElementById('menu-status').innerText = "Room not found!";
        }
    });
});

function setupActiveGameWindow() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    document.body.classList.remove('menu-state');
    
    document.getElementById('game-mode-display').innerText = gameMode === 'ai' ? 'VS Computer' : 'Multiplayer Arena';
    document.getElementById('player-color-display').innerText = playerColor === 'w' ? 'White Side' : 'Black Side';
    document.getElementById('current-room-display').innerText = roomId || 'N/A';
    
    if (gameMode === 'multiplayer') {
        document.getElementById('chat-container').style.display = 'flex';
        
        // Listen for board updates
        db.ref(`rooms/${roomId}`).on('value', snapshot => {
            const data = snapshot.val();
            if (data && data.fen !== game.fen()) {
                game.load(data.fen);
                lastMoveSquares = data.lastMove || [];
                hideArrow();
                renderBoard();
                if (game.turn() === playerColor && godMode) triggerStockfishAnalysis();
            }
        });

        // Listen for chat messages
        db.ref(`rooms/${roomId}/chat`).on('child_added', snapshot => {
            const msgData = snapshot.val();
            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-msg';
            msgDiv.innerHTML = `[${msgData.sender}]: <span>${msgData.text}</span>`;
            
            const chatBox = document.getElementById('chat-messages');
            chatBox.appendChild(msgDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
        });

    } else {
        document.getElementById('chat-container').style.display = 'none';
    }

    renderBoard();
    if (playerColor === 'w' && godMode) triggerStockfishAnalysis();
}

// Chat Input Setup
document.getElementById('btn-send-chat').addEventListener('click', sendChatMessage);
document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    
    if (text !== '' && gameMode === 'multiplayer') {
        db.ref(`rooms/${roomId}/chat`).push({
            sender: playerColor === 'w' ? 'White' : 'Black',
            text: text
        });
        input.value = ''; 
    }
}

// God Mode Toggle
document.addEventListener('keydown', (e) => {
    if (e.key === '`') {
        godMode = !godMode; 
        document.getElementById('stockfish-panel').classList.toggle('hidden');
        if (godMode && game.turn() === playerColor) {
            triggerStockfishAnalysis();
        } else if (!godMode) {
            hideArrow(); 
        }
    }
});