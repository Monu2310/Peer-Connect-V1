import React, { useState, useRef, useEffect } from 'react';

const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  placeholder = 'blur',
  quality = 85,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef();

  // Generate optimized image sources
  const generateSrcSet = (baseSrc) => {
    if (!baseSrc) return '';
    
    const widths = [640, 768, 1024, 1280, 1536];
    return widths
      .map(w => `${baseSrc}?w=${w}&q=${quality} ${w}w`)
      .join(', ');
  };

  // Create WebP version if supported
  const createWebPSrc = (baseSrc) => {
    if (!baseSrc) return baseSrc;
    
    // Check if browser supports WebP
    const supportsWebP = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    };

    if (supportsWebP() && process.env.REACT_APP_WEBP_ENABLED === 'true') {
      return baseSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    
    return baseSrc;
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current || loading !== 'lazy') {
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, loading]);

  const handleLoad = () => {
    setImageLoaded(true);
  };

  const handleError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  // Placeholder styles
  const placeholderStyle = {
    backgroundColor: '#f3f4f6',
    backgroundImage: placeholder === 'blur' 
      ? 'linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)'
      : 'none',
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    animation: !imageLoaded ? 'pulse 2s infinite' : 'none',
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width || 'auto',
        height: height || 'auto',
        ...(!imageLoaded ? placeholderStyle : {}),
      }}
    >
      {imageSrc && !imageError && (
        <picture>
          {/* WebP source for modern browsers */}
          <source
            srcSet={generateSrcSet(createWebPSrc(imageSrc))}
            type="image/webp"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          />
          {/* Fallback to original format */}
          <img
            src={imageSrc}
            srcSet={generateSrcSet(imageSrc)}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            onLoad={handleLoad}
            onError={handleError}
            className={`transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
            }}
            {...props}
          />
        </picture>
      )}
      
      {imageError && (
        <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500">
          <span>Failed to load image</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
