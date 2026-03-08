import { Link } from 'react-router-dom';
import heroBanner from '@/assets/hero-banner.jpg';

const Hero = () => {
  return (
    <section className="relative w-full h-[70vh] sm:h-[85vh] overflow-hidden">
      <img src={heroBanner} alt="HIGHLIGHTS Fashion Collection" className="w-full h-full object-cover object-top" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <h1 className="luxury-heading text-6xl sm:text-8xl lg:text-9xl tracking-[0.2em] text-background font-light animate-fade-in">
          JOURNEY
        </h1>
        <p className="luxury-body text-background/80 mt-4 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Spring / Summer 2026
        </p>
        <Link to="/?category=All" className="luxury-button-outline border-background/80 text-background hover:bg-background hover:text-foreground animate-slide-up" style={{ animationDelay: '0.4s' }}>
          Shop Now
        </Link>
      </div>
    </section>
  );
};

export default Hero;
