import React from 'react';

/**
 * BeautifulBackground Component
 * 
 * Provides stunning animated orb backgrounds using the Navy/Sage/Cream color palette.
 * Can be used globally on all pages for consistent visual design.
 * 
 * Features:
 * - 4 animated orbs with staggered timings (20s, 25s, 30s, 8s)
 * - Fixed positioning - orbs stay in place during scroll (wallpaper effect)
 * - Consistent placement across all pages
 * - Soft blur filters (80-100px) for sophisticated effect
 * - Beautiful visible gradients (opacity controlled via CSS variables)
 * - Pointer-events-none prevents any interaction interference
 * - Responsive and accessible
 * - z-0 ensures orbs stay behind all content
 * 
 * Usage:
 * <BeautifulBackground>
 *   <div>Your content here</div>
 * </BeautifulBackground>
 */
const BeautifulBackground = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-background relative ${className}`}>
      {/* ELITE Background Orbs - Fixed Position (stays on scroll) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        
        {/* Orb 1: Primary Sage - Top Right - Larger, more visible */}
        <div 
          className="fixed top-0 right-0 w-[700px] h-[700px] rounded-full animate-orb-float-1 translate-x-1/4 -translate-y-1/4"
          style={{
            background: 'radial-gradient(circle, var(--orb-primary), transparent 65%)',
            filter: 'blur(70px)',
          }}
        />
        
        {/* Orb 2: Navy/Accent - Bottom Left - Enhanced visibility */}
        <div 
          className="fixed bottom-0 left-0 w-[650px] h-[650px] rounded-full animate-orb-float-2 -translate-x-1/4 translate-y-1/4"
          style={{
            background: 'radial-gradient(circle, var(--orb-accent), transparent 65%)',
            filter: 'blur(75px)',
          }}
        />
        
        {/* Orb 3: Secondary Slate - Top Center Left - More prominent */}
        <div 
          className="fixed top-1/4 left-1/4 w-[550px] h-[550px] rounded-full animate-orb-float-3"
          style={{
            background: 'radial-gradient(circle, var(--orb-secondary), transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        
        {/* Orb 4: Sage Accent - Bottom Right - Stronger presence */}
        <div 
          className="fixed bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full animate-subtle-glow"
          style={{
            background: 'radial-gradient(circle, var(--orb-primary), transparent 70%)',
            filter: 'blur(65px)',
          }}
        />
        
        {/* Orb 5: Center Ambient - Adds depth */}
        <div 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full animate-orb-float-1"
          style={{
            background: 'radial-gradient(circle, var(--orb-secondary), transparent 75%)',
            filter: 'blur(90px)',
            opacity: 0.6,
          }}
        />
      </div>

      {/* Content Layer - Sits above orbs */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default BeautifulBackground;
