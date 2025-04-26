import React from 'react';
import { motion } from 'framer-motion';

const PageTransition = ({ 
  children, 
  direction = 'up', // 'up', 'down', 'left', 'right'
  type = 'spring', // 'tween', 'spring'
  duration = 0.5,
  delay = 0 
}) => {
  // Define variants based on direction
  const getVariants = () => {
    const distance = 50;
    
    const variants = {
      initial: {},
      animate: {},
      exit: {}
    };
    
    switch (direction) {
      case 'up':
        variants.initial = { opacity: 0, y: distance };
        variants.animate = { opacity: 1, y: 0 };
        variants.exit = { opacity: 0, y: -distance };
        break;
      case 'down':
        variants.initial = { opacity: 0, y: -distance };
        variants.animate = { opacity: 1, y: 0 };
        variants.exit = { opacity: 0, y: distance };
        break;
      case 'left':
        variants.initial = { opacity: 0, x: distance };
        variants.animate = { opacity: 1, x: 0 };
        variants.exit = { opacity: 0, x: -distance };
        break;
      case 'right':
        variants.initial = { opacity: 0, x: -distance };
        variants.animate = { opacity: 1, x: 0 };
        variants.exit = { opacity: 0, x: distance };
        break;
      default:
        variants.initial = { opacity: 0 };
        variants.animate = { opacity: 1 };
        variants.exit = { opacity: 0 };
    }
    
    return variants;
  };
  
  // Get transition config
  const getTransition = () => {
    const base = {
      delay,
    };
    
    if (type === 'spring') {
      return {
        ...base,
        type: 'spring',
        stiffness: 100,
        damping: 15,
        mass: 1
      };
    }
    
    return {
      ...base,
      duration,
      ease: 'easeInOut',
    };
  };

  const variants = getVariants();
  const transition = getTransition();

  return (
    <motion.div
      className="w-full"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={transition}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;