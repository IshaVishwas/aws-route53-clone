# AWS Route 53 Clone

A full-stack replica of the Amazon Route 53 DNS and Domain Management console built with **Next.js 16** (App Router, TypeScript) and **FastAPI** (Python 3.12, SQLAlchemy, SQLite). The project reproduces the AWS Management Console visual design with complete CRUD functionality for Hosted Zones and DNS Records.

---

## Live Demo

### Frontend

**AWS Route 53 Console:**  
https://aws-route53-clone-pi.vercel.app

### Backend

**FastAPI Backend:**  
https://aws-route53-backend-hz3g.onrender.com

### API Documentation

**Swagger UI:**  
https://aws-route53-backend-hz3g.onrender.com/docs

**ReDoc:**  
https://aws-route53-backend-hz3g.onrender.com/redoc

---

## Architecture Overview

```text
                         USER
                           │
                           ▼
              ┌─────────────────────────┐
              │     Vercel Frontend     │
              │      Next.js 16         │
              │   TypeScript / React    │
              └────────────┬────────────┘
                           │
                           │ HTTPS API Requests
                           ▼
              ┌─────────────────────────┐
              │     Render Backend      │
              │        FastAPI          │
              │      Python 3.12        │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │      SQLite Database    │
              │   SQLAlchemy ORM        │
              └─────────────────────────┘
```

### Project Structure

```text
ROUTE 53/
│
├── frontend/                       # Next.js 16 frontend
│   └── src/
│       ├── app/
│       │   ├── dashboard/           # Dashboard
│       │   ├── hosted-zones/        # Hosted Zones pages
│       │   ├── login/               # Login page
│       │   └── ...                  # Other pages
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell
│       │   │   ├── Navbar
│       │   │   ├── Sidebar
│       │   │   └── ComingSoon
│       │   │
│       │   └── ui/
│       │       ├── Button
│       │       ├── Badge
│       │       ├── Modal
│       │       ├── Table
│       │       ├── SearchBar
│       │       ├── Pagination
│       │       ├── Toast
│       │       └── PageHeader
│       │
│       └── lib/
│           ├── api.ts
│           ├── auth-context.tsx
│           └── types.ts
│
├── backend/                        # FastAPI backend
│   └── app/
│       ├── api/
│       │   └── v1/
│       │       ├── auth.py
│       │       ├── hosted_zones.py
│       │       ├── dns_records.py
│       │       └── router.py
│       │
│       ├── core/
│       │   ├── config.py
│       │   ├── database.py
│       │   ├── security.py
│       │   └── seed.py
│       │
│       ├── models/
│       │   ├── base.py
│       │   ├── auth.py
│       │   ├── hosted_zone.py
│       │   └── dns_record.py
│       │
│       ├── schemas/
│       │   ├── auth.py
│       │   ├── hosted_zone.py
│       │   └── dns_record.py
│       │
│       └── main.py
│
├── .gitignore
├── .env.example
└── README.md
```

---

# Tech Stack

## Frontend

| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework using App Router |
| **React** | UI development |
| **TypeScript** | Type-safe frontend development |
| **Vanilla CSS** | Styling and AWS Console-inspired design |
| **Lucide React** | Icons |
| **Vercel** | Frontend deployment |

## Backend

| Technology | Purpose |
|---|---|
| **Python 3.12** | Backend programming language |
| **FastAPI** | REST API framework |
| **Uvicorn** | ASGI server |
| **SQLAlchemy 2.0** | ORM and database interaction |
| **SQLite** | File-based relational database |
| **Pydantic v2** | Request/response validation |
| **Render** | Backend deployment |

## Authentication & Security

| Technology | Purpose |
|---|---|
| **PBKDF2-HMAC-SHA256** | Password hashing |
| **Random Salt** | Password hash protection |
| **Bearer Tokens** | API authentication |
| **Server-side Sessions** | Session management |
| **CORS** | Cross-origin request protection |

---

