export function getCartItemKey(productId: string, size?: string, color?: string) {
  return [productId, size || 'no-size', color || 'no-color'].join('::');
}
