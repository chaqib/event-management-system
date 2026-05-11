# Event Management System

A full-stack event management platform with NestJS backend, React admin portal, Flutter mobile app, and PostgreSQL database.

## Architecture

```
event-management-system/
├── backend/          # NestJS API Server
├── frontend/         # React Admin Portal  
├── mobile/           # Flutter Mobile App
├── database/         # SQL scripts & migrations
└── docker-compose.yml
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + TypeScript |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Mobile | Flutter + Dart |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT + Passport |
| ORM | TypeORM |

## Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Flutter SDK 3.x
- PostgreSQL 16 (or use Docker)

### Quick Start (Docker)

```bash
# Clone and start all services
docker-compose up -d

# Backend runs at http://localhost:3000
# Frontend runs at http://localhost:5173
# pgAdmin runs at http://localhost:5050
```

### Manual Setup

#### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run migration:run
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Mobile
```bash
cd mobile
flutter pub get
flutter run
```

## API Documentation
Swagger docs available at: `http://localhost:3000/api/docs`
