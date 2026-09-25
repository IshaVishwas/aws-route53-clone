# AWS Route 53 Clone

A full-stack replica of Amazon Route 53 DNS and Domain Management console built with **Next.js 16** (App Router, TypeScript) and **FastAPI** (Python 3.12, SQLAlchemy, SQLite). Faithfully reproduces the AWS Management Console visual design with complete CRUD functionality.

---

## Architecture Overview

`
ROUTE 53/
├── frontend/               # Next.js 16 (App Router, TypeScript, Vanilla CSS)
│   └── src/
│       ├── app/            # Dashboard, Hosted Zones, DNS Records, Login, Coming Soon pages
│       ├── components/
│       │   ├── layout/     # AppShell, Navbar, Sidebar, ComingSoon
│       │   └── ui/         # Button, Badge, Modal, Table, SearchBar, Pagination, Toast, PageHeader
│       └── lib/            # api.ts, auth-context.tsx, types.ts
│
├── backend/                # FastAPI (Python 3.12, SQLAlchemy 2.0, SQLite, Pydantic v2)
│   └── app/
│       ├── api/v1/
│       │   ├── auth.py         # POST /auth/login, POST /auth/logout, GET /auth/session
│       │   ├── hosted_zones.py # Full CRUD for hosted zones
│       │   ├── dns_records.py  # Full CRUD for DNS records
│       │   └── router.py       # API v1 router aggregator
│       ├── core/               # config.py, database.py, security.py, seed.py
│       ├── models/             # base.py, auth.py, hosted_zone.py, dns_record.py
│       ├── schemas/            # auth.py, hosted_zone.py, dns_record.py
│       └── main.py             # FastAPI entrypoint with lifespan (DB init + seed)
│
├── .gitignore
├── .env.example
└── README.md
`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 16 (App Router) |
| Frontend Language | TypeScript |
| Styling | Vanilla CSS + inline styles (AWS Console design system) |
| Icons | Lucide React |
| Backend Framework | FastAPI |
| Backend Language | Python 3.12 |
| ORM | SQLAlchemy 2.0 |
| Database | SQLite (embedded, file-based) |
| Validation | Pydantic v2 |
| ASGI Server | Uvicorn |
| Authentication | Mock session-based auth (PBKDF2 hashing, Bearer tokens in SQLite) |

---

## Implemented Features

### Authentication
- [x] Login with email/password
- [x] Logout (server-side session invalidation)
- [x] Session persistence via localStorage + backend session validation
- [x] Protected routes — unauthenticated users redirected to /login
- [x] Logged-in user email shown in navbar
- [x] Toast notifications for auth success/errors

### Hosted Zones
- [x] List all hosted zones with live record count
- [x] Search hosted zones by name
- [x] Filter by type (Public / Private)
- [x] Pagination
- [x] Create hosted zone (with AWS-style zone ID generation, e.g. Z1D633PJN98FT9)
- [x] Edit hosted zone comment
- [x] Delete hosted zone
- [x] Zone details view with record summary
- [x] Duplicate name detection (409 Conflict)

### DNS Records (inside Hosted Zones)
- [x] List all DNS records for a zone
- [x] Search records by name or value
- [x] Filter by record type
- [x] Pagination
- [x] Create record (A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA)
- [x] Edit record (TTL, value, priority)
- [x] Delete record
- [x] Priority field shown for MX and SRV records

