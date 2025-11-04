import React, { useState, useEffect } from 'react';

/**
 * Optimized Image Component
 * Supports:
 * - Lazy loading with IntersectionObserver
 * - WebP format with fallback
 * - Responsive images
 * - Blur-up effect
 * - Error boundaries
 */
const OptimizedImage = React.memo(({
  src,
  alt,
  width,
  height,
  className = '',
  onLoad,
  onError,
  quality = 75,
  placeholder = null,
  sizes = null
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = React.useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Image is in viewport, load it
            loadImage();
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' } // Start loading 50px before entering viewport
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  const loadImage = () => {
    // Try to load WebP first, fallback to original
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(img.src);
      setIsLoading(false);
      setError(false);
      onLoad?.();
    };

    img.onerror = () => {
      // If WebP fails, try original format
      if (src !== img.src) {
        img.src = src;
      } else {
        setError(true);
        setIsLoading(false);
        onError?.();
      }
    };

    // Try WebP format first
    const webpSrc = src.replace(/\.\w+$/, '.webp');
    img.src = webpSrc;
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-gray-200 ${className}`}
      style={{
        aspectRatio: width && height ? `${width}/${height}` : 'auto',
        width: width || '100%',
        height: height || 'auto'
      }}
    >
      {/* Loading skeleton */}
      {isLoading && placeholder && (
        <img
          src={placeholder}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
          loading="lazy"
        />
      )}

      {/* Main image */}
      {imageSrc && !error && (
        <img
          src={imageSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
          sizes={sizes}
          width={width}
          height={height}
        />
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-300 text-gray-500">
          <span className="text-sm">Failed to load image</span>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && !placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="animate-pulse w-full h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"></div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.src === nextProps.src &&
    prevProps.alt === nextProps.alt &&
    prevProps.className === nextProps.className
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
