# Justexa - Quick Start Guide

## Prerequisites
- Node.js (v16+) and npm installed
- MongoDB running locally on port 27017 (or update .env with your MongoDB URI)

## Setup & Run

### 1. Install Backend Dependencies
```bash
cd server
npm install
```

### 2. Install Frontend Dependencies
```bash
cd client
npm install
```

### 3. Start Backend (Terminal 1)
```bash
cd server
npm run dev
```
Backend runs on: http://localhost:5000

### 4. Start Frontend (Terminal 2)
```bash
cd client
npm start
```
Frontend runs on: http://localhost:3000

### 5. Seed Sample Data (Optional - for demo)
After backend is running, open a browser or use curl:
- Seed cases: POST http://localhost:5000/api/cases/seed
- Seed advocates: POST http://localhost:5000/api/marketplace/seed

Or use the browser console:
```javascript
fetch('http://localhost:5000/api/cases/seed', { method: 'POST' })
fetch('http://localhost:5000/api/marketplace/seed', { method: 'POST' })
```

## Demo CNR Numbers (after seeding)
- MHCC010012345 (Bombay High Court - Pending)
- DLHC020067890 (Delhi High Court - Active)
- TNCH030098765 (Madras High Court - Disposed)

## Project Structure
```
justexa/
├── .env                    # MongoDB URI, JWT secret, Port
├── server/
│   ├── index.js            # Express entry point
│   ├── models/             # User, Advocate, Case schemas
│   ├── routes/             # auth, cases, marketplace, profile
│   └── middleware/auth.js  # JWT verification
└── client/
    └── src/
        ├── App.js           # Routing
        ├── context/         # AuthContext
        ├── utils/api.js     # Axios API calls
        ├── components/      # Navbar, Sidebar, GridBox
        └── pages/           # All 9 pages
```

## AI Petition API Integration
Edit `client/src/pages/PetitionGenerator.js` and replace the demo section with your API call.
