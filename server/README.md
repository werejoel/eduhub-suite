# EduHub Server (Express + MongoDB)

This is a minimal Express + Mongoose server used by the frontend.

Setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI` and optional `PORT`.

2. Install dependencies and start:

```bash
cd server
npm install
npm run dev    # requires nodemon, or `npm start` to run once
```

API

The server exposes REST endpoints under `/api/{collection}` for the collections:
- students, teachers, classes, fees, attendance, marks, dormitories, store_items

Common endpoints:
- `GET /api/{collection}` - list
- `GET /api/{collection}/:id` - get single
- `POST /api/{collection}` - create
- `PUT /api/{collection}/:id` - update
- `DELETE /api/{collection}/:id` - delete

Some collection-specific endpoints exist (see server/index.js):
- `GET /api/students/search?name=...`
- `GET /api/fees/student/:studentId`
- `GET /api/fees/status/:status`
- `POST /api/attendance/bulk`
- `POST /api/marks/bulk`
- `GET /api/store_items/low-stock/:threshold`

Frontend

Set `VITE_API_BASE_URL` in your Vite environment (e.g. `.env.local`) to point to the server (e.g. `http://localhost:4000`). The frontend `src/lib/services.ts` was updated to use these endpoints.

Troubleshooting MongoDB

- If you see connection errors like `ECONNREFUSED ::1:27017` or `ECONNREFUSED 127.0.0.1:27017`, MongoDB is not running locally.
- On Windows, start the MongoDB service (depends on your installation):

```powershell
# If MongoDB was installed as a Windows service named MongoDB
net start MongoDB

# Or using sc
sc start MongoDB

# If you installed MongoDB manually, run the daemon (adjust path/version):
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --config "C:\Program Files\MongoDB\Server\6.0\bin\mongod.cfg"
```

- If you prefer not to run a local MongoDB, use MongoDB Atlas and set `MONGODB_URI` to the provided connection string in `.env`.
- If `localhost` resolves to IPv6 (::1) and your MongoDB binds to IPv4, try using `mongodb://127.0.0.1:27017/eduhub` as `MONGODB_URI`.

The server now includes automatic retry logic (retries every 5s) so it will keep trying to connect instead of exiting immediately.
