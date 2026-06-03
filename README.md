# FoodFlow

Perishable food inventory tracking across multiple stores with transfer recommendations before expiry.

## Stack

- **Frontend:** React, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Recharts, React Router, Axios, Socket.IO Client
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, Socket.IO

## Deploy on Render

See **[DEPLOY_RENDER.md](./DEPLOY_RENDER.md)**. Use the included `render.yaml` Blueprint or create two services (API + static frontend).

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB running locally or Atlas connection string

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

API runs at `http://localhost:5000`

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173`

### Seed demo data

```bash
cd backend
npm run seed
```

Demo login: `admin@foodflow.com` / `admin123`

### API routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/dashboard/stats` | KPI stats |
| GET | `/api/dashboard/analytics` | Charts data |
| CRUD | `/api/stores` | Stores (admin write) |
| CRUD | `/api/products` | Products (admin write) |
| CRUD | `/api/inventory` | Inventory |
| GET/POST | `/api/sales` | Sales |
| GET | `/api/recommendations` | Transfer suggestions |

### Roles

- **Admin** — full CRUD on stores & products
- **Store Manager** — scoped to assigned store for inventory & sales

## Project Structure

```
FoodFlow/
├── backend/          # Express API + Socket.IO
└── frontend/         # React Vite dashboard
```
