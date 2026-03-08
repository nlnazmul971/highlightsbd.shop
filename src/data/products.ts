import tshirtBlack from '@/assets/products/tshirt-black.jpg';
import shirtWhite from '@/assets/products/shirt-white.jpg';
import poloNavy from '@/assets/products/polo-navy.jpg';
import pantBeige from '@/assets/products/pant-beige.jpg';
import jacketGrey from '@/assets/products/jacket-grey.jpg';
import panjabiDark from '@/assets/products/panjabi-dark.jpg';
import kafsuElegant from '@/assets/products/kafsu-elegant.jpg';

export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  stock: number;
  featured: boolean;
  reviews: { name: string; rating: number; comment: string; date: string }[];
};

export const products: Product[] = [
  {
    id: '1', name: 'Essential Crew Neck Tee', price: 2490, originalPrice: 2990,
    image: tshirtBlack, category: 'T-Shirt',
    description: 'Crafted from premium Supima cotton, this essential crew neck tee offers unparalleled softness and a refined silhouette. Perfect for layering or wearing on its own.',
    sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'Black', hex: '#1a1a1a' }, { name: 'White', hex: '#f5f5f5' }],
    stock: 45, featured: true,
    reviews: [{ name: 'Rafiq A.', rating: 5, comment: 'Perfect fit and amazing quality.', date: '2026-02-15' }],
  },
  {
    id: '2', name: 'Oxford Slim Fit Shirt', price: 3990,
    image: shirtWhite, category: 'Shirts',
    description: 'A timeless oxford shirt tailored for the modern gentleman. Crafted from fine Egyptian cotton with mother-of-pearl buttons.',
    sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'White', hex: '#ffffff' }, { name: 'Sky Blue', hex: '#87CEEB' }],
    stock: 30, featured: true,
    reviews: [{ name: 'Kamal M.', rating: 5, comment: 'Impeccable tailoring.', date: '2026-01-20' }],
  },
  {
    id: '3', name: 'Merino Knit Polo', price: 4490,
    image: poloNavy, category: 'Knit Polos',
    description: 'Luxuriously soft merino wool polo with a refined texture. The perfect bridge between casual and smart.',
    sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'Navy', hex: '#1B2A4A' }, { name: 'Charcoal', hex: '#36454F' }],
    stock: 25, featured: true,
    reviews: [{ name: 'Hassan R.', rating: 4, comment: 'Great quality knit.', date: '2026-02-01' }],
  },
  {
    id: '4', name: 'Tailored Chino Trouser', price: 3490,
    image: pantBeige, category: 'Pant',
    description: 'Expertly tailored chinos with a modern slim fit. Made from premium stretch cotton twill for all-day comfort.',
    sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'Beige', hex: '#C8AD7F' }, { name: 'Olive', hex: '#556B2F' }],
    stock: 35, featured: true,
    reviews: [{ name: 'Imran K.', rating: 5, comment: 'Best chinos I have owned.', date: '2026-01-10' }],
  },
  {
    id: '5', name: 'Insulated Performance Jacket', price: 8990, originalPrice: 10990,
    image: jacketGrey, category: 'Winter',
    description: 'Engineered for the modern urban explorer. Premium insulated jacket with water-resistant outer shell and thermal core.',
    sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'Charcoal', hex: '#36454F' }, { name: 'Black', hex: '#1a1a1a' }],
    stock: 15, featured: true,
    reviews: [{ name: 'Tariq S.', rating: 5, comment: 'Incredible warmth without the bulk.', date: '2026-02-20' }],
  },
  {
    id: '6', name: 'Premium Noir Panjabi', price: 5990,
    image: panjabiDark, category: 'Panjabi',
    description: 'An elevated take on the traditional panjabi. Crafted from luxurious cotton silk blend with mandarin collar detailing.',
    sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'Black', hex: '#1a1a1a' }, { name: 'Navy', hex: '#1B2A4A' }],
    stock: 20, featured: true,
    reviews: [{ name: 'Shuvo D.', rating: 5, comment: 'Elegant and comfortable.', date: '2026-01-25' }],
  },
  {
    id: '7', name: 'Heritage Embroidered Kafsu', price: 6990,
    image: kafsuElegant, category: 'Kafsu',
    description: 'A luxurious kafsu robe featuring intricate heritage embroidery. Made from breathable premium linen blend.',
    sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'Cream', hex: '#FFFDD0' }, { name: 'Sand', hex: '#C2B280' }],
    stock: 10, featured: true,
    reviews: [{ name: 'Nabil F.', rating: 5, comment: 'Stunning craftsmanship.', date: '2026-02-10' }],
  },
  {
    id: '8', name: 'Relaxed Fit Premium Tee', price: 1990,
    image: tshirtBlack, category: 'T-Shirt',
    description: 'Oversized relaxed fit tee in heavyweight cotton. A wardrobe essential with a contemporary edge.',
    sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'Slate', hex: '#708090' }],
    stock: 50, featured: false,
    reviews: [],
  },
];

export const categories = ['All', 'T-Shirt', 'Winter', 'Shirts', 'Knit Polos', 'Pant', 'Panjabi', 'Kafsu'];
