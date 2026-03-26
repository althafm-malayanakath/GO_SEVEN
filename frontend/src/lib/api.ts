import { clearStoredAuth, getStoredToken } from './authStorage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options?.headers);
  const isFormDataBody = typeof FormData !== 'undefined' && options?.body instanceof FormData;

  if (!isFormDataBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    if (res.status === 401) {
      clearStoredAuth();
    }
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

function buildQuery(params?: ProductQuery) {
  if (!params) {
    return '';
  }

  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

export const api = {
  // Auth
  register: (data: { name: string; email: string; phone: string; password: string; whatsappOptIn: boolean }) =>
    request<AuthResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () =>
    request<UserProfile>('/users/profile'),

  updateProfile: (data: { name?: string; email?: string; phone?: string; password?: string; whatsappOptIn?: boolean }) =>
    request<AuthResponse>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Products
  getProducts: (params?: ProductQuery) => request<Product[]>(`/products${buildQuery(params)}`),

  getProduct: (id: string) => request<Product>(`/products/${id}`),

  createProduct: (data: ProductInput) =>
    request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, data: ProductInput) =>
    request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string) =>
    request<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),

  uploadProductImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    return request<UploadedAsset>('/uploads/images', {
      method: 'POST',
      body: formData,
    });
  },

  // Orders
  createOrder: (data: OrderPayload) =>
    request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),

  getMyOrders: () => request<Order[]>('/orders/myorders'),

  getOrder: (id: string) => request<Order>(`/orders/${id}`),

  getOrders: () => request<Order[]>('/orders'),

  updateOrderStatus: (id: string, status: OrderStatus) =>
    request<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Reviews
  getReviews: (productId: string) =>
    request<ReviewsResponse>(`/products/${productId}/reviews`),

  createReview: (productId: string, data: { rating: number; comment: string }) =>
    request<{ message: string }>(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Settings
  getSettings: () => request<AppSettings>('/settings'),

  updateSettings: (data: Partial<AppSettings>) =>
    request<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export interface AuthResponse {
  token: string;
  _id: string;
  name: string;
  email: string;
  phone: string;
  whatsappOptIn: boolean;
  role: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  whatsappOptIn: boolean;
  role: string;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  category: string;
  sizes: string[];
  colors: ProductColor[];
  stock: number;
  images: ProductImage[];
  model3D?: ProductAsset | null;
  isNewArrival: boolean;
  isFeatured: boolean;
  discount?: number;
  discountEndsAt?: string | null;
}

export interface ProductQuery {
  category?: string;
  search?: string;
  sort?: string;
  featured?: string;
  new?: string;
}

export interface ProductImage {
  url: string;
  public_id?: string;
}

export interface ProductAsset {
  url: string;
  public_id?: string;
}

export interface UploadedAsset extends ProductAsset {
  storage: 'local' | 'cloudinary';
  originalName: string;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  _id: string;
  user?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sizes: string[];
  colors: ProductColor[];
  stock: number;
  images: ProductImage[];
  model3D?: ProductAsset | null;
  rating: number;
  numReviews: number;
  isNewArrival: boolean;
  isFeatured: boolean;
  discount?: number;
  discountEndsAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  cartKey?: string;
  product: Product;
  qty: number;
  size?: string;
  color?: string;
}

export interface OrderPayload {
  orderItems: { name: string; qty: number; image: string; price: number; product: string; size?: string; color?: string }[];
  shippingAddress: { address: string; city: string; postalCode: string; country: string };
  customerPhone: string;
  whatsappOptIn: boolean;
  paymentMethod: string;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
}

export interface Order {
  _id: string;
  orderItems: { name: string; qty: number; image: string; price: number; product: string; size?: string; color?: string }[];
  customerName: string;
  customerPhone: string;
  whatsappOptIn: boolean;
  shippingAddress: { address: string; city: string; postalCode: string; country: string };
  paymentMethod: string;
  itemsPrice?: number;
  taxPrice?: number;
  shippingPrice?: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  status: string;
  createdAt: string;
  user?: { _id?: string; name: string; email: string };
  notifications?: {
    customer?: {
      attempted: boolean;
      sent: boolean;
      sid?: string;
      error?: string;
      sentAt?: string;
    };
    admin?: {
      attempted: boolean;
      sent: boolean;
      sid?: string;
      error?: string;
      sentAt?: string;
    };
  };
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Review {
  _id: string;
  user: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  numReviews: number;
  rating: number;
}

export interface AppSettings {
  currency: string;
  currencySymbol: string;
}
