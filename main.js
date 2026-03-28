const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

const scoreElement = document.getElementById('score');
const startButton = document.getElementById('start');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

context.scale(BLOCK_SIZE, BLOCK_SIZE);
nextContext.scale(BLOCK_SIZE, BLOCK_SIZE);

let board = createMatrix(COLS, ROWS);
let score = 0;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let animationFrameId;

const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    color: null,
};

let nextPlayer = {
    matrix: null,
    color: null,
};

const COLORS = [
    null,
    '#ef476f', // T
    '#ffd166', // O
    '#06d6a0', // L
    '#118ab2', // J
    '#073b4c', // I
    '#f78c6b', // S
    '#f94144', // Z
];

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'T') return [[1, 1, 1], [0, 1, 0], [0, 0, 0]];
    if (type === 'O') return [[2, 2], [2, 2]];
    if (type === 'L') return [[0, 3, 0], [0, 3, 0], [0, 3, 3]];
    if (type === 'J') return [[0, 4, 0], [0, 4, 0], [4, 4, 0]];
    if (type === 'I') return [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]];
    if (type === 'S') return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
    if (type === 'Z') return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
}

function draw() {
    context.fillStyle = '#0c1324';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(board, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos, true);
}

function drawMatrix(matrix, offset, isPlayer = false) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = COLORS[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                if (isPlayer) {
                    context.strokeStyle = 'rgba(255,255,255,0.3)';
                    context.lineWidth = 0.1;
                    context.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
            }
        });
    });
}

function drawNext() {
    nextContext.fillStyle = '#0c1324';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    const matrix = nextPlayer.matrix;
    const color = nextPlayer.color;
    const offset = { x: (nextCanvas.width / BLOCK_SIZE - matrix[0].length) / 2, y: (nextCanvas.height / BLOCK_SIZE - matrix.length) / 2 };

    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                nextContext.fillStyle = color;
                nextContext.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}


function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function collide(board, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function playerDrop() {
    player.pos.y++;
    if (collide(board, player)) {
        player.pos.y--;
        merge(board, player);
        clearLines();
        playerReset();
    }
    dropCounter = 0;
}

function playerHardDrop() {
    while (!collide(board, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    merge(board, player);
    clearLines();
    playerReset();
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(board, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'TOLJISZ';
    const nextPieceType = pieces[Math.floor(Math.random() * pieces.length)];

    if (nextPlayer.matrix === null) {
        // First time setup
        player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
        player.color = COLORS[player.matrix.flat().find(v => v !== 0)];
    } else {
        player.matrix = nextPlayer.matrix;
        player.color = nextPlayer.color;
    }

    nextPlayer.matrix = createPiece(nextPieceType);
    nextPlayer.color = COLORS[nextPlayer.matrix.flat().find(v => v !== 0)];

    player.pos.y = 0;
    player.pos.x = (COLS / 2 | 0) - (player.matrix[0].length / 2 | 0);

    if (collide(board, player)) {
        // Game Over
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        alert('Game Over! Final Score: ' + score);
        board.forEach(row => row.fill(0));
        score = 0;
    }
    updateScore();
    drawNext();
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(board, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function clearLines() {
    let linesCleared = 0;
    outer: for (let y = board.length - 1; y > -1; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;
        linesCleared++;
    }
    if (linesCleared > 0) {
        score += linesCleared * 10 * linesCleared;
    }
}

function updateScore() {
    scoreElement.innerText = score;
}

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    animationFrameId = requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
    if (!animationFrameId) return;

    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', ' ', 'ArrowUp', 'q', 'w'].includes(event.key)) {
        event.preventDefault();
    }

    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === ' ') {
        playerHardDrop();
    } else if (event.key === 'q' || event.key === 'w' || event.key === 'ArrowUp') {
        playerRotate(event.key === 'w' || event.key === 'ArrowUp' ? 1 : -1);
    }
});

startButton.addEventListener('click', () => {
    startButton.blur();
    if (!animationFrameId) {
        board.forEach(row => row.fill(0));
        score = 0;
        playerReset();
        update();
        startButton.textContent = 'Restart Game';
    } else {
        if (confirm('Are you sure you want to restart?')) {
             board.forEach(row => row.fill(0));
             score = 0;
             playerReset();
        }
    }
});

// Initial draw
updateScore();
playerReset();
draw();
drawNext();
