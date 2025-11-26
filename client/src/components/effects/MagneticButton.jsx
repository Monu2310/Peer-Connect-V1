import React from 'react';

/**
 * Magnetic Button Component
 * Button stays fixed, no movement - just hover effects
 */
const MagneticButton = ({ children, strength = 0.4, ...props }) => {
  return (
    <div className="inline-block"
    >
      {React.cloneElement(children, {
        ...props,
        className: `${children.props.className || ''} transition-all duration-300`,
      })}
    </div>
  );
};

export default MagneticButton;
