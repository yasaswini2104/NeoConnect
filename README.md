# NeoConnect — Staff Feedback & Complaint Management Platform

A full-stack platform where employees submit complaints, management tracks and resolves them, and everyone can see transparency about actions taken.

---

## Features

- **Unique Tracking IDs** — Every complaint gets `NEO-YYYY-NNN` format
- **Role-Based Access** — Staff, Secretariat, Case Manager, Admin (IT)
- **Complaint Lifecycle** — New → Assigned → In Progress → Pending → Resolved / Escalated
- **7-Day Escalation Rule** — Auto-reminder at 7 working days, auto-escalate at 14
- **Anonymous Submissions** — Toggle to hide submitter identity
- **File Uploads** — Attach PDF or images to complaints
- **Public Hub** — Quarterly digest, impact tracking table, meeting minutes archive
- **Polling System** — MCQ polls with live vote charts (one vote per person)
- **Analytics Dashboard** — Department heatmap, case statistics, hotspot detection (5+ cases)
- **JWT Authentication** — Persists across page refresh, role-checked on every API route

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 16 (TypeScript) |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (Radix UI) |
| Animations | Framer Motion + GSAP |
| Charts | Recharts |
| Backend | Node.js + Express.js v5 |
| Database | MongoDB via Mongoose |
| Auth | JWT (Bearer token) |

---

## Project Structure

```
neoconnect/
├── server/               # Express.js backend
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── middleware/        # Auth middleware
│   ├── utils/            # Cron job, file upload
│   ├── server.js         # Entry point
│   ├── seed.js           # Demo data seeder
│   └── .env.example
└── client/               # Next.js frontend
    └── src/
        ├── app/          # App Router pages
        ├── components/   # Shared components
        └── lib/          # API client, auth context, utils
```

---
## Setup Instructions

### Prerequisites
- Node.js 20+
- MongoDB running locally (or MongoDB Atlas URI)

### 1. Clone / unzip the project

### 2. Setup Backend

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### 3. Setup Frontend

```bash
cd client
npm install
cp .env.example .env.local
# .env.local already points to localhost:5000/api
npm run dev
```

### 4. Seed Demo Data (optional)

```bash
cd server
node seed.js
```

This creates 4 demo accounts:

| Email | Password | Role |
|---|---|---|
| staff@demo.com | password123 | Staff |
| secretariat@demo.com | password123 | Secretariat |
| casemanager@demo.com | password123 | Case Manager |
| admin@demo.com | password123 | Admin (IT) |

### 5. Open

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## API Routes

### Auth
| Method | Route | Access |
|---|---|---|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | All |
| PUT | /api/auth/change-password | All |

### Complaints
| Method | Route | Access |
|---|---|---|
| POST | /api/complaints | Staff+ |
| GET | /api/complaints | Role-filtered |
| GET | /api/complaints/:id | Role-filtered |
| GET | /api/complaints/track/:trackingId | All |
| PUT | /api/complaints/:id/assign | Secretariat, Admin |
| PUT | /api/complaints/:id/status | Case Manager, Secretariat |
| POST | /api/complaints/:id/notes | Case Manager, Secretariat |
| PUT | /api/complaints/:id/publish | Secretariat, Admin |

### Polls, Public Hub, Analytics — see source in `/server/routes/`

---

## Environment Variables

### Server `.env`
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/neoconnect
JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### Client `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 7-Day Escalation Logic

A cron job runs daily at 8:00 AM:
1. **At 7 working days** without Case Manager response → marks `escalationReminderSent = true`
2. **At 14 working days** → status changes to `Escalated`, management is alerted

---

## Tracking ID Format

Every complaint gets a unique ID on creation:

```
NEO-2026-001
NEO-2026-002
...
NEO-2026-999
```

Format: `NEO-{YEAR}-{3-digit sequential number}`
