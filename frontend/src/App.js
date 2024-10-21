import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Chat from './components/Chat';
import EmotionChart from './components/EmotionChart';
import Login from './components/Login';


function App() {
  return (
    <Router>
      <div className="App">
        <header>
          <h1>EmotiSense App</h1>
        </header>
        <main>
          <Routes>
            <Route exact path="/" element={<Login />} /> 
            <Route path="api/chat" element={<Chat />} /> 
            <Route path="emotion-chart" element={<EmotionChart />} /> 
          </Routes>
        </main>
      </div>
    </Router>
  );
}


export default App;