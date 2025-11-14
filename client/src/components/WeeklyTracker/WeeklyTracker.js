import React, { useState, useEffect } from 'react';
import { WeeklyChart } from './WeeklyChart.js';
import * as storage from '../../utils/localStorageHelper.js';
import './WeeklyTracker.css';

const processDataForChart = (activities) => {
  const labels = activities.map((activity, index) => `Activity ${index + 1} (${activity.type})`);
  const data = activities.map(activity => activity.co2);
  
  return {
    labels,
    datasets: [
      {
        label: 'CO₂e (kg)',
        data: data,
        backgroundColor: 'rgba(0, 230, 118, 0.6)',
        borderColor: 'rgba(0, 230, 118, 1)',
        borderWidth: 1,
      },
    ],
  };
};

export const WeeklyTracker = () => {
  const [activities, setActivities] = useState([]);
  const [chartData, setChartData] = useState(processDataForChart([]));

  useEffect(() => {
    const loadedActivities = storage.getActivities();
    setActivities(loadedActivities);
    setChartData(processDataForChart(loadedActivities));
  }, []);
  
  const handleAddData = () => {
    const randomCo2 = (Math.random() * 5 + 1).toFixed(2);
    const types = ['commute', 'food', 'energy'];
    const randomType = types[Math.floor(Math.random() * types.length)];

    const newActivity = {
      type: randomType,
      co2: parseFloat(randomCo2),
      date: new Date().toISOString(),
    };
    
    const updatedActivities = storage.addActivity(newActivity);
    setActivities(updatedActivities);
    setChartData(processDataForChart(updatedActivities));
  };

  return (
    <div className="weekly-tracker-container">
      <h2>My Weekly Footprint</h2>
      
      <div className="chart-wrapper">
        <WeeklyChart chartData={chartData} />
      </div>
      
      <button onClick={handleAddData} className="test-button">
        (Person 3 Test) Simulate "Add to my week"
      </button>
    </div>
  );
};



