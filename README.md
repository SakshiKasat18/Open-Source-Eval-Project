# Breathe Green

A polished, corporate-grade Carbon Footprint Calculator with unique features, strong UI, clean architecture, and a functioning backend API.

**Team:** PST - Team 60 - Guthal; Nishant; Shubham; Sakshi

## Features

### Core Features
- Input form for Travel, Electricity, Food, and Waste
- Calculate total CO₂ per day
- Breakdown card with categories
- Clean, corporate UI built with Tailwind CSS

### Unique Features

#### 1. "What If?" Machine
After showing results, the app automatically computes comparisons:
- If you took a bus → X kg
- If you used an EV → Y kg
- If you cycled → Z kg

#### 2. Context Engine
Shows benchmark comparisons:
- India per capita CO₂: ~2.0 tons/year
- UN 2030 Target: 2.3 tons/year per person

#### 3. Weekly Tracker
- Save results to localStorage
- Chart.js bar graph showing last 7 entries
- Auto-updates when new entry is added

## Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Axios
- Chart.js + react-chartjs-2
- LocalStorage

### Backend
- Express.js (Node.js)
- CORS enabled
- Climatiq API integration (optional, with fallback)
- Environment variable support

## Project Structure

```
open-source-eval-project/
├─ frontend/
│  ├─ index.html
│  ├─ vite.config.js
│  ├─ package.json
│  ├─ src/
│  │  ├─ App.jsx
│  │  ├─ main.jsx
│  │  ├─ pages/
│  │  │  ├─ Home.jsx
│  │  │  ├─ InputForm.jsx
│  │  │  ├─ Results.jsx
│  │  ├─ components/
│  │  │  ├─ Navbar.jsx
│  │  │  ├─ ResultCard.jsx
│  │  │  ├─ WeeklyTracker.jsx
│  │  │  ├─ ComparisonCard.jsx
│  │  ├─ utils/
│  │  │  ├─ storage.js
│  │  │  ├─ format.js
│  │  ├─ styles/
│  │  │  ├─ index.css
├─ backend/
│  ├─ server.js
│  ├─ package.json
│  ├─ routes/
│  │  ├─ calculate.js
│  ├─ .env.example
│  ├─ README.md
├─ api/
│  ├─ calculate.js (Vercel serverless version - optional)
├─ README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional):
```bash
# Create .env file and add:
CLIMATIQ_KEY=your_climatiq_api_key_here
PORT=5000
```

4. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update API endpoint in `InputForm.jsx` if backend is on different port:
```javascript
// Change this line if needed:
const response = await axios.post('http://localhost:5000/api/calculate', formData);
```

4. Start the frontend dev server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoint

### POST `/api/calculate`

**Request Body:**
```json
{
  "travelKm": 10,
  "travelMode": "car",
  "kWh": 5,
  "foodCategory": "mixed",
  "wasteKgPerMonth": 10
}
```

**Response:**
```json
{
  "total": 8.5,
  "breakdown": {
    "travel": 2.4,
    "electricity": 4.5,
    "food": 0.57,
    "waste": 0.17
  },
  "used": "fallback",
  "originalData": {
    "travelKm": 10,
    "travelMode": "car",
    "kWh": 5,
    "foodCategory": "mixed",
    "wasteKgPerMonth": 10
  }
}
```

## Emission Factors (Fallback)

- **Travel:**
  - Car: 0.24 kg/km
  - Scooter: 0.07 kg/km
  - Bus: 0.05 kg/km
  - Train: 0.04 kg/km
  - EV: 0.02 kg/km
  - Walk/Cycle: 0 kg/km

- **Electricity:** 0.9 kg/kWh
- **Food:**
  - Meat: 1.0 kg/day
  - Mixed: 0.57 kg/day
  - Vegetarian: 0.29 kg/day
- **Waste:** 0.5 kg per kg waste

## Deployment

### Backend Deployment
The backend can be deployed to:
- Heroku
- Railway
- Render
- DigitalOcean
- AWS/GCP/Azure
- Any Node.js hosting platform

Set the `CLIMATIQ_KEY` environment variable in your hosting platform.

### Frontend Deployment
The frontend can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

Make sure to update the API endpoint URL in production.

### Vercel Serverless (Alternative)
The `/api/calculate.js` file is a Vercel serverless function version that can be used if deploying to Vercel.

## License

MIT
