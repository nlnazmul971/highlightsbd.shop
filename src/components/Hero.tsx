import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import heroSlide1 from '@/assets/hero-slide-1.jpg';
import heroSlide2 from '@/assets/hero-slide-2.jpg';
import heroSlide3 from '@/assets/hero-slide-3.jpg';

const slides = [
  {
    image: heroSlide1,
    title: 'Friends',
    topText: 'They laughed without reason. Shared tea, shared secrets.\nAnd in every frame, their style spoke louder than words.',
    bottomText: 'Shared smiles, shared silence, shared dreams.\nIn every glance, their spirit was timeless,\nand beautifully.',
  },
  {
    image: heroSlide2,
    title: 'Elegance',
    topText: 'A man of substance, dressed in purpose.\nEvery thread tells a story of confidence.',
    bottomText: 'Walk with pride, dress with intention.\nThe modern gentleman arrives.',
  },
  {
    image: heroSlide3,
    title: 'Journey',
    topText: 'Two roads, one destination.\nStyle that moves with the seasons.',
    bottomText: 'Winter warmth, summer soul.\nEvery step a statement.',
  },
];

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="relative w-full h-[85vh] sm:h-screen overflow-hidden bg-muted">
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={s.image}
            alt={`HIGHLIGHTS ${s.title} Collection`}
            className="w-full h-full object-cover object-center"
          />
        </div>
      ))}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/10 via-transparent to-foreground/20" />

      {/* Large background title */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1
          className="luxury-heading text-[18vw] sm:text-[14vw] lg:text-[12vw] leading-none text-background/20 font-light tracking-[0.1em] select-none transition-all duration-700"
          style={{ mixBlendMode: 'overlay' }}
        >
          {slide.title}
        </h1>
      </div>

      {/* Top right poetic text */}
      <div className="absolute top-[15%] right-4 sm:right-10 max-w-[220px] sm:max-w-xs text-right animate-fade-in">
        <p className="text-[10px] sm:text-xs text-background/80 leading-relaxed whitespace-pre-line" style={{ fontFamily: 'var(--font-body)' }}>
          {slide.topText}
        </p>
      </div>

      {/* Bottom left poetic text */}
      <div className="absolute bottom-[12%] left-4 sm:left-10 max-w-[220px] sm:max-w-xs animate-fade-in">
        <p className="text-[10px] sm:text-xs text-background/80 leading-relaxed whitespace-pre-line" style={{ fontFamily: 'var(--font-body)' }}>
          {slide.bottomText}
        </p>
      </div>

      {/* Navigation arrows removed */}

      {/* Dots indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((_, i) => (
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
    </section>
  );
};

export default Hero;
