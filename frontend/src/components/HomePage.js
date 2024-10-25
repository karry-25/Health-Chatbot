import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EmotionTracker from './EmotionTracker';
import './styles/HomePage.css';

const HomePage = () => {
  const [showTracker, setShowTracker] = useState(false);
  const [moodBoosterText, setMoodBoosterText] = useState(''); 
  const [userLoggedIn, setUserLoggedIn] = useState(false); // Track login status

  // Check for user login (e.g., using local storage or cookies)
  useEffect(() => {
    const checkLoginStatus = () => {
      // Replace with your actual login check logic
      const isLoggedIn = localStorage.getItem('userToken') ? true : false; 
      setUserLoggedIn(isLoggedIn);
    };

    checkLoginStatus(); 
  }, []);

  const handleMoodBoost = (mood) => {
    let newText;
    switch (mood) {
      case 'happy':
        newText = "Here are some tips to boost your happiness: Listen to upbeat music, spend time with loved ones, or engage in a hobby you enjoy!";
        break;
      case 'relax':
        newText = "Try these relaxation techniques: Practice deep breathing, meditate, or listen to calming sounds.";
        break;
      case 'energize':
        newText = "Here's how to feel more energized: Get some exercise, take a power nap, or enjoy a healthy snack.";
        break;
      default:
        newText = "Choose a mood to get personalized tips!";
    }
    setMoodBoosterText(newText);
  };

  return (
    <div className="home-container">
      <header className="header">
        <div className="logo">
          <img 
            src={`${process.env.PUBLIC_URL}/logo.png`} 
            alt="EmotiSense Logo" 
            className="logo-image"
          />
          <span className="logo-text">EmotiSense</span>
        </div>
        <nav className="nav-buttons">
          {/* Conditionally render login/signup or user profile based on login status */}
          {userLoggedIn ? (
            <Link to="/profile" className="nav-link profile">Profile</Link> 
          ) : (
            <>
              <Link to="/api/login" className="nav-link login">Login</Link>
              <Link to="/api/signup" className="nav-link signup">Signup</Link>
            </>
          )}
        </nav>
      </header>

      <section className="content-container">
        <div className="welcome-section">
          <h1 className="welcome-title">Feel, Reflect, Grow</h1>
          <p className="welcome-text">
            Welcome to EmotiSense! Your journey towards emotional wellness starts here. 
            Let us help you navigate your feelings with care, and boost your happiness 
            with AI-powered insights.
          </p>
          <button className="cta-button" onClick={() => setShowTracker(!showTracker)}>
            {showTracker ? 'Close Tracker' : 'Explore Your Emotions'} {/* Dynamic button text */}
          </button>
        </div>
        <div className="illustration">
          <img 
            src={`${process.env.PUBLIC_URL}/relax.png`} 
            alt="Illustration of a happy, relaxed person" 
            className="illustration-image"
          />
        </div>
      </section>

      {showTracker && <EmotionTracker />}

      <section className="mood-booster">
        <h2 className="booster-title">Boost Your Mood</h2>
        <p className="booster-text">
          Take control of your emotions with EmotiSense. We help you maintain 
          emotional balance with personalized feedback and mindful reminders.
        </p>
        <div className="booster-buttons">
          <button className="boost-button happy" onClick={() => handleMoodBoost('happy')}>
            Feel Happier
          </button>
          <button className="boost-button relax" onClick={() => handleMoodBoost('relax')}>
            Feel Relaxed
          </button>
          <button className="boost-button energize" onClick={() => handleMoodBoost('energize')}>
            Feel Energized
          </button>
        </div>
        {/* Display mood booster tips */}
        {moodBoosterText && <p className="booster-tips">{moodBoosterText}</p>} 
      </section>

      <footer className="homepage-footer">
        <p>&copy; 2024 EmotiSense. Your companion for emotional well-being.</p>
        <nav className="footer-links">
          <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
          <Link to="/terms" className="footer-link">Terms of Service</Link>
        </nav>
      </footer>
    </div>
  );
};

export default HomePage;