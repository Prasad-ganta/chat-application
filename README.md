# Real-Time Chat Application

A full-stack real-time chat app built with **React** (frontend) and **Node.js + Express + Socket.io** (backend), using **SQLite** for persistent message storage.

---

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18 + Vite, Socket.io-client, Axios |
| Backend   | Node.js, Express, Socket.io |
| Database  | JSON file-based store (zero native dependencies — see Design Decisions) |
| Real-time | Socket.io (WebSocket with polling fallback) |

---

## Project Structure

```
chat-app/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.js          # JSON file read/write helpers
│   │   │   └── messageStore.js   # Data access layer for messages
│   │   ├── routes/
│   │   │   └── messages.js       # REST endpoints (send/history)
│   │   ├── socket/
│   │   │   └── index.js          # Socket.io event handlers
│   │   └── server.js             # App entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/           # Login, ChatWindow, MessageBubble, etc.
│   │   ├── hooks/
│   │   │   └── useChat.js        # Chat state + socket wiring
│   │   ├── services/
│   │   │   ├── api.js            # REST client
│   │   │   └── socket.js         # Socket.io client singleton
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # adjust values if needed
npm start               # or: npm run dev (with nodemon)
```

The backend starts on `http://localhost:5000` by default and automatically creates a JSON data file at `backend/data/chat.json` on first run — no manual DB setup, no native compilation, no build tools required.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # adjust VITE_API_URL if backend runs elsewhere
npm run dev
```

The frontend starts on `http://localhost:3000`. Open it in two different browser tabs/windows (or two browsers) to test real-time chat between "two users."

### Production build (frontend)

```bash
npm run build
npm run preview
```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the Express/Socket.io server listens on | `5000` |
| `CLIENT_ORIGIN` | Comma-separated list of allowed frontend origins (CORS) | `http://localhost:3000` |
| `DB_PATH` | Path to the JSON data file | `./data/chat.json` |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Base URL of the backend (REST + Socket.io) | `http://localhost:5000` |

---

## API Reference

