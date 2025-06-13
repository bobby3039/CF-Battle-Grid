import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { validateCodeforcesHandle } from '../api';
import '../styles/Home.css';

function Home() {
  const [handle, setHandle] = useState('');
  const [isHandleSubmitted, setIsHandleSubmitted] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();

  const submitHandle = async () => {
    const trimmedHandle = handle.trim();
    if (!trimmedHandle) {
      setError('Please enter your Codeforces handle');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const result = await validateCodeforcesHandle(trimmedHandle);
      if (result.isValid) {
        setIsHandleSubmitted(true);
        setError('');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to validate handle. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const createRoom = async () => {
    try {
      setIsCreating(true);
      setError('');
      const response = await api.post('/room/create');
      //console.log('Create room response:', response.data);
      
      if (response.data && typeof response.data.roomId === 'string') {
        navigate(`/room/${response.data.roomId}?handle=${encodeURIComponent(handle)}`);
      } else {
        console.error('Invalid room ID received:', response.data);
        setError('Error: Invalid room ID received from server');
      }
    } catch (error) {
      //console.error('Error creating room:', error);
      setError('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = () => {
    const trimmedId = joinRoomId.trim();
    if (!trimmedId) {
      setError('Please enter Room ID');
      return;
    }
    setError('');
    navigate(`/room/${trimmedId}?handle=${encodeURIComponent(handle)}`);
  };

  if (!isHandleSubmitted) {
    return (
      <div className="container">
        <h1 className="title">
          Welcome to CF BattleGrid
        </h1>
        <p className="subtitle">
          A competitive programming game.{' '}
          <Link to="/about">Learn how to play</Link>
        </p>
        
        {error && (
          <div className="error">
            <span>⚠️</span>
            {error}
          </div>
        )}
        
        <div className="flex-column">
          <input
            type="text"
            placeholder="Enter your Codeforces handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="input"
            disabled={isValidating}
          />
          <button 
            onClick={submitHandle}
            className={`button ${isValidating ? 'disabled' : ''}`}
            disabled={isValidating}
          >
            {isValidating ? (
              <>
                <span className="loading-spinner"></span>
                Validating...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2 className={`title title-small`}>
        Welcome, {handle}!
      </h2>
      
      {error && (
        <div className="error">
          <span>⚠️</span>
          {error}
        </div>
      )}

      <div className="mb-32">
        <button 
          onClick={() => setIsHandleSubmitted(false)}
          className="button secondary"
        >
          Change Handle
        </button>
      </div>
      
      <div className="flex-column gap-32">
        <button 
          onClick={createRoom}
          disabled={isCreating}
          className={`button ${isCreating ? 'disabled' : ''}`}
        >
          {isCreating ? 'Creating Room...' : 'Create New Room'}
        </button>

        <div className="divider" />

        <div className="flex-column width-300">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            className="input"
          />
          <button 
            onClick={joinRoom}
            className="button"
          >
            Join Room
          </button>
        </div>
      </div>

      <div className="notes-container">
        <div className="notes-title">
          <span>💡</span> Important Notes
        </div>
        <ul className="notes-list">
          <li className="note-item">
            <span>•</span>
            <span>If you get disconnected, you can easily reconnect by entering your CF handle and room ID (unless you've willingly left the room).</span>
          </li>
          <li className="note-item">
            <span>•</span>
            <span>If you encounter any unexpected behavior or errors, try refreshing the page first.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Home;
