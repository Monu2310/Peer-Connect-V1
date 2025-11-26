import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * 3D Tilt Card Component
 * Cards that respond to mouse position with smooth 3D transforms
 */
const TiltCard = ({ children, className = '', intensity = 15, scale = 1.02, glare = true }) => {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for smooth animations
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring physics for smooth, natural movement
  const springConfig = { damping: 20, stiffness: 300 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]), springConfig);

  const handleMouseMove = (e) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normalize mouse position to -0.5 to 0.5 range
    x.set((e.clientX - centerX) / (rect.width / 2));
    y.set((e.clientY - centerY) / (rect.height / 2));
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      animate={{
        scale: isHovered ? scale : 1,
      }}
      transition={{ duration: 0.3 }}
      className={`relative ${className}`}
    >
      {/* Content */}
      <div style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>

      {/* Glare effect */}
      {glare && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background: useTransform(
              [x, y],
              ([xVal, yVal]) => {
                const angle = Math.atan2(yVal, xVal) * (180 / Math.PI);
                return `radial-gradient(
                  circle at ${(xVal + 0.5) * 100}% ${(yVal + 0.5) * 100}%,
                  rgba(255, 255, 255, 0.15) 0%,
                  transparent 60%
                )`;
              }
            ),
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
};

export default TiltCard;
