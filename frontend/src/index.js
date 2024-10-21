import React from 'react';
import ReactDOM from 'react-dom'; // Import from 'react-dom' for React 16
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Render the application using ReactDOM.render
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root') // Specify the root element
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
