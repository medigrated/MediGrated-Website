# MediGrated Development

This workspace contains a full-stack application with a React/Vite frontend and an Express/MongoDB backend.

## Getting started

1. **Backend**
   ```bash
   cd medigrated/server
   npm install     # install dependencies
   npm run dev     # starts Express on port 5000
   ```

   - The server will attempt to connect to MongoDB using `MONGO_URI` in `server/.env`.
- Add `GROQ_API_KEY` to `server/.env` if you want real AI analysis. You can obtain a key from https://platform.groq.com; leave it blank for mock behavior.
   - If the URI is invalid or the database is unreachable, the server will still start but database-dependent features will fall back to in-memory stubs.
   - You can run a local MongoDB instance or supply a valid Atlas connection string for persistence.

2. **Frontend**
   ```bash
   cd medigrated/client
   npm install
   npm run dev     # starts Vite; default port is 5173 or next available
   ```

   - The client reads `VITE_API_URL` from `client/.env` (e.g. `http://localhost:5000`).
   - Make sure the backend is running before using any features; a "Unable to reach server" error means the backend must be started.

3. **Using the app**
   - Open the frontend URL shown by Vite (http://localhost:5173 or 5174).
   - You can register/login (authentication works even without Mongo thanks to an in-memory fallback).
   - Navigate to **Admin > Reports** or **Patient > Report Scanner** to use the OCR/analysis UI.
   - Select an image or PDF (images only for server-side OCR) and click **Analyze Report**.

  > **AI analysis:** if you set `GROQ_API_KEY` in `server/.env`, uploaded reports will also be sent to Groq's Llama model for natural‑language summarization. Without the key the analyzer falls back to a simple filename‑based mock parser.

## Troubleshooting

- **"Network Error" when clicking Analyze**: the frontend could not reach the backend. Ensure the server (`npm run dev` in `server` folder) is running and the port matches `VITE_API_URL`.
- **MongoDB connection failed**: check `server/.env`, correct the `MONGO_URI` or start a local Mongo instance. The app will fall back to a non-persistent mode if DB is unavailable.

## Notes

- The report scanner UI code was imported from [Report_Analysis_MediGrated](https://github.com/kshithijshetty/Report_Analysis_MediGrated); both admin and patient pages use the same component.
- Authentication is JWT-based with cookies; when Mongo is down requests are still permitted but data is not stored.

Feel free to explore and modify the project.