### UI/UX
- [x] AWS Management Console-style dark navbar (Squid Ink #161e2e)
- [x] Left sidebar with active route highlighting
- [x] Responsive layout (mobile hamburger menu)
- [x] Toast notification system (success, error, warning, info)
- [x] Modal dialogs for Create / Edit / Delete / Details
- [x] Loading states and empty states
- [x] Traffic Policies, Health Checks, Resolver, Profiles — Coming Soon pages

---

## Quick Start

### Prerequisites
- Node.js >= 18
- Python 3.12
- npm >= 9
- Git

### 1. Clone the Repository

`ash
git clone <repo-url>
cd "ROUTE 53"
`

### 2. Backend Setup

`ash
cd backend

# Create Python 3.12 virtual environment
py -3.12 -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate (macOS/Linux)
# source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Start dev server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
`

Backend auto-creates SQLite database and seeds the demo user on first startup.

- API Base URL: http://127.0.0.1:8000
- Swagger UI Docs: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

### 3. Frontend Setup

`ash
cd frontend
npm install
npm run dev
`

Web App: http://localhost:3000

### 4. Demo Login Credentials

| Field    | Value                   |
|----------|-------------------------|
| Email    | admin@route53.aws       |
| Password | AdminPassword123!       |

---

## Database Schema

### users
| Column        | Type        | Notes                          |
|---------------|-------------|-------------------------------|
| id            | TEXT (UUID) | Primary Key                   |
| email         | TEXT        | Unique, not null               |
| password_hash | TEXT        | PBKDF2-HMAC-SHA256 (salt+hash) |
| created_at    | DATETIME    | UTC                            |

### sessions
| Column     | Type        | Notes                                  |
|------------|-------------|----------------------------------------|
| id         | TEXT (UUID) | Primary Key                            |
| user_id    | TEXT        | FK to users.id                         |
| token      | TEXT        | URL-safe random token (64 chars)       |
| expires_at | DATETIME    | UTC — 24h from creation                |
| created_at | DATETIME    | UTC                                    |

### hosted_zones
| Column      | Type        | Notes                              |
|-------------|-------------|-------------------------------------|
| id          | TEXT (UUID) | Primary Key                         |
| zone_id     | TEXT        | AWS-style ID (e.g. Z1D633PJN98FT9) |
| name        | TEXT        | Domain name, Unique                 |
| type        | TEXT        | PUBLIC or PRIVATE                   |
| comment     | TEXT        | Optional description                |
| private_zone| BOOLEAN     | Derived from type                   |
| created_at  | DATETIME    | UTC                                 |
| updated_at  | DATETIME    | UTC                                 |

### dns_records
| Column         | Type        | Notes                                      |
|----------------|-------------|---------------------------------------------|
| id             | TEXT (UUID) | Primary Key                                 |
| hosted_zone_id | TEXT        | FK to hosted_zones.id                       |
| name           | TEXT        | Record name (e.g. www, @)                   |
| type           | TEXT        | A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA |
| ttl            | INTEGER     | Time-to-live in seconds                     |
| value          | TEXT        | Record value/target                         |
| priority       | INTEGER     | Nullable — used for MX and SRV              |
| created_at     | DATETIME    | UTC                                         |
| updated_at     | DATETIME    | UTC                                         |

---

## API Overview

All endpoints are prefixed with /api/v1. Protected endpoints require: Authorization: Bearer <token>

### Authentication
| Method | Path           | Auth | Description                              |
|--------|----------------|------|------------------------------------------|
| POST   | /auth/login    | No   | Login with email+password, returns token |
| POST   | /auth/logout   | Yes  | Invalidate current session token         |
| GET    | /auth/session  | Yes  | Validate token, returns current user     |

### Hosted Zones
| Method | Path                      | Auth | Description                              |
|--------|---------------------------|------|------------------------------------------|
| GET    | /hosted-zones             | Yes  | List zones (search, type filter, paging) |
| POST   | /hosted-zones             | Yes  | Create a new hosted zone                 |
| GET    | /hosted-zones/{zone_id}   | Yes  | Get a single hosted zone                 |
| PUT    | /hosted-zones/{zone_id}   | Yes  | Update hosted zone comment               |
| DELETE | /hosted-zones/{zone_id}   | Yes  | Delete a hosted zone                     |

### DNS Records
| Method | Path                              | Auth | Description                              |
|--------|-----------------------------------|------|------------------------------------------|
| GET    | /hosted-zones/{zone_id}/records   | Yes  | List records (search, type filter, paging)|
| POST   | /hosted-zones/{zone_id}/records   | Yes  | Create a new DNS record                  |
| GET    | /records/{record_id}              | Yes  | Get a single DNS record                  |
| PUT    | /records/{record_id}              | Yes  | Update a DNS record                      |
| DELETE | /records/{record_id}              | Yes  | Delete a DNS record                      |

### System
| Method | Path    | Auth | Description                    |
|--------|---------|------|--------------------------------|
| GET    | /health | No   | Health check (service + DB)    |

---

## Security Notes

- Passwords are hashed with PBKDF2-HMAC-SHA256 with a random salt (100,000 iterations).
- Session tokens are cryptographically random URL-safe 64-character strings.
- Sessions expire after 24 hours and are validated on every protected API call.
- CORS is configured to allow only http://localhost:3000 in development.

---

## Lint and Build

`ash
# Frontend lint (ESLint)
cd frontend && npm run lint

# Frontend production build
cd frontend && npm run build

# Backend import sanity check
cd backend && .\venv\Scripts\python.exe -c "from app.main import app; print('Backend OK')"
`

---

## Environment Variables

Copy `.env.example` to respective configuration files:

### Frontend (`frontend/.env.local`)
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000/api/v1` | Backend API base URL consumed by browser client |

### Backend (`backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `PROJECT_NAME` | `AWS Route 53 Clone API` | API service display name |
| `API_V1_STR` | `/api/v1` | API version 1 route prefix |
| `BACKEND_HOST` | `127.0.0.1` | Binding host IP |
| `BACKEND_PORT` | `8000` | Binding port number |
| `DATABASE_URL` | `sqlite:///./route53.db` | SQLAlchemy SQLite database URL |
| `SECRET_KEY` | `dev-secret-key-change-in-production` | Secret key for cryptographic operations |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:3000","http://127.0.0.1:3000"]` | Allowed CORS origins (JSON array or comma-separated) |

---

## Testing Instructions

### 1. Backend Automated Unit Tests (33 Tests)
Run Python's built-in unittest runner to execute all hosted zone and DNS record tests:
```bash
cd backend
python -m unittest discover tests
```

### 2. Backend Live E2E Verification
Verify full live workflow against running backend server:
```bash
cd backend
python tests/e2e_dns_live_check.py
python tests/e2e_live_check.py
```

### 3. Frontend Quality Checks
Run ESLint validation and Turbopack production compilation:
```bash
cd frontend
npm run lint
npm run build
```

---

## Deployment Instructions

### Architecture in Production
- **Frontend**: Next.js 16 App Router deployed on platforms like **Vercel** or **AWS Amplify**. Set `NEXT_PUBLIC_API_URL` to the public HTTPS backend URL (e.g. `https://api.yourdomain.com/api/v1`).
- **Backend**: FastAPI with Uvicorn deployed on container/PaaS platforms like **Render**, **Railway**, **Fly.io**, or **AWS EC2/App Runner**. Set `BACKEND_CORS_ORIGINS` to include the frontend production domain.

### SQLite Database Persistence in Deployment
Because SQLite is a file-based database, deploy the backend with a **persistent disk/volume mount** (e.g., `/data/route53.db`) and set:
```env
DATABASE_URL=sqlite:////data/route53.db
```
This ensures database persistence across container restarts and redeployments. Alternatively, configure `DATABASE_URL` with a managed database service URL if migrating beyond single-instance SQLite.

---

## Hosted Demo URL

> **Deployment Status**: Pre-deployment audit passed. Ready for deployment.
>
> - **Frontend Console URL**: `[Pending Deployment]`
> - **Backend API URL / Docs**: `[Pending Deployment]`
