import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { calculateCarbonFootprint } from './routes/calculate.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CarbonSense API is running' });
});

// API Routes
app.post('/api/calculate', calculateCarbonFootprint);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CarbonSense Backend running on http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/calculate`);
});

