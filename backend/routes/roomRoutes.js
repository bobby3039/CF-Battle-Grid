const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, startGame, getRoom } = require('../services/roomManager');
const { checkSolvedProblems } = require('../services/codeforcesService');
const Room = require('../models/Room');

router.post('/create', async (req, res) => {
  try {
    const roomId = await createRoom();
    console.log('Created room with ID:', roomId);
    
    if (!roomId || typeof roomId !== 'string') {
      console.error('Invalid room ID generated:', roomId);
      return res.status(500).json({ error: 'Failed to create room' });
    }

    // Get the room to include createdAt in response
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(500).json({ error: 'Room not found after creation' });
    }
    
    res.json({ 
      roomId,
      createdAt: room.createdAt 
    });
  } catch (error) {
    console.error('Error in room creation:', error);
    res.status(500).json({ error: error.message || 'Failed to create room' });
  }
});

router.post('/update/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { handle } = req.body;

    if (!roomId || !handle) {
      return res.status(400).json({ error: 'Room ID and handle are required' });
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.gameStarted) {
      return res.status(400).json({ error: 'Game has not started yet' });
    }

    // Check if player is in the room
    const team = room.teamA.includes(handle) ? 'teamA' : room.teamB.includes(handle) ? 'teamB' : null;
    if (!team) {
      return res.status(403).json({ error: 'Player not in this game' });
    }

    // Check for newly solved problems
    const newlySolved = await checkSolvedProblems(handle, room.board);
    let updated = false;

    for (const solve of newlySolved) {
      const key = `${solve.row},${solve.col}`;
      // Only count if not already solved
      if (!room.solvedProblems.has(key)) {
        room.solvedProblems.set(key, {
          team,
          solver: handle,
          solvedAt: new Date()
        });
        room.gameState.set(key, team === 'teamA' ? 'X' : 'O');
        updated = true;
      }
    }

    if (updated) {
      // Check for win/draw
      const gameResult = room.checkWin();
      if (gameResult) {
        room.winner = gameResult;
      }
      await room.save();
    }

    res.json({
      updated,
      solvedProblems: Object.fromEntries(room.solvedProblems),
      gameState: Object.fromEntries(room.gameState),
      winner: room.winner
    });

  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: error.message || 'Failed to update room' });
  }
});

router.post('/join', async (req, res) => {
  try {
    const { roomId, username, team } = req.body;
    if (!roomId || !username || !team) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const success = await joinRoom(roomId, username, team);
    if (success) {
      res.json({ message: 'Joined successfully' });
    } else {
      res.status(400).json({ error: 'Failed to join room' });
    }
  } catch (error) {
    console.error('Error in room join:', error);
    res.status(500).json({ error: error.message || 'Failed to join room' });
  }
});

router.post('/start/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const settings = req.body;

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    console.log('Starting game for room:', roomId, 'with settings:', settings);

    // Get current room state
    const currentRoom = await getRoom(roomId);
    if (!currentRoom) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (currentRoom.gameStarted) {
      return res.status(400).json({ error: 'Game already started' });
    }

    // Start the game and get the board
    const board = await startGame(roomId, settings);
    if (!board) {
      throw new Error('Failed to generate game board');
    }

    // Update room with game started status and board
    currentRoom.gameStarted = true;
    currentRoom.board = board;
    currentRoom.settings = settings;
    currentRoom.gameStartTime = new Date();
    await currentRoom.save();

    console.log('Game started successfully for room:', roomId);
    
    // Send the complete room state back
    res.json({ 
      board,
      gameStarted: true,
      roomId,
      settings,
      teamA: currentRoom.teamA,
      teamB: currentRoom.teamB,
      gameStartTime: currentRoom.gameStartTime
    });

  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: error.message || 'Failed to start game' });
  }
});

module.exports = router;
