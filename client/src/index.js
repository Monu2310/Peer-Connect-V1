import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Initialize dark mode from local storage or system preference before rendering
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
    // Set CSS variable for cursor color
    document.documentElement.style.setProperty('--cursor-color', 'rgba(66, 153, 225, 0.6)');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.setProperty('--cursor-color', 'rgba(34, 139, 230, 0.6)');
  }
};

// Run theme initialization
initializeTheme();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
