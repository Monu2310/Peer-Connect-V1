import React from 'react';
import { motion } from 'framer-motion';

const GlowOrb = ({ 
  size = 'medium', 
  color = 'primary', 
  position = 'top-left',
  blur = 'xl',
  opacity = 10,
  animate = true 
}) => {
  const sizeClasses = {
    small: 'w-48 h-48',
    medium: 'w-72 h-72',
    large: 'w-96 h-96',
    xl: 'w-[32rem] h-[32rem]'
  };

  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent',
    sage: 'bg-[#A3B087]',
    navy: 'bg-[#313647]'
  };

  const positionClasses = {
    'top-left': 'top-[10%] left-[5%]',
    'top-right': 'top-[10%] right-[5%]',
    'bottom-left': 'bottom-[10%] left-[5%]',
    'bottom-right': 'bottom-[10%] right-[5%]',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'top-center': 'top-[10%] left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-[10%] left-1/2 -translate-x-1/2'
  };

  const blurClasses = {
    sm: 'blur-sm',
    md: 'blur-md',
    lg: 'blur-lg',
    xl: 'blur-xl',
    '2xl': 'blur-2xl',
    '3xl': 'blur-3xl'
  };

  const baseClasses = `absolute ${sizeClasses[size]} ${colorClasses[color]}/${opacity} ${positionClasses[position]} rounded-full ${blurClasses[blur]} pointer-events-none`;

  if (animate) {
    return (
      <motion.div
        className={baseClasses}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [opacity / 100, opacity / 100 + 0.1, opacity / 100],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    );
  }

  return <div className={baseClasses} />;
};

export default GlowOrb;
