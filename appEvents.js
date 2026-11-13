// Central EventEmitter: routes/sockets emit events, listeners react to them.
const EventEmitter = require('events');

class AppEvents extends EventEmitter {}
const appEvents = new AppEvents();

appEvents.on('user:registered', (user) => {
  console.log(`[event] New user registered: ${user.username} (${user.email})`);
});

appEvents.on('user:loggedIn', (user) => {
  console.log(`[event] User logged in: ${user.email} at ${new Date().toISOString()}`);
});

appEvents.on('note:created', (note) => {
  console.log(`[event] Note created: "${note.title}" by owner ${note.owner}`);
});

appEvents.on('note:deleted', (noteId) => {
  console.log(`[event] Note deleted: ${noteId}`);
});

appEvents.on('chat:message', ({ room, username, text }) => {
  console.log(`[${room}] ${username}: ${text}`);
});

module.exports = appEvents;
