import React from 'react';
import './App.css';
import { WeeklyTracker } from './components/WeeklyTracker/WeeklyTracker.js';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Carbon Footprint Calculator</h1>
      </header>
      
      <WeeklyTracker />
      
    </div>
  );
}

export default App;