# Implemented Features

## Authentication

- [x] Login with email/password
- [x] Logout with server-side session invalidation
- [x] Session persistence through localStorage
- [x] Backend session validation
- [x] Protected routes
- [x] Unauthenticated users redirected to `/login`
- [x] Logged-in user email displayed in navbar
- [x] Toast notifications for authentication success/errors
- [x] Bearer token authentication

---

## Hosted Zones

- [x] List all hosted zones
- [x] Live DNS record count for each zone
- [x] Search hosted zones by name
- [x] Filter hosted zones by type
- [x] Public hosted zones
- [x] Private hosted zones
- [x] Pagination
- [x] Create hosted zone
- [x] AWS-style hosted zone ID generation
- [x] Edit hosted zone comment
- [x] Delete hosted zone
- [x] Hosted zone details view
- [x] Record summary
- [x] Duplicate domain name detection
- [x] HTTP `409 Conflict` handling for duplicate zones

Example AWS-style zone ID:

```text
Z1D633PJN98FT9
```

---

## DNS Records

DNS record management is implemented inside Hosted Zones.

### Supported Record Types

- A
- AAAA
- CNAME
- TXT
- MX
- NS
- PTR
- SRV
- CAA

### Operations

- [x] List DNS records
- [x] Search records by name
- [x] Search records by value
- [x] Filter records by type
- [x] Pagination
- [x] Create DNS records
- [x] Edit DNS records
- [x] Delete DNS records
- [x] Configure TTL
- [x] Configure record value
- [x] Configure priority
- [x] Priority support for MX records
- [x] Priority support for SRV records

---

# UI / UX

The frontend is designed to resemble the AWS Management Console.

### Implemented UI Features

- [x] AWS Management Console-style dark navbar
- [x] AWS-inspired color system
- [x] Left navigation sidebar
- [x] Active route highlighting
- [x] Responsive layout
- [x] Mobile hamburger navigation
- [x] Search bars
- [x] Tables
- [x] Pagination
- [x] Badges
- [x] Toast notifications
- [x] Modal dialogs
- [x] Create dialogs
- [x] Edit dialogs
- [x] Delete confirmation dialogs
- [x] Details dialogs
- [x] Loading states
- [x] Empty states
- [x] Error states

The application also contains placeholder pages for:

- Traffic Policies
- Health Checks
- Resolver
- Profiles

These sections are currently marked as **Coming Soon**.

---

# Quick Start

## Prerequisites

Make sure the following are installed:

- Node.js >= 18
- Python 3.12
- npm >= 9
- Git

---

## 1. Clone the Repository

```bash
git clone <repo-url>
cd "ROUTE 53"
```

---

# Backend Setup

## 2. Create Virtual Environment

```bash
cd backend

py -3.12 -m venv venv
```

### Windows PowerShell

```powershell
.\venv\Scripts\Activate.ps1
```

### macOS / Linux

```bash
source venv/bin/activate
```

---

## 3. Install Backend Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 4. Start Backend Server

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend automatically:

- Creates the SQLite database
- Creates the required database tables
- Seeds the demo user on first startup

### Local Backend URLs

API Base URL:

```text
http://127.0.0.1:8000
```

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

ReDoc:

```text
http://127.0.0.1:8000/redoc
```

Health Check:

```text
http://127.0.0.1:8000/api/v1/health
```

---

# Frontend Setup

## 5. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
```

---

## 6. Start Frontend

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:3000
```

---

# Demo Login Credentials

Use the following credentials to access the application:

| Field | Value |
|---|---|
| Email | `admin@route53.aws` |
| Password | `AdminPassword123!` |

---

# Database Schema

The project uses SQLite with SQLAlchemy.

## users

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (UUID) | Primary Key |
| `email` | TEXT | Unique, not null |
| `password_hash` | TEXT | PBKDF2-HMAC-SHA256 |
| `created_at` | DATETIME | UTC |

---

