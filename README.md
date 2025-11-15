# Creative Ideas Platform

A community-driven platform for sharing creative ideas, receiving feedback, and participating in knowledge exchange.

## Project Structure

```
creative-ideas-platform/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models and types
│   │   └── index.ts        # Application entry point
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/               # React + TypeScript frontend
    ├── src/
    │   ├── components/     # React components
    │   ├── contexts/       # React contexts
    │   ├── hooks/          # Custom React hooks
    │   ├── services/       # API client services
    │   ├── App.tsx         # Main App component
    │   └── main.tsx        # Application entry point
    ├── package.json
    └── vite.config.ts
```

## Setup Instructions

### Quick Setup (Recommended)

Run the setup script to install all dependencies:

**Windows:**
```bash
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

**Or using npm from root:**
```bash
npm run setup
```

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The backend API will be available at `http://localhost:3000`

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

### Running from Root Directory

You can also run the projects from the root directory:

```bash
# Start backend
npm run dev:backend

# Start frontend (in a separate terminal)
npm run dev:frontend
```

## Technology Stack

### Backend
- Node.js with Express
- TypeScript
- SQLite (better-sqlite3)
- JWT for authentication
- bcrypt for password hashing

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Axios for API calls
- IndexedDB for client-side storage

## Development

- Backend runs on port 3000
- Frontend runs on port 5173
- Frontend proxies API requests to backend during development
