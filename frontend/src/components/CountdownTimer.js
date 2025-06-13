import React, { useState, useEffect } from 'react';

function CountdownTimer({ createdAt }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const startTime = new Date(createdAt);
      const endTime = new Date(startTime.getTime() + (2.5 * 60 * 60 * 1000)); // 2.5 hours
      const now = new Date();
      const difference = endTime - now;

      if (difference <= 0) {
        return 'Room expired';
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return `${hours}h ${minutes}m ${seconds}s`;
    };

    if (!createdAt) {
      setTimeLeft('Loading...');
      return;
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt]);

  return (
    <div style={{
      display: 'inline-block',
      padding: '4px 8px',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
      fontSize: '14px',
      color: timeLeft === 'Room expired' ? '#ff5252' : '#666'
    }}>
      {timeLeft === 'Room expired' ? (
        <span style={{ color: '#ff5252' }}>⚠️ Room expired</span>
      ) : (
        <>Room expires in: {timeLeft}</>
      )}
    </div>
  );
}

export default CountdownTimer; 