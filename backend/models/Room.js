const mongoose = require('mongoose');
require('dotenv').config();

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  teamA: [{
    type: String,  // Codeforces handles
    required: true
  }],
  teamB: [{
    type: String,  // Codeforces handles
    required: true
  }],
  gameStarted: {
    type: Boolean,
    default: false
  },
  board: {
    type: [[Object]],  // 3x3 array of problem objects
    default: null
  },
  settings: {
    type: Object,  // Game settings when the game was started
    default: null
  },
  solvedProblems: {
    type: Map,
    of: {
      team: String,
      solver: String,
      solvedAt: Date
    },
    default: new Map()
  },
  gameState: {
    type: Map,
    of: String,  // 'X' for teamA, 'O' for teamB
    default: new Map()
  },
  winner: {
    type: String,
    enum: ['teamA', 'teamB', 'draw', null],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

roomSchema.index({ createdAt: 1 }, { expireAfterSeconds: parseInt(process.env.ROOM_EXPIRATION_SECONDS) || 9000 });

// Helper method to check if a position is solved
roomSchema.methods.isSolved = function(row, col) {
  return this.solvedProblems.has(`${row},${col}`);
};

// Helper method to get game state at position
roomSchema.methods.getGameState = function(row, col) {
  return this.gameState.get(`${row},${col}`);
};



// Helper method to check for win
roomSchema.methods.checkWin = function() {
  const board = [
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ];

  // Fill the board with current game state
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      board[i][j] = this.gameState.get(`${i},${j}`);
    }
  }

  // Check rows
  for (let i = 0; i < 3; i++) {
    if (board[i][0] && board[i][0] === board[i][1] && board[i][0] === board[i][2]) {
      return board[i][0] === 'X' ? 'teamA' : 'teamB';
    }
  }

  // Check columns
  for (let j = 0; j < 3; j++) {
    if (board[0][j] && board[0][j] === board[1][j] && board[0][j] === board[2][j]) {
      return board[0][j] === 'X' ? 'teamA' : 'teamB';
    }
  }

  // Check diagonals
  if (board[0][0] && board[0][0] === board[1][1] && board[0][0] === board[2][2]) {
    return board[0][0] === 'X' ? 'teamA' : 'teamB';
  }
  if (board[0][2] && board[0][2] === board[1][1] && board[0][2] === board[2][0]) {
    return board[0][2] === 'X' ? 'teamA' : 'teamB';
  }

  // Check for draw (all cells filled)
  let isDraw = true;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (!board[i][j]) {
        isDraw = false;
        break;
      }
    }
    if (!isDraw) break;
  }

  return isDraw ? 'draw' : null;
};

module.exports = mongoose.model('Room', roomSchema); 