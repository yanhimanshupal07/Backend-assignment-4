const jwt = require('jsonwebtoken');
const User = require('../models/User');
const appEvents = require('../events/appEvents');

function initChat(io) {
  // Authenticate every socket connection with the same JWT used for REST.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('No token provided'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id).select('username role');
      if (!user) return next(new Error('User not found'));
      socket.user = { id: user._id.toString(), username: user.username, role: user.role };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    const joinRoom = (room) => {
      socket.join(room);
      console.log(`${socket.id} joined room ${room}`);
      io.to(room).emit('system', `${socket.user.username} joined ${room}`);
    };

    joinRoom('general'); // everyone starts in "general"

    socket.on('joinRoom', (room) => {
      if (typeof room === 'string' && room.trim()) joinRoom(room.trim());
    });

    socket.on('leaveRoom', (room) => {
      socket.leave(room);
      io.to(room).emit('system', `${socket.user.username} left ${room}`);
    });

    socket.on('chatMessage', ({ room = 'general', text } = {}) => {
      if (!text || !text.trim() || !socket.rooms.has(room)) return;
      const message = {
        room,
        username: socket.user.username,
        text: text.trim(),
        time: new Date().toISOString(),
      };
      appEvents.emit('chat:message', message);
      io.to(room).emit('message', message);
    });

    socket.on('typing', ({ room = 'general' } = {}) => {
      socket.to(room).emit('typing', socket.user.username);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}

module.exports = initChat;
