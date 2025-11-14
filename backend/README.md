# CarbonSense Backend

Express.js backend API for CarbonSense carbon footprint calculator.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (optional):
```bash
cp .env.example .env
```

3. Add your Climatiq API key to `.env` (optional - will use fallback if not provided):
```
CLIMATIQ_KEY=your_api_key_here
```

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will run on `http://localhost:5000` by default.

## API Endpoints

### POST `/api/calculate`

Calculate carbon footprint based on user inputs.

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

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "CarbonSense API is running"
}
```

## Deployment

This backend can be deployed to:
- Heroku
- Railway
- Render
- DigitalOcean
- AWS/GCP/Azure
- Any Node.js hosting platform

Make sure to set the `CLIMATIQ_KEY` environment variable in your hosting platform if you want to use the Climatiq API.