## sessions

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (UUID) | Primary Key |
| `user_id` | TEXT | Foreign Key to `users.id` |
| `token` | TEXT | URL-safe random token |
| `expires_at` | DATETIME | UTC, 24 hours from creation |
| `created_at` | DATETIME | UTC |

---

## hosted_zones

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (UUID) | Primary Key |
| `zone_id` | TEXT | AWS-style zone ID |
| `name` | TEXT | Domain name, unique |
| `type` | TEXT | `PUBLIC` or `PRIVATE` |
| `comment` | TEXT | Optional description |
| `private_zone` | BOOLEAN | Derived from type |
| `created_at` | DATETIME | UTC |
| `updated_at` | DATETIME | UTC |

---

## dns_records

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (UUID) | Primary Key |
| `hosted_zone_id` | TEXT | Foreign Key to hosted zone |
| `name` | TEXT | Record name |
| `type` | TEXT | A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA |
| `ttl` | INTEGER | Time-to-live in seconds |
| `value` | TEXT | Record value/target |
| `priority` | INTEGER | Nullable, used for MX and SRV |
| `created_at` | DATETIME | UTC |
| `updated_at` | DATETIME | UTC |

---

# API Overview

All API endpoints are prefixed with:

```text
/api/v1
```

Protected endpoints require:

```http
Authorization: Bearer <token>
```

---

# Authentication API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | No | Login with email and password |
| POST | `/auth/logout` | Yes | Invalidate current session |
| GET | `/auth/session` | Yes | Validate current session |

### Login

```http
POST /api/v1/auth/login
```

Example request:

```json
{
  "email": "admin@route53.aws",
  "password": "AdminPassword123!"
}
```

The backend returns an authentication token that is used for protected API requests.

---

# Hosted Zones API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/hosted-zones` | Yes | List hosted zones |
| POST | `/hosted-zones` | Yes | Create hosted zone |
| GET | `/hosted-zones/{zone_id}` | Yes | Get hosted zone |
| PUT | `/hosted-zones/{zone_id}` | Yes | Update hosted zone |
| DELETE | `/hosted-zones/{zone_id}` | Yes | Delete hosted zone |

Supported operations include:

- Search
- Type filtering
- Pagination
- Creation
- Editing
- Deletion
- Duplicate name validation

---

# DNS Records API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/hosted-zones/{zone_id}/records` | Yes | List DNS records |
| POST | `/hosted-zones/{zone_id}/records` | Yes | Create DNS record |
| GET | `/records/{record_id}` | Yes | Get DNS record |
| PUT | `/records/{record_id}` | Yes | Update DNS record |
| DELETE | `/records/{record_id}` | Yes | Delete DNS record |

---

# System API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Backend and database health check |

Example:

```text
GET /api/v1/health
```

---

# Security

The application implements the following security mechanisms.

## Password Hashing

Passwords are hashed using:

```text
PBKDF2-HMAC-SHA256
```

with:

- Random salt
- 100,000 iterations

Passwords are not stored as plaintext.

---

## Session Authentication

Authentication uses:

```text
Bearer Tokens
```

Session tokens are cryptographically random URL-safe strings.

Sessions:

- Are stored server-side
- Expire after 24 hours
- Are validated on protected API requests
- Can be invalidated during logout

---

## CORS

CORS is configured through:

```text
BACKEND_CORS_ORIGINS
```

The production backend allows the deployed Vercel frontend:

```text
https://aws-route53-clone-pi.vercel.app
```

---

# Lint and Build

## Frontend Lint

```bash
cd frontend
npm run lint
```

---

## Frontend Production Build

```bash
cd frontend
npm run build
```

---

## Backend Import Check

Windows:

```bash
cd backend
.\venv\Scripts\python.exe -c "from app.main import app; print('Backend OK')"
```

---

# Environment Variables

Environment variables are used to configure the frontend and backend independently.

---

## Frontend Environment Variables

File:

```text
frontend/.env.local
```

### Local Development

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

### Production

