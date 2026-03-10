import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

const About = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <CartDrawer />
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 pb-20">
      <h1 className="luxury-heading text-3xl sm:text-4xl tracking-[0.15em] text-center mb-4">About Us</h1>
      <div className="w-12 h-px bg-foreground mx-auto mb-10" />

      <div className="space-y-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
        <p>
          Welcome to <strong className="text-foreground">HIGHLIGHTS</strong> — a contemporary clothing brand rooted in Bangladesh, dedicated to delivering premium-quality fashion for the modern individual.
        </p>
        <p>
          Founded with a passion for style and craftsmanship, we curate collections that blend timeless elegance with current trends. Every piece is thoughtfully designed and crafted using high-quality fabrics to ensure comfort, durability, and a perfect fit.
        </p>
        <p>
          Our mission is simple: to make you look and feel your best. Whether it's everyday essentials or statement pieces, HIGHLIGHTS offers a versatile range of menswear including shirts, t-shirts, polos, panjabis, jackets, and more.
        </p>
        <p>
          We believe fashion should be accessible, and that quality should never be compromised. With a commitment to exceptional customer service and fast nationwide delivery, we strive to create a seamless shopping experience from start to finish.
        </p>
        <p className="text-foreground font-medium">
          HIGHLIGHTS — Where Style Meets Substance.
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default About;
