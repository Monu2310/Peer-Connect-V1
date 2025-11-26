import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Ripple Effect Component
 * Creates expanding ripples on click
 */
const RippleEffect = ({ children, className = '', color = 'rgba(163, 176, 135, 0.4)' }) => {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = {
      id: Date.now(),
      x,
      y,
      size: Math.max(rect.width, rect.height) * 2,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
    }, 600);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
      
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{
              width: 0,
              height: 0,
              opacity: 1,
              x: ripple.x,
              y: ripple.y,
            }}
            animate={{
              width: ripple.size,
              height: ripple.size,
              opacity: 0,
              x: ripple.x - ripple.size / 2,
              y: ripple.y - ripple.size / 2,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute rounded-full pointer-events-none"
            style={{
              backgroundColor: color,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RippleEffect;
