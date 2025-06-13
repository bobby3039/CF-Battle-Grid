import React from 'react';

function TeamSelector({ onSelect, disabled, room }) {
  const getTeamButtonStyle = (team) => ({
    padding: '10px 20px',
    margin: '5px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    backgroundColor: team === 'A' ? '#4CAF50' : '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
  });

  return (
    <div style={{ marginTop: '20px' }}>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button 
          onClick={() => !disabled && onSelect('A')}
          style={getTeamButtonStyle('A')}
          disabled={disabled}
        >
          Join Team A
        </button>
        <button 
          onClick={() => !disabled && onSelect('B')}
          style={getTeamButtonStyle('B')}
          disabled={disabled}
        >
          Join Team B
        </button>
      </div>
      {disabled && (
        <p style={{ color: 'gray', fontSize: '14px', marginTop: '10px' }}>
          Please enter your Codeforces handle to join a team
        </p>
      )}
    </div>
  );
}

export default TeamSelector;
