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
  size_chart?: any[];
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

export const getProductImage = (imageUrl: string): string => {
  return imageUrl;
};
