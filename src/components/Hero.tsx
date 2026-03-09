import { useState, useEffect, useCallback } from 'react';
import { useStoreSettings } from '@/hooks/useSupabase';

const Hero = () => {
  const { data: settings = {} } = useStoreSettings();
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const rawSlides = settings['hero_slides'];
  const slides = rawSlides ? JSON.parse(rawSlides) : [];

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo, slides.length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <section className="relative w-full overflow-hidden">
      {slides.map((s: any, i: number) => (
        <picture
          key={i}
          className={`block w-full transition-opacity duration-700 ${i === current ? 'opacity-100 relative' : 'opacity-0 absolute inset-0'}`}
        >
          <source media="(max-width: 767px)" srcSet={s.mobileImage || s.image} />
          <img
            src={s.image}
            alt={`HIGHLIGHTS ${s.title} Collection`}
            className="w-full h-auto block"
          />
        </picture>
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-foreground/10 via-transparent to-foreground/20 pointer-events-none" />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1
          className="luxury-heading text-[18vw] sm:text-[14vw] lg:text-[12vw] leading-none text-background/20 font-light tracking-[0.1em] select-none transition-all duration-700"
          style={{ mixBlendMode: 'overlay' }}
        >
          {slide.title}
        </h1>
      </div>

      {slide.topText && (
        <div className="absolute top-[15%] right-4 sm:right-10 max-w-[220px] sm:max-w-xs text-right animate-fade-in">
          <p className="text-[10px] sm:text-xs text-background/80 leading-relaxed whitespace-pre-line" style={{ fontFamily: 'var(--font-body)' }}>
            {slide.topText}
          </p>
        </div>
      )}

      {slide.bottomText && (
        <div className="absolute bottom-[12%] left-4 sm:left-10 max-w-[220px] sm:max-w-xs animate-fade-in">
          <p className="text-[10px] sm:text-xs text-background/80 leading-relaxed whitespace-pre-line" style={{ fontFamily: 'var(--font-body)' }}>
            {slide.bottomText}
          </p>
        </div>
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {slides.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current ? 'bg-background w-6' : 'bg-background/40'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;
