import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  style?: React.CSSProperties;
}

const OptimizedImage = ({ src, alt, className = '', loading = 'lazy', style }: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(loading === 'eager');
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading === 'eager') { setInView(true); return; }
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading]);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={style}>
      {/* Blur placeholder background */}
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {inView && (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};

export default OptimizedImage;