# TaskFlow API 🚀

A production-ready **Scalable REST API** built with **Node.js, Express, and MongoDB** featuring JWT Authentication, Role-Based Access Control, and full CRUD operations for task management.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [API Endpoints](#api-endpoints)
- [Authentication Flow](#authentication-flow)
- [Role-Based Access Control](#role-based-access-control)
- [Database Schema](#database-schema)
- [Security Practices](#security-practices)
- [Docker Deployment](#docker-deployment)
- [Scalability Notes](#scalability-notes)

---

## ✨ Features

- 🔐 **JWT Authentication** — Access token + Refresh token with rotation
- 👥 **Role-Based Access Control** — `user` and `admin` roles
- ✅ **Full Task CRUD** — Create, Read (paginated + filtered), Update, Delete
- 📄 **API Versioning** — All endpoints under `/api/v1/`
- 🛡️ **Input Validation** — Joi schema validation on every endpoint
- 🔒 **Security** — Helmet, CORS, rate limiting, NoSQL injection prevention
- 📚 **Swagger Docs** — Interactive API documentation at `/api/docs`
- 🐳 **Docker Ready** — One-command deployment with Docker Compose
- 📊 **Winston Logging** — File + console logging with rotation
- 🏗️ **Scalable Structure** — Modular MVC architecture

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| Database | MongoDB + Mongoose 8 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Joi |
| Docs | Swagger / OpenAPI 3.0 |
| Security | Helmet, express-rate-limit, express-mongo-sanitize |
| Logging | Winston |
| Containerization | Docker + Docker Compose |

---

## 📁 Project Structure

```
taskflow-api/
├── src/
│   ├── app.js                      # Express app setup & middleware stack
│   ├── config/
│   │   ├── database.js             # MongoDB connection with error handling
│   │   └── swagger.js              # OpenAPI 3.0 specification
│   ├── controllers/
│   │   ├── auth.controller.js      # register, login, refresh, logout, me
│   │   ├── task.controller.js      # Full CRUD + stats + pagination
│   │   └── user.controller.js      # Profile management, admin ops
│   ├── middlewares/
│   │   ├── auth.middleware.js      # protect, restrictTo, optionalAuth
│   │   ├── validate.middleware.js  # Joi validation factory + all schemas
│   │   └── errorHandler.js        # Global error handler + AppError class
│   ├── models/
│   │   ├── user.model.js           # User schema, bcrypt hook, methods
│   │   └── task.model.js           # Task schema, indexes, full-text search
│   ├── routes/v1/
│   │   ├── auth.routes.js          # /api/v1/auth/*
│   │   ├── task.routes.js          # /api/v1/tasks/*
│   │   └── user.routes.js          # /api/v1/users/*
│   ├── scripts/
│   │   └── seed.js                 # Creates initial admin user
│   └── utils/
│       ├── apiResponse.js          # Standardized response helpers
│       ├── jwt.js                  # Token generation & verification
│       └── logger.js               # Winston logger configuration
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com))
- npm

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/taskflow-api.git
cd taskflow-api
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` — at minimum, set:
```
MONGODB_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_secret_at_least_32_characters_long
JWT_REFRESH_SECRET=another_secret_at_least_32_chars
```

### 3. Seed Admin User

```bash
node src/scripts/seed.js
# Creates: admin@taskflow.com / Admin@12345
```

### 4. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`
Swagger docs at: `http://localhost:5000/api/docs`

---

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | 5000 | Server port |
| `NODE_ENV` | No | development | Environment |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | **Yes** | — | Refresh token secret |
| `JWT_EXPIRES_IN` | No | 7d | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | No | 30d | Refresh token expiry |
| `RATE_LIMIT_WINDOW_MS` | No | 900000 | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | No | 100 | Max requests per window |
| `ALLOWED_ORIGINS` | No | localhost:3000 | CORS allowed origins (comma-separated) |

---

## 📚 API Documentation

Interactive Swagger UI is available at:
```
http://localhost:5000/api/docs
```

JSON spec:
```
http://localhost:5000/api/docs.json
```

To test protected endpoints in Swagger:
1. Call `/api/v1/auth/login` to get a token
2. Click the **Authorize 🔒** button at the top
3. Enter: `Bearer YOUR_ACCESS_TOKEN`

---

## 🛣 API Endpoints

### Auth  `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login, get tokens |
| POST | `/refresh` | Public | Refresh access token |
| POST | `/logout` | 🔐 User | Logout, invalidate refresh token |
| GET | `/me` | 🔐 User | Get current user |

### Tasks  `/api/v1/tasks`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | 🔐 User | Get all tasks (paginated, filtered) |
| POST | `/` | 🔐 User | Create new task |
| GET | `/:id` | 🔐 User | Get task by ID |
| PATCH | `/:id` | 🔐 User | Update task |
| DELETE | `/:id` | 🔐 User | Delete task |
| GET | `/stats` | 🔐 Admin | Task statistics |

### Users  `/api/v1/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | 🔐 Admin | Get all users |
| GET | `/:id` | 🔐 User | Get user by ID |
| PATCH | `/me` | 🔐 User | Update own profile |
| PATCH | `/me/password` | 🔐 User | Change own password |
| PATCH | `/:id/toggle-status` | 🔐 Admin | Activate/deactivate user |

### System

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| GET | `/api/docs` | Public | Swagger UI |

---

## 🔑 Authentication Flow

```
1. Register/Login  →  Returns { accessToken, refreshToken }
2. All protected routes  →  Header: Authorization: Bearer <accessToken>
3. Access token expires (7d)  →  POST /auth/refresh with refreshToken
4. Logout  →  POST /auth/logout  (invalidates refresh token in DB)
```

**Refresh Token Rotation:** Every refresh generates a new refresh token. Old token is invalidated. If a used refresh token is reused, all tokens for that user are revoked (token theft detection).

---

## 👥 Role-Based Access Control

| Action | user | admin |
|---|---|---|
| Register / Login | ✅ | ✅ |
| View own tasks | ✅ | ✅ |
| View ALL tasks | ❌ | ✅ |
| Create/Edit/Delete own tasks | ✅ | ✅ |
| Delete any task | ❌ | ✅ |
| View own profile | ✅ | ✅ |
| View all users | ❌ | ✅ |
| Toggle user active status | ❌ | ✅ |
| View task stats | ❌ | ✅ |

---

## 🗄 Database Schema

### User
```
_id          ObjectId  (PK)
name         String    (required, 2-50 chars)
email        String    (unique, indexed)
password     String    (bcrypt, select: false)
role         Enum      (user | admin, default: user)
isActive     Boolean   (default: true)
lastLogin    Date
refreshTokens Array    (max 5, TTL 30d)
createdAt    Date
updatedAt    Date
```

### Task
```
_id          ObjectId  (PK)
title        String    (required, 3-100 chars)
description  String    (max 500 chars)
status       Enum      (todo | in-progress | done)
priority     Enum      (low | medium | high)
dueDate      Date      (must be future)
tags         [String]  (max 10, deduplicated, lowercased)
owner        ObjectId  (FK → User, indexed)
isArchived   Boolean   (default: false)
createdAt    Date
updatedAt    Date
```

**Indexes:**
- `User`: `email` (unique), `role`
- `Task`: `(owner, status)`, `(owner, priority)`, `(owner, createdAt)`, text index on `title + description + tags`

---

## 🔒 Security Practices

| Practice | Implementation |
|---|---|
| Password hashing | bcryptjs, salt rounds 12 |
| JWT signing | HS256 with strong secret |
| Refresh token rotation | Token reuse detection → revoke all |
| Rate limiting | 100 req/15min (10 for auth routes) |
| NoSQL injection | express-mongo-sanitize |
| Security headers | helmet (15+ HTTP headers) |
| Input sanitization | Joi `stripUnknown: true` |
| Body size limit | 10kb max payload |
| CORS | Whitelist-based origin check |
| Error messages | Never expose stack traces in production |

---

## 🐳 Docker Deployment

```bash
# Copy env
cp .env.example .env
# Edit .env with production secrets

# Start API + MongoDB
docker-compose up -d

# Optional: also start MongoDB UI at localhost:8081
docker-compose --profile dev up -d

# View logs
docker-compose logs -f api

# Seed admin user
docker-compose exec api node src/scripts/seed.js
```

---

## 📈 Scalability Notes

### Current Architecture
Single Node.js instance + MongoDB single node. Suitable for small-medium workloads.

### Horizontal Scaling (Next Steps)

**1. Load Balancing**
Deploy multiple API instances behind Nginx or AWS ALB. Since JWTs are stateless, no sticky sessions are needed.

**2. Caching with Redis**
```
- Cache GET /tasks responses per user (TTL: 60s)
- Cache user sessions to reduce DB lookups
- Use Redis for refresh token storage (instead of MongoDB array)
```

**3. Database Scaling**
```
- MongoDB Atlas: Enable auto-scaling + read replicas
- Add read preference: secondaryPreferred for GET routes
- Shard by owner field for task collection at scale
```

**4. Microservices Split**
When team/traffic grows, split into:
- `auth-service` — Registration, login, token management
- `task-service` — Task CRUD
- `notification-service` — Email/push notifications
- API Gateway (Kong / AWS API Gateway) for routing

**5. Message Queue**
Use BullMQ (Redis-backed) for async jobs:
- Welcome emails on registration
- Task deadline reminders
- Audit logging

**6. Monitoring**
- APM: New Relic / Datadog
- Logs: ELK Stack (Elasticsearch + Logstash + Kibana)
- Uptime: UptimeRobot or Pingdom

---


Swagger UI → localhost:5000/api/docs
Dashboard → localhost:5173
Users Admin panel → localhost:5173 (click Users in sidebar)

## 👤 Author

**Anubhav** — B.Tech Chemical Engineering, MMMUT  
Transitioning to Software Development | MERN Stack

---

## 📄 License

MIT
