import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Particle Explosion Effect
 * Creates a burst of particles for success actions
 */
const ParticleExplosion = ({ trigger, x = 0, y = 0, color = 'rgb(163, 176, 135)', particleCount = 20 }) => {
  const [particles, setParticles] = useState([]);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (trigger) {
      // Generate particles
      const newParticles = Array.from({ length: particleCount }, (_, i) => {
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 100 + Math.random() * 100;
        const size = 4 + Math.random() * 8;
        
        return {
          id: `${Date.now()}-${i}`,
          angle,
          velocity,
          size,
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity,
        };
      });

      setParticles(newParticles);
      setKey(prev => prev + 1);

      // Clear particles after animation
      setTimeout(() => setParticles([]), 1000);
    }
  }, [trigger, particleCount]);

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{ left: x, top: y }}
    >
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={`${key}-${particle.id}`}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: particle.x,
              y: particle.y,
              opacity: 0,
              scale: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.6 + Math.random() * 0.4,
              ease: 'easeOut',
            }}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: color,
              boxShadow: `0 0 ${particle.size * 2}px ${color}`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ParticleExplosion;