### REST

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/messages` | Fetch full chat history, ordered by timestamp |
| `POST` | `/api/messages` | Send a message. Body: `{ "username": string, "text": string }` |

### Socket.io Events

**Client → Server**
| Event | Payload | Description |
|-------|---------|--------------|
| `user:join` | `username: string` | Registers a user as online after connecting |
| `message:send` | `{ text: string }` | Sends a new message (primary real-time path) |
| `message:read` | `messageIds: string[]` | Marks messages as read |
| `typing:start` / `typing:stop` | — | Typing indicator signals |

**Server → Client**
| Event | Payload | Description |
|-------|---------|--------------|
| `message:new` | message object | Broadcast when any user sends a message |
| `message:status` | `{ id, status }` | Single message status update (`sent` → `delivered` → `read`) |
| `message:status:bulk` | `{ ids, status }` | Bulk read-receipt update |
| `presence:update` | `string[]` | Current list of online usernames |
| `typing:update` | `{ username, isTyping }` | Broadcast when a user starts/stops typing |
| `error:message` | `string` | Server-side error notification |

---

## Features

### Core (required)
- Clean, responsive chat UI (mobile-friendly single-column layout)
- Send/receive messages instantly via Socket.io
- Chat history persists in SQLite and reloads after a page refresh
- Message timestamps
- REST APIs for sending messages and fetching history
- Graceful handling of connect/disconnect, API errors, and socket errors (visible error banner, auto-reconnect)

### Bonus (implemented)
- **Username-based login** (dummy auth — no password, just a display name)
- **Typing indicator** — animated "X is typing" shown to other users, auto-clears after 1.5s of inactivity
- **Online/offline status** — live count of connected users, connection status dot in the header
- **Message read/delivered status** — ticks like WhatsApp: single tick (sent) → double tick (delivered) → blue double tick (read)
- **Persistent storage** — SQLite via `better-sqlite3` (file-based, zero external setup)

### Not included in this submission
- Deployment to Render/Railway (backend is fully deploy-ready — see "Deployment Notes" below — but was not deployed for this submission)
- Native mobile app / APK (built as a responsive React web app instead — see Design Decisions)

---

## Design Decisions

1. **React web over React Native.** The assignment prefers React Native but accepts React. A React web app avoids the overhead of an Expo/EAS build pipeline (which requires cloud build queues and account setup) while still delivering a fully responsive, mobile-friendly interface that behaves like a chat app on any screen size. This let development focus on correctness of the real-time features within the deadline.

2. **JSON file store over SQLite/MongoDB.** The project initially used SQLite via `better-sqlite3`, but that package requires native compilation (node-gyp + a C++ toolchain), which fails on machines without build tools installed — notably Windows without Visual Studio's "Desktop development with C++" workload. To keep setup to a guaranteed `npm install && npm start` on any OS with zero prerequisites, message storage was moved to a simple JSON file (`backend/data/chat.json`), read/written through `db/index.js`. The data access layer (`messageStore.js`) is isolated from routes/sockets behind the same function signatures used before, so swapping in SQLite, MongoDB, or any other database later only requires changing `db/index.js` and `db/messageStore.js`.

3. **Socket.io as the primary send path, REST as a secondary path.** Messages are primarily sent via `message:send` over the socket for lowest latency. The REST `POST /api/messages` endpoint is also fully functional and broadcasts via `io.emit` too — useful for testing, non-socket clients, or future integrations (e.g., a bot or webhook).

4. **Simulated delivered/read status.** True "delivered" (device received) and "read" (message opened) tracking typically requires push notifications and app-lifecycle hooks that don't apply cleanly to a web chat demo. Here, "delivered" is set shortly after broadcast (all online clients receive it near-instantly), and "read" is set when the message renders in another user's open chat window — a reasonable approximation for a two-user demo.

5. **In-memory presence, persisted messages.** Online/offline status is inherently a live, ephemeral concept tied to active socket connections, so it's kept in memory (`Map` of socketId → username) rather than the database — avoids stale "online" records surviving server restarts.

6. **Single shared Socket.io instance with `autoConnect: false`.** The socket only connects once a username is chosen (post-login), avoiding anonymous/unauthenticated connections cluttering presence data.

---

## Assumptions Made

- "Username-based login" is dummy/display-name-only authentication, as explicitly allowed by the assignment (no password, no persisted user accounts/session tokens).
- All users share a single global chat room (no private DMs or multiple rooms) — the assignment describes one chat interface with a shared history.
- Chat history is unbounded and returned in full via `GET /api/messages`; for a production app with large volumes, this would be paginated, but the assignment's history requirement is satisfied without pagination for this scope.
- "Read" status reflects whether the *recipient's client has the message rendered on screen*, not necessarily active user attention — a standard simplification used by most chat apps' read receipts.
- No user file/image uploads are required — assignment specifies text messages only.

---

## Deployment Notes (for future work)

The backend is stateless aside from the JSON data file and is ready to deploy as-is to Render/Railway:
- Set `PORT` (most platforms inject this automatically), `CLIENT_ORIGIN` (your deployed frontend URL), and optionally `DB_PATH`.
- Note: on ephemeral filesystems (e.g., Render's free tier), the JSON file will reset on redeploy — for durable storage in production, mount a persistent disk or migrate to a managed DB (e.g., MongoDB Atlas, which the current `messageStore.js` abstraction makes straightforward to swap in).

The frontend can be deployed as a static build (`npm run build`) to Vercel/Netlify/Render Static Sites, pointing `VITE_API_URL` at the deployed backend URL.

---

## Testing Performed

- REST endpoints verified with `curl` (message creation, retrieval, health check)
- Two-client Socket.io integration test verifying: connection, `user:join`, presence broadcast to other clients, typing indicator broadcast, real-time message delivery, and server acknowledgment
- Frontend production build (`vite build`) verified to compile without errors
- Manual verification that messages persist in the JSON store and are returned in order via the history endpoint (confirms "view previous messages after refresh" requirement)
- Verified clean `npm install` with zero native compilation steps (no node-gyp, no build-tools dependency) — resolves an earlier issue where `better-sqlite3` failed to install on Windows without Visual Studio Build Tools
