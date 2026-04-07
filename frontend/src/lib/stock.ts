export type StockStatus = 'out' | 'critical' | 'low' | 'available';

export interface StockInfo {
  status: StockStatus;
  label: string;
  show: boolean;
}

export function getStockInfo(stock: number): StockInfo {
  const safeStock = Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0;

  if (safeStock <= 0) return { status: 'out', label: 'Out of Stock', show: true };
  if (safeStock <= 5) return { status: 'critical', label: `Only ${safeStock} left!`, show: true };
  if (safeStock <= 15) return { status: 'low', label: 'Low Stock', show: true };

  return { status: 'available', label: 'In Stock', show: false };
}

// Tailwind classes for image-overlay badges (dark bg, used in ProductCard image area)
export const STOCK_BADGE_OVERLAY: Record<StockStatus, string> = {
  out:       'bg-gray-800/90 text-white',
  critical:  'bg-orange-500  text-white',
  low:       'bg-yellow-400  text-black',
  available: '',
};

// Tailwind classes for light-bg inline badges (cart, detail page light areas)
export const STOCK_BADGE_LIGHT: Record<StockStatus, string> = {
  out:       'bg-red-100    text-red-700',
  critical:  'bg-orange-100 text-orange-700',
  low:       'bg-yellow-100 text-yellow-700',
  available: '',
};

// Tailwind classes for dark-bg inline badges (product detail dark sidebar)
export const STOCK_BADGE_DARK: Record<StockStatus, string> = {
  out:       'bg-red-500/20    text-red-300',
  critical:  'bg-orange-500/20 text-orange-300',
  low:       'bg-yellow-500/20 text-yellow-300',
  available: '',
};
