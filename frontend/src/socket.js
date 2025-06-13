import { io } from 'socket.io-client';

const BACKEND_URL =  'REACT_APP_BACKEND_URL';

//console.log('Backend URL:', BACKEND_URL);
//console.log('Environment variable:', process.env.REACT_APP_BACKEND_URL);


const socket = io(BACKEND_URL, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('Socket connected successfully');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

export default socket;
