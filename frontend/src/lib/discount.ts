import { Product } from './api';

export function isDiscountActive(product: Product): boolean {
  if (!product.discount || product.discount <= 0) return false;
  if (!product.discountEndsAt) return false;
  return new Date(product.discountEndsAt) > new Date();
}

export function getEffectivePrice(product: Product): number {
  if (!isDiscountActive(product)) return product.price;
  return Math.round(product.price * (1 - product.discount! / 100) * 100) / 100;
}
