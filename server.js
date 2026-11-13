require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');
const initChat = require('./sockets/chat');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // simple chat client

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

initChat(io);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('[db] connection failed:', err.message);
    process.exit(1);
  });
