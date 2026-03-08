// Product types matching the database schema
export type ProductColor = { name: string; hex: string };

export type Product = {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string;
  category: string;
  description: string;
  sizes: string[];
  colors: ProductColor[];
  stock: number;
  featured: boolean;
  brand: string;
  sku: string;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string | null;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export const categories = ['All', 'New Dropped', 'T-Shirt', 'Winter', 'Shirts', 'Knit Polos', 'Pant', 'Panjabi', 'Kafsu'];

// Map local assets to DB image_url paths for fallback
import tshirtBlack from '@/assets/products/tshirt-black.jpg';
import shirtWhite from '@/assets/products/shirt-white.jpg';
import poloNavy from '@/assets/products/polo-navy.jpg';
import pantBeige from '@/assets/products/pant-beige.jpg';
import jacketGrey from '@/assets/products/jacket-grey.jpg';
import panjabiDark from '@/assets/products/panjabi-dark.jpg';
import kafsuElegant from '@/assets/products/kafsu-elegant.jpg';

export const localImageMap: Record<string, string> = {
  '/products/tshirt-black.jpg': tshirtBlack,
  '/products/shirt-white.jpg': shirtWhite,
  '/products/polo-navy.jpg': poloNavy,
  '/products/pant-beige.jpg': pantBeige,
  '/products/jacket-grey.jpg': jacketGrey,
  '/products/panjabi-dark.jpg': panjabiDark,
  '/products/kafsu-elegant.jpg': kafsuElegant,
};

export const getProductImage = (imageUrl: string): string => {
  return localImageMap[imageUrl] || imageUrl;
};