```env
NEXT_PUBLIC_API_URL=https://aws-route53-backend-hz3g.onrender.com/api/v1
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL consumed by the browser client |

---

# Backend Environment Variables

File:

```text
backend/.env
```

| Variable | Local Default | Description |
|---|---|---|
| `PROJECT_NAME` | `AWS Route 53 Clone API` | API service display name |
| `API_V1_STR` | `/api/v1` | API version route prefix |
| `BACKEND_HOST` | `127.0.0.1` | Backend binding host |
| `BACKEND_PORT` | `8000` | Backend port |
| `DATABASE_URL` | `sqlite:///./route53.db` | SQLAlchemy database URL |
| `SECRET_KEY` | `dev-secret-key-change-in-production` | Secret key for cryptographic operations |
| `BACKEND_CORS_ORIGINS` | Localhost origins | Allowed CORS origins |

---

## Local CORS Configuration

For local development:

```env
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

---

## Production CORS Configuration

For the deployed Vercel frontend:

```env
BACKEND_CORS_ORIGINS=["https://aws-route53-clone-pi.vercel.app"]
```

The Vercel URL must be an exact origin.

Do not add a trailing slash:

```text
Correct:
https://aws-route53-clone-pi.vercel.app

Incorrect:
https://aws-route53-clone-pi.vercel.app/
```

---

# Testing

## Backend Automated Unit Tests

The backend contains automated tests for hosted zones and DNS records.

Run:

```bash
cd backend
python -m unittest discover tests
```

---

## Backend Live E2E Verification

Run:

```bash
cd backend

python tests/e2e_dns_live_check.py
python tests/e2e_live_check.py
```

---

## Frontend Quality Checks

Run:

```bash
cd frontend

npm run lint
npm run build
```

---

# Deployment

The application is deployed using a separate frontend/backend architecture.

## Production Architecture

```text
                        INTERNET
                           │
                           ▼
              ┌─────────────────────────┐
              │         Vercel          │
              │                         │
              │      Next.js 16         │
              │      Frontend           │
              └────────────┬────────────┘
                           │
                           │ HTTPS
                           │ REST API
                           ▼
              ┌─────────────────────────┐
              │         Render          │
              │                         │
              │       FastAPI           │
              │      Python 3.12        │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │         SQLite          │
              │       Database          │
              └─────────────────────────┘
```

---

# Vercel Frontend Deployment

The frontend is deployed on Vercel.

### Production Frontend

```text
https://aws-route53-clone-pi.vercel.app
```

The Vercel project uses the:

```text
frontend/
```

directory as its root directory.

### Frontend Environment Variable

Set:

```env
NEXT_PUBLIC_API_URL=https://aws-route53-backend-hz3g.onrender.com/api/v1
```

This allows the browser to send API requests to the deployed Render backend.

---

# Render Backend Deployment

The backend is deployed on Render.

### Production Backend

```text
https://aws-route53-backend-hz3g.onrender.com
```

### API Base URL

```text
https://aws-route53-backend-hz3g.onrender.com/api/v1
```

### Swagger

```text
https://aws-route53-backend-hz3g.onrender.com/docs
```

The Render service uses the:

```text
backend/
```

directory as its working directory.

---

# Production Environment Configuration

## Vercel

```env
NEXT_PUBLIC_API_URL=https://aws-route53-backend-hz3g.onrender.com/api/v1
```

## Render

```env
BACKEND_CORS_ORIGINS=["https://aws-route53-clone-pi.vercel.app"]
```

The CORS configuration is required because the frontend and backend are hosted on different domains.

---

# Production Request Flow

When a user interacts with the deployed application:

```text
Browser
   │
   ▼
https://aws-route53-clone-pi.vercel.app
   │
   │ API Request
   ▼
https://aws-route53-backend-hz3g.onrender.com/api/v1
   │
   │ SQLAlchemy
   ▼
SQLite Database
```

For example, during login:

```text
User enters credentials
        │
        ▼
