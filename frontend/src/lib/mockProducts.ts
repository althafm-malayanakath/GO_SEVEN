import { Product } from './api';

export const MOCK_PRODUCTS: Product[] = [
  {
    _id: 'mock-001',
    name: 'Seven Classic Tee',
    description:
      'The foundation of the Go Seven wardrobe. A heavyweight 100% cotton blank crafted for those who move with intention. Clean silhouette, zero compromise.',
    price: 65,
    category: 'T-Shirts',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Onyx Black', hex: '#1a1a1a' },
      { name: 'Ivory White', hex: '#f5f5f0' },
      { name: 'Royal Purple', hex: '#6A0DAD' },
    ],
    stock: 100,
    images: [
      { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=700&fit=crop&auto=format' },
    ],
    rating: 4.8,
    numReviews: 124,
    isNewArrival: false,
    isFeatured: true,
  },
  {
    _id: 'mock-002',
    name: 'Seven Logo Drop Tee',
    description:
      'Our signature oversized drop-shoulder graphic tee. Screen-printed "GO SEVEN" chest logo on a washed cotton base. Limited availability — built for the culture.',
    price: 85,
    category: 'T-Shirts',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Washed Purple', hex: '#4C1D95' },
      { name: 'Stone Grey', hex: '#6b7280' },
    ],
    stock: 60,
    images: [
      { url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&h=700&fit=crop&auto=format' },
    ],
    rating: 4.9,
    numReviews: 87,
    isNewArrival: true,
    isFeatured: true,
  },
];
