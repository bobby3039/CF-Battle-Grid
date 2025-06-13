import React from 'react';

function PlayerList({ room }) {
  const teamStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px',
    backgroundColor: '#2d3748',
    borderRadius: '8px',
    marginBottom: '12px'
  };

  const teamLabelStyle = {
    fontSize: '16px',
    fontWeight: '600',
    minWidth: '80px',
    color: '#e5e7eb'
  };

  const playerListStyle = {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  };

  const playerStyle = (team) => ({
    padding: '6px 12px',
    borderRadius: '16px',
    backgroundColor: team === 'A' ? '#065f46' : '#854d0e',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500'
  });

  return (
    <div>
      <div style={teamStyle}>
        <div style={teamLabelStyle}>Team A</div>
        <div style={playerListStyle}>
          {room?.teamA?.map(p => (
            <div key={p} style={playerStyle('A')}>{p}</div>
          ))}
          {(!room?.teamA || room.teamA.length === 0) && (
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>No players yet</div>
          )}
        </div>
      </div>
      <div style={teamStyle}>
        <div style={teamLabelStyle}>Team B</div>
        <div style={playerListStyle}>
          {room?.teamB?.map(p => (
            <div key={p} style={playerStyle('B')}>{p}</div>
          ))}
          {(!room?.teamB || room.teamB.length === 0) && (
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>No players yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerList;
