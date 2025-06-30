import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';
import About from './pages/About';
import Leaderboard from './pages/Leaderboard';

// Create a separate Navigation component
const Navigation = () => {
  const location = useLocation();
  const isInRoom = location.pathname.startsWith('/room/');

  const navStyle = {
    backgroundColor: '#1f2937',
    padding: '16px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  };

  const navContentStyle = {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const logoStyle = {
    color: '#60a5fa',
    fontSize: '24px',
    fontWeight: '600',
    textDecoration: 'none'
  };

  const navLinksStyle = {
    display: 'flex',
    gap: '24px'
  };

  const linkStyle = {
    color: '#e5e7eb',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'color 0.2s ease',
    ':hover': {
      color: '#60a5fa'
    }
  };

  // Don't render navigation if we're in a room
  if (isInRoom) {
    return null;
  }

  return (
    <nav style={navStyle}>
      <div style={navContentStyle}>
        <Link to="/" style={logoStyle}>
          CF BattleGrid
        </Link>
        <div style={navLinksStyle}>
          <Link to="/" style={linkStyle}>Home</Link>
          <Link to="/leaderboard" style={linkStyle}>Leaderboard</Link>
          <Link to="/about" style={linkStyle}>About</Link>
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="/about" element={<About />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
