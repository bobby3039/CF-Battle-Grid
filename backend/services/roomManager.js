const { createGameBoard } = require('./gameLogic');
const Room = require('../models/Room');
const crypto = require('crypto');

async function createRoom() {
  try {
    // Generate a 6-character room ID
    const roomId = crypto.randomBytes(3).toString('hex');
    
    // Create new room document
    const room = new Room({
      roomId,
      teamA: [],
      teamB: [],
      board: null,
      gameStarted: false
    });
    
    // Save to database
    await room.save();
    
    console.log('Created room:', roomId);
  return roomId;
  } catch (error) {
    console.error('Error creating room:', error);
    throw new Error('Failed to create room');
  }
}

async function joinRoom(roomId, handle, team) {
  try {
    const room = await Room.findOne({ roomId: roomId.toString() });
    if (!room || room.gameStarted) return false;

    // Remove player from any existing team first
    room.teamA = room.teamA.filter(p => p !== handle);
    room.teamB = room.teamB.filter(p => p !== handle);

    // Add to new team
    if (team === 'A') {
      if (room.teamA.length >= 2) return false;
      room.teamA.push(handle);
    } else {
      if (room.teamB.length >= 2) return false;
      room.teamB.push(handle);
    }

    await room.save();
  return true;
  } catch (error) {
    console.error('Error joining room:', error);
    return false;
  }
}

async function startGame(roomId, settings) {
  try {
    const room = await Room.findOne({ roomId: roomId.toString() });
  if (!room) throw new Error('Room not found');
    if (room.gameStarted) throw new Error('Game already started');
    if (room.teamA.length === 0 || room.teamB.length === 0) {
      throw new Error('Both teams must have at least one player');
    }

    const board = await createGameBoard(room.teamA, room.teamB, settings);
  room.board = board;
    room.gameStarted = true;
    room.settings = settings;
    await room.save();
  return board;
  } catch (error) {
    console.error('Error starting game:', error);
    throw error;
  }
}

async function getRoom(roomId) {
  try {
    return await Room.findOne({ roomId: roomId.toString() });
  } catch (error) {
    console.error('Error getting room:', error);
    return null;
  }
}

async function isPlayerInRoom(roomId, handle) {
  try {
    const room = await Room.findOne({ roomId: roomId.toString() });
    if (!room) return false;
    return room.teamA.includes(handle) || room.teamB.includes(handle);
  } catch (error) {
    console.error('Error checking player in room:', error);
    return false;
  }
}

async function getPlayerTeam(roomId, handle) {
  try {
    const room = await Room.findOne({ roomId: roomId.toString() });
    if (!room) return null;
    if (room.teamA.includes(handle)) return 'A';
    if (room.teamB.includes(handle)) return 'B';
    return null;
  } catch (error) {
    console.error('Error getting player team:', error);
    return null;
  }
}

// const cleanupExpiredRooms = async () => {
//   try {
//     const result = await Room.deleteMany({
//       createdAt: { $lt: new Date(Date.now() - 9000 * 1000) }
//     });
//     if (result.deletedCount > 0) {
//       console.log(`Deleted ${result.deletedCount} expired rooms`);
//     }
//   } catch (error) {
//     console.error('Room cleanup failed:', error);
//   }
// };

// // Run cleanup every hour
// setInterval(cleanupExpiredRooms, 60 * 60 * 1000);

// // Run cleanup once when the server starts
// cleanupExpiredRooms();

module.exports = { 
  createRoom, 
  joinRoom, 
  startGame, 
  getRoom,
  isPlayerInRoom,
  getPlayerTeam,
  //cleanupExpiredRooms
};
