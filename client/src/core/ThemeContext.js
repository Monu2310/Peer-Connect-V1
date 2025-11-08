import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    return savedTheme === 'dark' || (!savedTheme && prefersDark);
  });

  const toggleButtonRef = useRef(null);

  useEffect(() => {
    // Apply dark mode class to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = (event) => {
    // Store button position for animation
    if (event?.currentTarget) {
      toggleButtonRef.current = event.currentTarget;
    }

    const newMode = !isDarkMode;
    
    // Check if browser supports View Transitions API
    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        setIsDarkMode(newMode);
      });

      // Get button position for circular reveal animation
      if (toggleButtonRef.current) {
        const button = toggleButtonRef.current;
        const rect = button.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        // Calculate the maximum distance from button to any corner
        const maxDistance = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );

        // Apply custom animation
        transition.ready.then(() => {
          document.documentElement.style.setProperty('--x', `${x}px`);
          document.documentElement.style.setProperty('--y', `${y}px`);
          document.documentElement.style.setProperty('--r', `${maxDistance}px`);
        });
      }
    } else {
      // Fallback for browsers without View Transitions API
      setIsDarkMode(newMode);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, toggleButtonRef }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
