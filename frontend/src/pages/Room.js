import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import socket from '../socket';
import api from '../api';
import TeamSelector from '../components/TeamSelector';
import PlayerList from '../components/PlayerList';
import Board from '../components/Board.js';
import GameSettingsModal from '../components/GameSettingsModal';
import CountdownTimer from '../components/CountdownTimer';
import Chat from '../components/Chat';
import '../styles/Room.css';

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const [handle, setHandle] = useState(queryParams.get('handle') || '');

  const [room, setRoom] = useState({ teamA: [], teamB: [], gameStarted: false });
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isPlayerInGame, setIsPlayerInGame] = useState(false);
  const [solvedProblems, setSolvedProblems] = useState({});
  const [gameState, setGameState] = useState({});
  const [winner, setWinner] = useState(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  useEffect(() => {
    if (!roomId || typeof roomId !== 'string') {
      setError('Invalid room ID');
      setIsConnecting(false);
      return;
    }

    if (!handle) {
      setError('No Codeforces handle provided');
      setIsConnecting(false);
      return;
    }

    socket.emit('joinRoom', { roomId: roomId.toString() }, (response) => {
      if (response.success) {
     
        if (response.room.gameStarted) {
          socket.emit('reconnectPlayer', { 
            roomId: roomId.toString(), 
            handle: handle.trim() 
          }, (reconnectResponse) => {
            if (reconnectResponse.success) {
              console.log('Successfully reconnected:', reconnectResponse);
              setIsPlayerInGame(true);
              if (reconnectResponse.room) {
                setRoom(reconnectResponse.room);
                if (reconnectResponse.room.board) {
                  setBoard(reconnectResponse.room.board);
                }
                if (reconnectResponse.room.solvedProblems) {
                  setSolvedProblems(reconnectResponse.room.solvedProblems);
                }
                if (reconnectResponse.room.gameState) {
                  setGameState(reconnectResponse.room.gameState);
                }
                if (reconnectResponse.room.winner) {
                  setWinner(reconnectResponse.room.winner);
                }
              }
            } else {
            }
          });
        } else {
          // For new games, just set the room state
          setRoom(response.room);
          setIsConnecting(false);
          setError('');
        }
      } else {
        setError(response.error || 'Failed to join room');
      }
    });

    //checked
    socket.on('roomUpdate', data => {
      setIsConnecting(false);
      
      if (data) {
      setRoom(data);
        const isInGame = data.teamA.includes(handle) || data.teamB.includes(handle);
        setIsPlayerInGame(isInGame);
        if (data.board) {
          setBoard(data.board);
          if (data.gameStarted) {
            setShowSettings(false);
            setIsStartingGame(false);
          }
        }
        if (data.solvedProblems) {
          setSolvedProblems(data.solvedProblems);
        }
        if (data.gameState) {
          setGameState(data.gameState);
        }
        if (data.winner) {
          setWinner(data.winner);
        }
        setError('');
      } else {
        setError(`Room ${roomId} not found`);
      }
    });



    
    socket.on('gameStarted', data => {
   
      if (data && data.board) {
      setBoard(data.board);
        setIsStartingGame(false);
        setShowSettings(false);
        setError('');
        
        setRoom(prev => ({
          ...prev,
          gameStarted: true,
          board: data.board,
          settings: data.settings
        }));
      }
    });

    socket.on('gameStartConfirmation', ({ success, room }) => {
    
      if (success) {
        if (room) {
          setRoom(room);
          setBoard(room.board);
        }
        setIsStartingGame(false);
        setShowSettings(false);
        setError('');
      } else {
        setError('Refresh the pag to start the game');
        setIsStartingGame(false);
      }
    });

    socket.on('reconnected', ({ room, team, isInGame, handle: playerHandle }) => {
      if (room) {
        setRoom(room);
        if (room.board) {
          setBoard(room.board);
        }
        if (isInGame) {
          setHandle(playerHandle);
          setIsPlayerInGame(true);
        }
        setError('');
      }
    });

    socket.on('gameStateUpdate', ({ solvedProblems: newSolved, gameState: newState, winner: newWinner }) => {
      //console.log('Game state update received:', { newSolved, newState, newWinner });
      if (newSolved) {
        setSolvedProblems(newSolved);
      }
      if (newState) {
        setGameState(newState);
      }
      if (newWinner) {
        setWinner(newWinner);
      }
    });

    socket.on('gameOver', ({ winner: gameWinner }) => {  
      setWinner(gameWinner);
    });

    socket.on('error', ({ message }) => {
      setError(message);
      setIsConnecting(false);
      setIsStartingGame(false);
      setShowSettings(false);
    });

    socket.on('connect_error', (error) => {
      setError('Failed to connect to server. Please try again.');
      setIsConnecting(false);
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        setError('Server disconnected. Please refresh the page.');
      } else {
        setError('Connection lost. Attempting to reconnect...');
      }
    });

    return () => {
      console.log('Cleaning up socket listeners');
      socket.off('roomUpdate');
      socket.off('gameStarted');
      socket.off('gameStateUpdate');
      socket.off('gameOver');
      socket.off('gameStartConfirmation');
      socket.off('reconnected');
      socket.off('error');
      socket.off('connect_error');
      socket.off('disconnect');
    };
  }, [roomId, handle]);

  const joinTeam = teamName => {
    if (!handle.trim()) {
      setError('Please enter your Codeforces handle before joining a team.');
      return;
    }
    if (!roomId) {
      setError('Invalid room ID');
      return;
    }
    setError('');
    socket.emit('joinTeam', { 
      roomId: roomId.toString(), 
      handle: handle.trim(), 
      team: teamName 
    });
  };

  const handleSettingsSave = (settings) => {
    if (!roomId) {
      setError('Invalid room ID');
      return;
    }
    console.log('Settings received from modal:', settings);
    setShowSettings(false);
    startGame(settings);
  };

  const startGame = async (settings) => {
    try {
      if (!roomId) {
        setError('Invalid room ID');
        return;
      }
      
    //  console.log('Sending settings to backend:', settings);
      setIsStartingGame(true);
      setError('');
      
      const response = await api.post(`/room/start/${roomId}`, settings);
      
      if (response.data && response.data.board) {
        socket.emit('gameStarted', { 
          roomId: roomId.toString(), 
          board: response.data.board,
          settings: response.data.settings,
          teamA: response.data.teamA,
          teamB: response.data.teamB
        }, (socketResponse) => {
          if (socketResponse.success) {

            setBoard(response.data.board);
            setRoom(prev => ({
              ...prev,
              gameStarted: true,
              board: response.data.board,
              settings: response.data.settings
            }));
            setShowSettings(false);
            setIsStartingGame(false);
          } else {
            setError(socketResponse.error || 'Refresh the page to start the game');
            setIsStartingGame(false);
          }
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Refresh the page to start the game');
      setIsStartingGame(false);
    }
  };

  

  const canStartGame = room.teamA.length > 0 && room.teamB.length > 0 && !room.gameStarted;

  const handleLeaveRoom = () => {
    setShowLeaveConfirm(true);
  };

  const confirmLeaveRoom = () => {
    socket.emit('leaveRoom', { roomId, handle }, () => {
      navigate('/?handle=' + handle);
    });
  };

  if (isConnecting) {
    return (
      <div className="connecting-message">
        <h2>Connecting to room...</h2>
      </div>
    );
  }

  if (!isPlayerInGame && room.gameStarted) {
    return (
      <div className="game-blocked-message">
        <div className="game-blocked-icon">⚠️</div>
        <h3 className="game-blocked-title">Cannot Join Game</h3>
        <p className="game-blocked-text">
          You cannot join this game. Either you have left the room or you were not part of the game.
        </p>
        <button
          onClick={() => navigate('/')}
          className="return-home-btn"
        >
          Return to Home
        </button>
      </div>
    );
  }


  return (
    <div className="room-container">
      <div className="room-header">
        <div className="room-header-info">
          <div className="room-header-item">
            <span className="room-header-label">Room ID:</span>
            <code className="room-header-value">{roomId}</code>
          </div>
          <div className="room-header-item">
            <span className="room-header-label">Playing as:</span>
            <div className="room-header-handle">{handle}</div>
          </div>
          <div>
            <CountdownTimer createdAt={room.createdAt} />
          </div>
        </div>
        <button
          onClick={handleLeaveRoom}
          className="leave-room-btn"
        >
          Leave Room
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      <div className="player-list-container">
        <PlayerList room={room} />
      </div>
      
      {!isPlayerInGame && !room.gameStarted && (
        <div className="team-selector-container">
          <TeamSelector onSelect={joinTeam} disabled={!handle.trim()} />
        </div>
      )}

      <div className="game-layout">
        <div className="game-board-container">
          {canStartGame && (
            <button 
              onClick={() => setShowSettings(true)} 
              disabled={isStartingGame}
              className={`start-game-btn ${isStartingGame ? 'disabled' : ''}`}
            >
              {isStartingGame ? 'Starting Game...' : 'Configure Game Settings (Any One Player)'}
            </button>
          )}
          <div className="game-board">
            {board && <Board 
              board={board}
              roomId={roomId}
              handle={handle}
              solvedProblems={solvedProblems}
              gameState={gameState}
              winner={winner}
            />}
          </div>
        </div>

        {isPlayerInGame && (
          <div className="chat-container">
            <Chat 
              roomId={roomId}
              handle={handle}
              team={room.teamA.includes(handle) ? 'teamA' : 'teamB'}
            />
          </div>
        )}
      </div>

      {showSettings && (
        <GameSettingsModal
          onSave={handleSettingsSave}
          onCancel={() => setShowSettings(false)}
        />
      )}

      {showLeaveConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Leave Room?</h3>
            <p className="modal-message">
              ⚠️ Warning: If you leave this room, you won't be able to rejoin it. Are you sure you want to leave?
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={confirmLeaveRoom}
                className="modal-confirm-btn"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Room;
