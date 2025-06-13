import React from 'react';
import api from '../api';
import socket from '../socket';
import '../styles/Board.css';

function Board({ board, roomId, handle, solvedProblems = {}, gameState = {}, winner = null }) {
  const [updating, setUpdating] = React.useState(false);
  const [error, setError] = React.useState('');

  const updateSolved = async () => {
    if (!handle || updating) return;

    try {
      setUpdating(true);
      setError('');
      const response = await api.post(`/room/update/${roomId}`, { handle });
      
      if (response.data.updated) {
        // Emit update event to other players
        socket.emit('gameUpdated', {
          roomId,
          solvedProblems: response.data.solvedProblems,
          gameState: response.data.gameState,
          winner: response.data.winner
        });
      }
    } catch (error) {
      console.error('Error updating solved problems:', error);
      setError(error.response?.data?.error || 'Failed to update solved problems');
    } finally {
      setUpdating(false);
    }
  };

  const renderCell = (problem, row, col) => {
    const key = `${row},${col}`;
    const solved = solvedProblems[key];
    const state = gameState[key];

    return (
      <div 
        key={key}
        className={`board-cell ${solved ? (solved.team === 'teamA' ? 'solved-team-a' : 'solved-team-b') : ''}`}
      >
        <div>
          <a
            href={`https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`}
            target="_blank"
            rel="noopener noreferrer"
            className="question-link"
          >
            <h4 className="question-name">
              {problem.name}
            </h4>
          </a>
        </div>
        
        {solved && (
          <div className="solved-info">
            <div className={`solved-state ${solved.team === 'teamA' ? 'team-a' : 'team-b'}`}>
              {state}
            </div>
            <div className="solved-by">
              Solved by: {solved.solver}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="board-container">
      {winner && (
        <div className="winner-message">
          {winner === 'draw' ? "It's a Draw!" : `Team ${winner === 'teamA' ? 'A' : 'B'} Wins!`}
        </div>
      )}

      {error && (
        <div className="board-error">
          {error}
        </div>
      )}

      <div className="check-solutions-container">
        <button
          onClick={updateSolved}
          disabled={updating || winner}
          className="check-solutions-btn"
        >
          {updating ? 'Checking...' : 'Check My Solutions'}
        </button>
      </div>

      <div className="board-grid">
        {board.map((row, i) => 
          row.map((problem, j) => renderCell(problem, i, j))
        )}
      </div>
    </div>
  );
}

export default Board;
