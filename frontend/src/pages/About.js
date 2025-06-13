import React from 'react';
import { Link } from 'react-router-dom';

function About() {
  const containerStyle = {
    maxWidth: '1000px',
    margin: '40px auto',
    padding: '32px',
    backgroundColor: '#111827',
    borderRadius: '12px',
    color: '#e5e7eb',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
  };

  const sectionStyle = {
    marginBottom: '32px'
  };

  const headingStyle = {
    color: '#60a5fa',
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '16px'
  };

  const subHeadingStyle = {
    color: '#93c5fd',
    fontSize: '20px',
    fontWeight: '500',
    marginBottom: '12px',
    marginTop: '24px'
  };

  const paragraphStyle = {
    lineHeight: '1.6',
    marginBottom: '16px',
    color: '#d1d5db'
  };

  const listStyle = {
    listStyleType: 'disc',
    paddingLeft: '24px',
    marginBottom: '16px'
  };

  const listItemStyle = {
    marginBottom: '8px',
    color: '#d1d5db'
  };

  const buttonStyle = {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#2563eb',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    marginTop: '24px'
  };

  const alertStyle = {
    backgroundColor: '#422006',
    border: '1px solid #92400e',
    color: '#fbbf24',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px'
  };

  const alertTitleStyle = {
    color: '#fbbf24',
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  return (
    <div style={containerStyle}>
      <div style={sectionStyle}>
        <h1 style={headingStyle}>About CF BattleGrid</h1>
        <p style={paragraphStyle}>
          Welcome to CF BattleGrid, a competitive programming game that combines
          the strategic elements of Tic-Tac-Toe with CodeForces problem-solving challenges.
          This unique game tests both your problem-solving skills and tactical thinking.
        </p>
      </div>

      <div style={alertStyle}>
        <div style={alertTitleStyle}>
          ⚠️ Important Notes
        </div>
        <ul style={{...listStyle, color: '#fbbf24'}}>
          <li style={{marginBottom: '8px'}}>
            If you get disconnected, you can easily reconnect by entering your CF handle and room ID
            (unless you've willingly left the room).
          </li>
          <li style={{marginBottom: '8px'}}>
            If you encounter any unexpected behavior or errors, try refreshing the page first.
          </li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 style={subHeadingStyle}>How to Play</h2>
        <ol style={{...listStyle, listStyleType: 'decimals'}}>
          <li style={listItemStyle}>
            <strong>Create or Join a Room</strong>: Start by creating a new game room or joining an existing one with your CodeForces handle.
          </li>
          <li style={listItemStyle}>
            <strong>Join a Team</strong>: Select either Team A (X) or Team B (O). Each team can have up to 2 players.
          </li>
          <li style={listItemStyle}>
            <strong>Game Board</strong>: The game board is a 3x3 grid, where each cell contains a CodeForces problem.
          </li>
          <li style={listItemStyle}>
            <strong>Solving Problems</strong>: Click on a problem to visit its CodeForces page. Solve it using your CodeForces account.
          </li>
          <li style={listItemStyle}>
            <strong>Claiming Cells</strong>: After solving a problem, click "Check My Solutions" to claim the cell. Team A's solutions are marked with X, Team B's with O.
            If that doesn't work, try refreshing the page. Avoid clicking "check my solutions" multiple times.
          </li>
          <li style={listItemStyle}>
            <strong>Winning the Game</strong>: Win by forming a line of three X's or O's horizontally, vertically, or diagonally.
          </li>
        </ol>
      </div>

      <div style={sectionStyle}>
        <h2 style={subHeadingStyle}>Game Features</h2>
        <ul style={{...listStyle, listStyleType: 'decimals'}}>
          <li style={listItemStyle}>
            <strong>Real-time Updates</strong>: See your opponent's moves and chat with them in real-time.
          </li>
          <li style={listItemStyle}>
            <strong>Team Chat</strong>: Communicate with your teammate through the private team chat channel to make strategies.
          </li>
          <li style={listItemStyle}>
            <strong>Problem Selection</strong>: Problems are automatically selected based on chosen topics and rating range.
          </li>
          <li style={listItemStyle}>
            <strong>Fair Play</strong>: Only recently solved problems count towards claiming a cell.
          </li>
        </ul>
      </div>

     

      <Link to="/" style={buttonStyle}>
        Start Playing
      </Link>
    </div>
  );
}

export default About; 