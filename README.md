# Job Application Portal (Microservices Architecture)

A microservices-based Job Application Portal featuring an Authentication service with PostgreSQL persistence, a centralized API Gateway, and a modern React frontend with Login and Registration.

---

## 🏗️ Architecture & Communication Flow

```text
[ React Frontend ]  ──(Port 3000)──▶  [ API Gateway ]  ──(Port 5000)──▶  [ Auth Service ]  ──(Port 5001)──▶  [ PostgreSQL DB ]
 (Vite + React 19)                      (Reverse Proxy)                    (JWT + Bcrypt)                       (auth_db:5432)
```

---

## 📁 Project Structure

```text
Job Application Portal/
├── api-gateway/            # Centralized API Gateway (Port 5000)
│   ├── .env                # PORT=5000, AUTH_SERVICE_URL=http://localhost:5001
│   ├── package.json
│   ├── server.js           # Re-exports src/server.js
│   └── src/
│       ├── server.js       # Express server with CORS & request logger
│       └── routes/
│           └── authRoutes.js # Proxies /api/auth/* -> http://localhost:5001/api/auth/*
├── auth-service/           # Authentication microservice (Port 5001)
│   ├── init.sql            # PostgreSQL schema for users table
│   ├── .env                # DB credentials & JWT secret
│   ├── package.json
│   └── src/
│       ├── config/db.js    # PostgreSQL Pool connection
│       ├── controllers/    # authController.js (register, login, getMe)
│       ├── middleware/     # authMiddleware.js (verifyToken JWT)
│       ├── routes/         # authRoutes.js (/register, /login, /me)
│       └── server.js       # Express server with CORS & /health check
└── frontend/               # React Frontend (Port 3000)
    ├── index.html          # Vite HTML root
    ├── package.json        # React 19 & Vite configuration
    ├── vite.config.js      # Dev server & proxy configured to API Gateway (port 5000)
    └── src/
        ├── App.jsx         # Sign In / Register tabs, JWT Session & /me tester
        ├── index.css       # Clean responsive styling & animations
        └── main.jsx        # React root entry point
```

---

## 🚀 Running the Full Stack (3 Terminals)

### Terminal 1: Auth Service (Backend)
```powershell
cd "c:\Job Application Portal\auth-service"
npm run dev
# Runs on http://localhost:5001
```

### Terminal 2: API Gateway
```powershell
cd "c:\Job Application Portal\api-gateway"
npm start
# Runs on http://localhost:5000 (routes /api/auth -> http://localhost:5001)
```

### Terminal 3: React Frontend
```powershell
cd "c:\Job Application Portal\frontend"
npm run dev
# Runs on http://localhost:3000
```

---

## 🔑 Available API Gateway Endpoints

All client requests from React go through the API Gateway on port `5000`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `http://localhost:5000/health` | Gateway health status check |
| `POST` | `http://localhost:5000/api/auth/register` | Registers user (Candidate or Recruiter) into PostgreSQL |
| `POST` | `http://localhost:5000/api/auth/login` | Authenticates user & returns JWT token + user info |
| `GET` | `http://localhost:5000/api/auth/me` | Protected route (Requires `Authorization: Bearer <token>`) |

