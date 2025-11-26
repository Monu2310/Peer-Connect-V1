import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Dynamic Animated Background
 * Creates a mesmerizing gradient mesh that follows the cursor
 */
const DynamicBackground = () => {
  const canvasRef = useRef(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const targetPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse position
    const handleMouseMove = (e) => {
      targetPosition.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Smooth mouse following
    const lerp = (start, end, factor) => start + (end - start) * factor;

    // Animation loop
    const animate = () => {
      time += 0.005;

      // Smooth cursor following
      mousePosition.current.x = lerp(mousePosition.current.x, targetPosition.current.x, 0.05);
      mousePosition.current.y = lerp(mousePosition.current.y, targetPosition.current.y, 0.05);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create gradient mesh
      const gradient = ctx.createRadialGradient(
        mousePosition.current.x,
        mousePosition.current.y,
        0,
        mousePosition.current.x,
        mousePosition.current.y,
        Math.max(canvas.width, canvas.height) * 0.8
      );

      // Sage green to cream gradient (light mode colors)
      gradient.addColorStop(0, 'rgba(163, 176, 135, 0.15)'); // Sage green
      gradient.addColorStop(0.5, 'rgba(200, 210, 150, 0.08)');
      gradient.addColorStop(1, 'rgba(255, 248, 212, 0)'); // Cream

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw floating orbs
      drawOrb(ctx, 
        canvas.width * 0.2 + Math.sin(time) * 100, 
        canvas.height * 0.3 + Math.cos(time * 0.8) * 80, 
        150, 
        'rgba(163, 176, 135, 0.1)'
      );
      
      drawOrb(ctx, 
        canvas.width * 0.8 + Math.cos(time * 1.2) * 120, 
        canvas.height * 0.6 + Math.sin(time * 0.9) * 90, 
        200, 
        'rgba(200, 210, 150, 0.08)'
      );

      drawOrb(ctx, 
        canvas.width * 0.5 + Math.sin(time * 0.7) * 80, 
        canvas.height * 0.8 + Math.cos(time * 1.1) * 70, 
        120, 
        'rgba(163, 176, 135, 0.12)'
      );

      animationFrameId = requestAnimationFrame(animate);
    };

    const drawOrb = (ctx, x, y, radius, color) => {
      const orbGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      orbGradient.addColorStop(0, color);
      orbGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = orbGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'normal', opacity: 0.6 }}
    />
  );
};

export default DynamicBackground;
