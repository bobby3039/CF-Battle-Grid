require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const roomRoutes = require('./routes/roomRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const setupSocket = require('./socket');

const app = express();

// CORS for Express routes
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean); // Removes undefined values

app.use(cors({
  origin: allowedOrigins,
  credentials: true 
}));

app.use(express.json());

// Connect to MongoDB
connectDB();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Use same origins array
    methods: ["GET", "POST"],
    credentials: true
  }
});

setupSocket(io);

app.use('/api/room', roomRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready for connections`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/room`);
  console.log(`Allowed origins:`, allowedOrigins); // Debug info
});