import React from 'react';
import { motion } from 'framer-motion';

const FloatingParticles = ({ count = 20, className = '' }) => {
  const particles = Array.from({ length: count });

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((_, index) => {
        const randomDelay = Math.random() * 5;
        const randomDuration = 15 + Math.random() * 10;
        const randomX = Math.random() * 100;
        const randomSize = 2 + Math.random() * 4;
        
        return (
          <motion.div
            key={index}
            className="absolute rounded-full bg-primary/20"
            style={{
              left: `${randomX}%`,
              width: `${randomSize}px`,
              height: `${randomSize}px`,
              top: '100%',
            }}
            animate={{
              y: [0, -window.innerHeight - 100],
              opacity: [0, 0.6, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: randomDuration,
              repeat: Infinity,
              delay: randomDelay,
              ease: "linear"
            }}
          />
        );
      })}
    </div>
  );
};

export default FloatingParticles;
