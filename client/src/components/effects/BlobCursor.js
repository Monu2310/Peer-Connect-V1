import React, { useEffect, useState, useRef } from 'react';
import './BlobCursor.css';
import { useTheme } from '../../contexts/ThemeContext';

const BlobCursor = ({ fillColor }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trailPositions, setTrailPositions] = useState([]);
  const [clicked, setClicked] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(false);
  const { isDarkMode } = useTheme();
  const particlesRef = useRef([]);
  const requestRef = useRef();

  // Dynamically determine cursor color based on theme
  const cursorColor = isDarkMode 
    ? 'rgba(66, 153, 225, 0.6)' // Blue for dark mode
    : fillColor || 'rgba(34, 139, 230, 0.6)'; // Default blue for light mode

  useEffect(() => {
    // Set CSS variable for cursor color to be used in animations
    document.documentElement.style.setProperty('--cursor-color', cursorColor);
    
    const mouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      // Update trail positions
      setTrailPositions(prev => {
        const newPositions = [...prev, { x: e.clientX, y: e.clientY }];
        // Keep only the last 5 positions for the trail
        if (newPositions.length > 5) {
          return newPositions.slice(newPositions.length - 5);
        }
        return newPositions;
      });
    };

    const mouseDown = (e) => {
      setClicked(true);
      createParticles(e.clientX, e.clientY);
      
      setTimeout(() => {
        setClicked(false);
      }, 500);
    };

    const linkHoverIn = () => {
      setHoveredLink(true);
    };
    
    const linkHoverOut = () => {
      setHoveredLink(false);
    };
    
    // Add event listeners
    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mousedown', mouseDown);
    
    // Add event listeners to all links and buttons
    const links = document.querySelectorAll('a, button, .cursor-pointer');
    links.forEach((link) => {
      link.addEventListener('mouseenter', linkHoverIn);
      link.addEventListener('mouseleave', linkHoverOut);
    });
    
    return () => {
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mousedown', mouseDown);
      
      links.forEach((link) => {
        link.removeEventListener('mouseenter', linkHoverIn);
        link.removeEventListener('mouseleave', linkHoverOut);
      });

      cancelAnimationFrame(requestRef.current);
    };
  }, [cursorColor]);
  
  useEffect(() => {
    // Re-add event listeners when the DOM changes
    const linkHoverIn = () => setHoveredLink(true);
    const linkHoverOut = () => setHoveredLink(false);
    
    const observer = new MutationObserver(() => {
      const links = document.querySelectorAll('a, button, .cursor-pointer');
      links.forEach((link) => {
        link.addEventListener('mouseenter', linkHoverIn);
        link.addEventListener('mouseleave', linkHoverOut);
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  // Create particles on click
  const createParticles = (x, y) => {
    const particleCount = 10;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Random values for particle animation
      const size = Math.random() * 8 + 3;
      const speedX = (Math.random() - 0.5) * 80;
      const speedY = (Math.random() - 0.5) * 80;
      const opacity = Math.random() * 0.3 + 0.7;
      
      particles.push({
        id: `particle-${Date.now()}-${i}`,
        x,
        y,
        size,
        speedX,
        speedY,
        opacity,
        color: cursorColor,
        createdAt: Date.now()
      });
    }
    
    particlesRef.current = [...particlesRef.current, ...particles];
    
    // Start animation if it's not already running
    if (!requestRef.current) {
      animateParticles();
    }
  };
  
  // Animate particles
  const animateParticles = () => {
    const now = Date.now();
    particlesRef.current = particlesRef.current.filter(p => {
      return now - p.createdAt < 1000; // Remove particles after 1 second
    });
    
    requestRef.current = requestAnimationFrame(animateParticles);
    
    if (particlesRef.current.length === 0) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
    }
  };

  return (
    <>
      {/* Main cursor blob */}
      <div
        className={`cursor-blob ${clicked ? 'expand' : ''} ${
          hoveredLink ? 'hovering' : ''
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      ></div>
      
      {/* Cursor trail */}
      {trailPositions.map((pos, index) => (
        <div
          key={`trail-${index}`}
          className="cursor-trail"
          style={{
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            opacity: 0.5 - index * 0.1,
            width: `${12 - index * 2}px`,
            height: `${12 - index * 2}px`
          }}
        ></div>
      ))}
      
      {/* Particles container */}
      <div className="particles-container">
        {particlesRef.current.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              backgroundColor: particle.color,
              '--tx': `${particle.speedX}px`,
              '--ty': `${particle.speedY}px`,
              animation: 'floatParticle 1s ease-out forwards'
            }}
          ></div>
        ))}
      </div>
    </>
  );
};

export default BlobCursor;