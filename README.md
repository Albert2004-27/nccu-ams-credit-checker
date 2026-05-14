# NCCU Mathematical Sciences Undergraduate Degree Audit Reporting System

> Undergraduate degree audit system for NCCU Department of Mathematical Sciences students admitted in academic years 111–114.

<p>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white">
  <img alt="MySQL" src="https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white">
</p>

## Documentation

Full bilingual documentation is available in the project documentation page:

- [Open Documentation](./docs/index.html)

The documentation page includes an in-page language switcher for English and Traditional Chinese. The switch happens on the same page without navigating to another Markdown file.

## Overview

This repository is the final project for the **114-2 Database Systems** course.

The system allows students to import transcript JSON files downloaded from iNCCU and automatically evaluates whether the student satisfies the graduation requirements of the **NCCU Department of Mathematical Sciences undergraduate program**.

## Core Modules

| Module | Responsibilities |
|---|---|
| Student Portal | Import transcript JSON files, view imported courses, run degree audits, and review audit results/history. |
| Admin Portal | Review unresolved courses, create manual adjustments, query course data, query graduation rules, and view student audit records. |
| Backend | Express API, Sequelize models, MySQL persistence, transcript import, rule evaluation, and audit result storage. |
| Frontend | React, Vite, TypeScript, and Tailwind CSS interface for audit workflows and result visualization. |

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, Sequelize |
| Database | MySQL |
| Container | Docker Compose |
| Testing | npm test, k6 |
| Demo | Cloudflare Tunnel |

## Quick Start

```bash
cp backend/.env.example backend/.env
docker compose up -d --build
docker compose exec backend npm run seed
docker compose exec backend npm run seed:transcript
docker compose exec backend npm run seed:k6-user
cd frontend
npm install
npm run dev
```

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:3001` |

## Security Notice

Please do not upload real personal transcripts or sensitive academic records to the demo system. Future improvements will include backend authentication, JWT/session management, role-based access control, and stricter authorization checks.

## License

This project is developed as a course final project and is intended for academic demonstration and learning purposes only.
