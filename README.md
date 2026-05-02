# Valley Sync

Valley Sync is a real-time collaborative task board where multiple users can create boards, add tasks, and move them across columns — with every change broadcast instantly to all connected clients over WebSockets. Built to demonstrate a production-grade TypeScript architecture: business logic decoupled from the framework behind repository interfaces, end-to-end type-safe Socket.io events, GitHub OAuth via Auth.js, and a CI/CD pipeline that runs tests and deploys to Railway on every push to main.

## Tech Stack

- **Framework:** Next.js 14 (App Router, custom Node.js server)
- **Real-time:** Socket.io
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** Auth.js v5 (GitHub OAuth)
- **State:** Zustand
- **Language:** TypeScript
- **Testing:** Jest + React Testing Library
- **CI:** GitHub Actions
- **Deploy:** Railway

## Architecture

Business logic lives in `src/lib/` behind repository interfaces, completely decoupled from Next.js. API routes and the Socket.io server are thin layers that call into those services — the same `TaskService` handles both REST and WebSocket mutations.

```
src/
├── app/
│   ├── api/           # Thin route handlers
│   └── boards/[id]/   # Board page (server-rendered initial data)
├── lib/
│   ├── board/         # BoardService + PrismaBoardRepository
│   ├── task/          # TaskService + PrismaTaskRepository
│   └── socket/        # Socket.io server + auth middleware
├── components/
│   ├── board/         # BoardView, CreateBoardForm
│   └── task/          # TaskColumn, TaskCard, AddTaskForm
├── hooks/             # useSocket (singleton, wired to Zustand)
├── store/             # boardStore (Zustand)
└── types/             # Shared types + Socket.io event maps
```

## Local Development

**Prerequisites:** Docker, Node.js 20+

**1. Clone and install**
```bash
git clone https://github.com/your-username/valley-sync.git
cd valley-sync
npm install
```

**2. Configure environment**
```bash
cp .env.example .env
```

Fill in `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` (see [GitHub OAuth setup](#github-oauth-setup) below).

**3. Start the database**
```bash
docker compose up -d
```

**4. Run migrations**
```bash
npx prisma migrate dev
```

**5. Start the dev server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub OAuth Setup

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps → New OAuth App
2. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`
3. Copy the client ID and generate a client secret
4. Paste both into `.env`

For production, create a second OAuth app with your deployed URL as the callback.

## Running Tests

```bash
npm test
```

Tests cover the service layer (`BoardService`, `TaskService`) using mock repositories — no database required.

## Deployment

Deployed on Railway with a managed PostgreSQL add-on. On every push to `main`, Railway runs:

```
prisma generate && prisma migrate deploy && next build
```

Then starts the custom server with `npm start`.

**Required environment variables in Railway:**
- `DATABASE_URL` — injected automatically by the PostgreSQL add-on
- `AUTH_SECRET`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `NEXT_PUBLIC_APP_URL` — your `*.up.railway.app` domain

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/boards` | List all boards |
| `POST` | `/api/boards` | Create a board |
| `GET` | `/api/boards/:id` | Get a board with tasks |
| `PATCH` | `/api/boards/:id` | Rename a board |
| `DELETE` | `/api/boards/:id` | Delete a board |
| `GET` | `/api/tasks?boardId=` | List tasks for a board |
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks/:id` | Get a task |
| `PATCH` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |

All routes require a valid session. Unauthenticated requests return `401`.

## Socket Events

| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Server | `board:join` | `boardId` |
| Client → Server | `board:leave` | `boardId` |
| Client → Server | `task:create` | `{ boardId, title, status, ... }` |
| Client → Server | `task:update` | `{ taskId, changes }` |
| Client → Server | `task:delete` | `{ taskId }` |
| Server → Client | `task:created` | `{ task }` |
| Server → Client | `task:updated` | `{ taskId, changes }` |
| Server → Client | `task:deleted` | `{ taskId }` |

Socket connections are authenticated via the Auth.js JWT cookie verified on the handshake.
