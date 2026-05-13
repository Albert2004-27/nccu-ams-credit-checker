# 畢業審核系統前端

React + Vite + TypeScript frontend for the NCCU Applied Mathematics graduation audit system.

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Default URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:3001
```

## Current Auth Scope

The login and register pages are frontend-only demo flows in this phase. The existing backend does not yet provide real auth endpoints, password hashing, JWT, sessions, or role middleware.

Student and admin navigation is handled in frontend state. Backend API calls still use the current `userId`-based API contract.

## Main Flows

- Student: login/register demo flow, import transcript JSON, view courses, run audit, view results and history.
- Admin: inspect unresolved courses, create manual adjustments, query courses, query requirements, inspect audit history.

## Verification

```bash
npm test
npm run build
```
