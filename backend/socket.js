const { getRoom, joinRoom, isPlayerInRoom, getPlayerTeam } = require('./services/roomManager');
require('dotenv').config();

function setupSocket(io) {
  // Configure socket.io settings
  io.engine.pingTimeout = parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000;
  io.engine.pingInterval = parseInt(process.env.SOCKET_PING_INTERVAL) || 25000;

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    let currentRoom = null;

    socket.on('joinRoom', async ({ roomId }, callback) => {
      try {
        console.log(`Client ${socket.id} attempting to join room ${roomId}`);
        
        // Leave previous room if any
        if (currentRoom) {
          socket.leave(currentRoom);
        }
        
        socket.join(roomId);
        currentRoom = roomId;
        
        const room = await getRoom(roomId);
        console.log(`Room data for ${roomId}:`, room);
        
        if (room) {
          io.to(roomId).emit('roomUpdate', room);
          console.log(`Sent room update for ${roomId}`);
          if (callback) callback({ success: true, room });
        } else {
          console.log(`Room ${roomId} not found`);
          socket.emit('roomUpdate', null);
          if (callback) callback({ success: false, error: 'Room not found' });
        }
      } catch (error) {
        console.error(`Error in joinRoom for ${roomId}:`, error);
        socket.emit('error', { message: 'Failed to join room' });
        if (callback) callback({ success: false, error: 'Failed to join room' });
      }
    });

    socket.on('joinTeam', async ({ roomId, handle, team }) => {
      console.log(`Player ${handle} attempting to join team ${team} in room ${roomId}`);
      
      try {
        const success = await joinRoom(roomId, handle, team);
        if (success) {
          const updatedRoom = await getRoom(roomId);
          io.to(roomId).emit('roomUpdate', updatedRoom);
          console.log(`Player ${handle} joined team ${team} in room ${roomId}`);
        } else {
          console.log(`Failed to join team for player ${handle}`);
          socket.emit('error', { message: 'Failed to join team' });
        }
      } catch (error) {
        console.error(`Error in joinTeam for ${handle}:`, error);
        socket.emit('error', { message: 'Failed to join team' });
      }
    });

    socket.on('gameStarted', async ({ roomId, board, settings, teamA, teamB }, callback) => {
      console.log(`Game starting in room ${roomId} with board:`, board);
      
      try {
        const room = await getRoom(roomId);
        if (room) {
          // Update room state
          room.gameStarted = true;
          room.board = board;
          if (settings) {
            room.settings = settings;
          }
          await room.save();

          const roomState = {
            ...room.toObject(),
            gameStarted: true,
            board: board
          };

          // Send updates to all clients in the room
          io.to(roomId).emit('roomUpdate', roomState);
          io.to(roomId).emit('gameStarted', { 
            board: board,
            gameStarted: true,
            settings: room.settings
          });

          // Send confirmation to the starter
          socket.emit('gameStartConfirmation', { 
            success: true,
            room: roomState
          });
          
          console.log(`Game started in room ${roomId}`);
          if (callback) callback({ success: true, room: roomState });
        } else {
          console.log(`Room ${roomId} not found`);
          if (callback) callback({ success: false, error: 'Room not found' });
          socket.emit('error', { message: 'Room not found' });
        }
      } catch (error) {
        console.error(`Error starting game in room ${roomId}:`, error);
        if (callback) callback({ success: false, error: 'Refresh the page to start game' });
        socket.emit('error', { message: 'Refresh the page to start game' });
      }
    });

    socket.on('reconnectPlayer', async ({ roomId, handle }, callback) => {
      console.log(`Player ${handle} attempting to reconnect to room ${roomId}`);
      
      try {
        const isInRoom = await isPlayerInRoom(roomId, handle);
        const room = await getRoom(roomId);
        
        if (!room) {
          console.log(`Room ${roomId} not found`);
          if (callback) callback({ success: false, error: 'Room not found' });
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (isInRoom) {
          const team = await getPlayerTeam(roomId, handle);
          
          // Leave previous room if any
          if (currentRoom) {
            socket.leave(currentRoom);
          }

      socket.join(roomId);
          currentRoom = roomId;

          // Serialize Map objects to plain objects
          const serializedRoom = {
            ...room.toObject(),
            solvedProblems: Object.fromEntries(room.solvedProblems),
            gameState: Object.fromEntries(room.gameState)
          };
          
          const reconnectData = { 
            room: serializedRoom, 
            team,
            isInGame: true,
            handle
          };

          socket.emit('reconnected', reconnectData);
          io.to(roomId).emit('roomUpdate', serializedRoom);
          
          console.log(`Player ${handle} reconnected to room ${roomId}`);
          if (callback) callback({ success: true, ...reconnectData });
        } else if (room.gameStarted) {
          const wasInTeamA = room.teamA.includes(handle);
          const wasInTeamB = room.teamB.includes(handle);
          
          if (wasInTeamA || wasInTeamB) {
            socket.join(roomId);
            currentRoom = roomId;
            
            // Serialize Map objects to plain objects
            const serializedRoom = {
              ...room.toObject(),
              solvedProblems: Object.fromEntries(room.solvedProblems),
              gameState: Object.fromEntries(room.gameState)
            };

            const reconnectData = {
              room: serializedRoom,
              team: wasInTeamA ? 'teamA' : 'teamB',
              isInGame: true,
              handle
            };

            socket.emit('reconnected', reconnectData);
            console.log(`Player ${handle} restored to previous game state in room ${roomId}`);
            if (callback) callback({ success: true, ...reconnectData });
          } else {
            console.log(`Player ${handle} not found in any team in room ${roomId}`);
            if (callback) callback({ success: false, error: 'Not a member of this game' });
            socket.emit('error', { message: 'Not a member of this game' });
          }
        } else {
          console.log(`Player ${handle} not found in room ${roomId}`);
          if (callback) callback({ success: false, error: 'Player not found in room' });
          socket.emit('error', { message: 'Player not found in room' });
        }
      } catch (error) {
        console.error(`Error reconnecting player ${handle}:`, error);
        if (callback) callback({ success: false, error: 'Failed to reconnect' });
        socket.emit('error', { message: 'Failed to reconnect' });
      }
    });

    socket.on('player-updated', ({ roomId, userId }) => {
      io.to(roomId).emit('refresh-game-state', { triggeredBy: userId });
    });

    socket.on('gameUpdated', async ({ roomId, solvedProblems, gameState, winner }) => {
      console.log(`Game updated in room ${roomId}`);
      try {
        const room = await getRoom(roomId);
        if (room) {
          // Convert Maps to plain objects for serialization if they aren't already
          const solvedProblemsObj = typeof solvedProblems.get === 'function' 
            ? Object.fromEntries(solvedProblems)
            : solvedProblems;

          const gameStateObj = typeof gameState.get === 'function'
            ? Object.fromEntries(gameState)
            : gameState;

          // Broadcast the updated game state to all clients in the room
          io.to(roomId).emit('gameStateUpdate', {
            solvedProblems: solvedProblemsObj,
            gameState: gameStateObj,
            winner
          });
          
          if (winner) {
            io.to(roomId).emit('gameOver', { winner });
          }
        }
      } catch (error) {
        console.error(`Error broadcasting game update for ${roomId}:`, error);
        socket.emit('error', { message: 'Failed to broadcast game update' });
      }
    });

    socket.on('leaveRoom', async ({ roomId, handle }, callback) => {
      try {
        console.log(`Player ${handle} leaving room ${roomId}`);
        
        const room = await getRoom(roomId);
        if (room) {
          // Remove player from their team
          room.teamA = room.teamA.filter(h => h !== handle);
          room.teamB = room.teamB.filter(h => h !== handle);
          await room.save();

          // Leave the socket room
          socket.leave(roomId);
          currentRoom = null;

          // Notify other players
          io.to(roomId).emit('roomUpdate', room);
          
          console.log(`Player ${handle} left room ${roomId}`);
          if (callback) callback({ success: true });
        } else {
          console.log(`Room ${roomId} not found for leaving`);
          if (callback) callback({ success: false, error: 'Room not found' });
        }
      } catch (error) {
        console.error(`Error leaving room for ${handle}:`, error);
        if (callback) callback({ success: false, error: 'Failed to leave room' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      if (currentRoom) {
        socket.leave(currentRoom);
        currentRoom = null;
      }
    });

    socket.on('error', (error) => {
      console.error(`Socket error for client ${socket.id}:`, error);
    });

    socket.on('chatMessage', (message, callback) => {
      try {
        // Only broadcast to users in the same room and channel
        if (message.channel === 'general') {
          io.to(currentRoom).emit('chatMessage', message);
        } else {
          // For team channels, only broadcast to team members
          const room = getRoom(currentRoom);
          if (room) {
            const teamMembers = message.channel === 'teamA' ? room.teamA : room.teamB;
            socket.to(currentRoom).emit('chatMessage', {
              ...message,
              recipients: teamMembers
            });
          }
        }
        
        // Send acknowledgment back to sender
        if (callback) {
          callback({ success: true });
        }
      } catch (error) {
        console.error('Error handling chat message:', error);
        if (callback) {
          callback({ success: false, error: 'Failed to send message' });
        }
      }
    });
  });
}

module.exports = setupSocket;
