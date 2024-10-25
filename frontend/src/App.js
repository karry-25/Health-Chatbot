import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Chat from './components/Chat';
import EmotionChart from './components/EmotionChart';
import HomePage from './components/HomePage';
import LoginPage from './components/Login';
import SignupPage from './components/SignupPage';

function App() {
  return (
    <Router>
      <div className="App">
        
        <main>
          <Routes>
            <Route exact path="/" element={<HomePage />} />
            <Route path="api/login" element={<LoginPage />} />
            <Route path="api/signup" element={<SignupPage />} />
            <Route path="api/chat" element={<Chat />} /> 
            <Route path="api/ws/chat" element={<Chat />} />
            <Route path="emotion-chart" element={<EmotionChart />} /> 
          </Routes>
        </main>
      </div>
    </Router>
  );
}


export default App;