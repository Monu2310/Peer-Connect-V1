import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter

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

// Register service worker for better performance
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered: ', registration);
          
          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 3600000);
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available - notify user
                console.log('New app version available');
              }
            });
          });
        })
        .catch((registrationError) => {
          console.log('Service Worker registration failed: ', registrationError);
        });
    });
  }
};

// Run theme initialization
initializeTheme();

// Register service worker
registerServiceWorker();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter> {/* Wrap App with BrowserRouter */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
