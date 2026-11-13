# Lab 4 - Secure Connect and Communication Platform

## Setup
1. Install and start MongoDB (or use a MongoDB Atlas URI).
2. `npm install`
3. Edit `.env` (set a strong `JWT_SECRET`).
4. `npm start`  ->  http://localhost:5000

## API
| Method | Route | Auth | Description |
|-------:|-------|------|-------------|
| POST | /api/auth/signup | - | Register (bcrypt-hashed password) |
| POST | /api/auth/login | - | Returns JWT (also sets httpOnly cookie) |
| GET | /api/auth/profile | JWT | Current user |
| GET | /api/auth/users | JWT + admin | List users (RBAC) |
| POST | /api/notes | JWT | Create note |
| GET | /api/notes | JWT | List own notes (admin: all) |
| GET/PUT/DELETE | /api/notes/:id | JWT + owner/admin | Read / update / delete |

Send the token as `Authorization: Bearer <token>` (or the `token` cookie).

## Real-time chat
Open http://localhost:5000, log in, and chat. Socket events:
`joinRoom`, `leaveRoom`, `chatMessage`, `typing` (client -> server);
`message`, `system`, `typing` (server -> client). Sockets are JWT-authenticated.

## Events (EventEmitter)
`user:registered`, `user:loggedIn`, `note:created`, `note:deleted`, `chat:message`
are emitted from routes/sockets and logged by listeners in `events/appEvents.js`.