Vercel Frontend
        │
        │ POST /api/v1/auth/login
        ▼
Render FastAPI Backend
        │
        ▼
Validate credentials
        │
        ▼
Create session
        │
        ▼
Return Bearer Token
        │
        ▼
Frontend stores session
```

---

# SQLite Deployment Note

The current deployment uses SQLite because the project is deployed using the free Render setup.

SQLite is a file-based database.

Because the free deployment does not provide a persistent disk, SQLite data should **not be considered permanent production storage**.

Data may be reset after certain:

- Redeployments
- Service restarts
- Instance changes
- Ephemeral filesystem resets

For a durable production deployment, the database can be migrated to:

- PostgreSQL
- Another managed relational database
- A hosting plan with persistent disk support

---

# Deployment Steps

To deploy the project from scratch:

### 1. Deploy Backend

Deploy the `backend` directory to Render.

Configure:

```env
DATABASE_URL=sqlite:///./route53.db
```

and:

```env
BACKEND_CORS_ORIGINS=["https://aws-route53-clone-pi.vercel.app"]
```

---

### 2. Deploy Frontend

Deploy the `frontend` directory to Vercel.

Set:

```env
NEXT_PUBLIC_API_URL=https://aws-route53-backend-hz3g.onrender.com/api/v1
```

---

### 3. Redeploy Backend

After changing backend environment variables, redeploy the Render service so the new environment configuration is loaded.

---

### 4. Verify Backend

Open:

```text
https://aws-route53-backend-hz3g.onrender.com/docs
```

Verify that Swagger loads correctly.

---

### 5. Verify Frontend

Open:

```text
https://aws-route53-clone-pi.vercel.app
```

Verify:

- Login
- Dashboard
- Hosted Zones
- DNS Records
- Create operations
- Edit operations
- Delete operations
- Search
- Filtering
- Pagination
- Logout

---

# CORS Troubleshooting

If the deployed frontend displays:

```text
Failed to fetch
```

or the browser console displays:

```text
blocked by CORS policy
```

verify that the Render environment variable contains the exact Vercel origin:

```env
BACKEND_CORS_ORIGINS=["https://aws-route53-clone-pi.vercel.app"]
```

Make sure:

- `https://` is included
- There is no trailing `/`
- The Vercel domain is correct
- The Render backend has been redeployed after changing the variable

---

# API Health Check

The deployed backend provides a health endpoint:

```text
https://aws-route53-backend-hz3g.onrender.com/api/v1/health
```

This endpoint can be used to verify that the FastAPI service and database are running.

---

# Hosted Demo

## Frontend

https://aws-route53-clone-pi.vercel.app

## Backend

https://aws-route53-backend-hz3g.onrender.com

## Swagger API Documentation

https://aws-route53-backend-hz3g.onrender.com/docs

## ReDoc

https://aws-route53-backend-hz3g.onrender.com/redoc

---

# Project Status

**Deployment Status: Deployed and Working**

The application is currently deployed using:

```text
Frontend  → Vercel
Backend   → Render
Database  → SQLite
```

Production communication:

```text
Vercel Frontend
      │
      │ HTTPS
      ▼
Render FastAPI Backend
      │
      ▼
SQLite
```

---

# Future Improvements

Potential future improvements include:

- [ ] Persistent production database
- [ ] PostgreSQL migration
- [ ] Persistent storage for SQLite
- [ ] Additional Route 53 services
- [ ] Traffic Policies implementation
- [ ] Health Checks implementation
- [ ] Resolver implementation
- [ ] Profiles implementation
- [ ] Custom domain deployment
- [ ] Expanded automated test coverage
- [ ] CI/CD pipeline
- [ ] Production-grade secret management
- [ ] Advanced AWS Route 53 functionality

---

# License

This project is created for educational and demonstration purposes.

It is a frontend/backend replica inspired by the AWS Route 53 Management Console and is not affiliated with or endorsed by Amazon Web Services.
