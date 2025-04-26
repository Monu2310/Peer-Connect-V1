import { useTrail, animated, useSpring } from '@react-spring/web'
import { useRef, useEffect, useCallback, useState } from 'react';

import './BlobCursor.css';

const fast = { tension: 1200, friction: 40 };
const slow = { mass: 10, tension: 200, friction: 50 };
const trans = (x, y) => `translate3d(${x}px,${y}px,0) translate3d(-50%,-50%,0)`;

export default function BlobCursor({ 
  blobType = 'circle', 
  fillColor = '#1a1a2e', // Dark blue-black color
  hoverScale = 1.5,
  showCursor = true 
}) {
  const [trail, api] = useTrail(3, i => ({
    xy: [0, 0],
    config: i === 0 ? fast : slow,
  }));
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const ref = useRef();
  
  // Animation for click effect
  const clickAnimation = useSpring({
    transform: isClicking ? 'scale(0.8)' : 'scale(1)',
    config: { tension: 300, friction: 10 }
  });
  
  // Animation for hover effect
  const hoverAnimation = useSpring({
    transform: isHovering ? `scale(${hoverScale})` : 'scale(1)',
    config: { tension: 200, friction: 15 }
  });

  // Check if device is mobile
  useEffect(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsMobile(true);
    }
    
    // Add cursor-hidden class to body when cursor is shown
    if (!isMobile && showCursor) {
      document.body.classList.add('cursor-hidden');
    }
    
    return () => {
      document.body.classList.remove('cursor-hidden');
    };
  }, [isMobile, showCursor]);

  // Direct mouse tracking
  const handleMouseMove = useCallback((e) => {
    const x = e.clientX;
    const y = e.clientY;
    setMousePos({ x, y });
    api.start({ xy: [x, y] });
    
    // Check if hovering over clickable elements
    const element = document.elementFromPoint(x, y);
    const isClickable = element && (
      element.tagName === 'BUTTON' || 
      element.tagName === 'A' || 
      element.onclick || 
      element.closest('button') || 
      element.closest('a') ||
      window.getComputedStyle(element).cursor === 'pointer'
    );
    
    setIsHovering(isClickable);
  }, [api]);
  
  // Handle mouse down and up events
  const handleMouseDown = useCallback(() => {
    setIsClicking(true);
  }, []);
  
  const handleMouseUp = useCallback(() => {
    setIsClicking(false);
  }, []);

  // Add global event listeners
  useEffect(() => {
    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [handleMouseMove, handleMouseDown, handleMouseUp, isMobile]);

  // Don't render on mobile
  if (isMobile || !showCursor) {
    return null;
  }

  return (
    <div className='blob-cursor-container'>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="blob">
            <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
            <feColorMatrix
              in="blur"
              values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 30 -7"
            />
          </filter>
        </defs>
      </svg>
      <div
        ref={ref}
        className='blob-cursor-main'
      >
        {trail.map((props, index) => {
          const isMainDot = index === 2;
          
          return (
            <animated.div 
              key={index} 
              style={{
                transform: props.xy.to(trans),
                backgroundColor: fillColor,
                borderRadius: blobType === 'circle' ? '50%' : '30%',
                ...(isMainDot && isClicking ? clickAnimation : {}),
                ...(isMainDot && isHovering ? hoverAnimation : {})
              }} 
            />
          );
        })}
      </div>
    </div>
  );
}