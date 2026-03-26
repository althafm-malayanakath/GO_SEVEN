'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CartItem, Product } from '@/lib/api';
import { getCartItemKey } from '@/lib/cart';
import { getEffectivePrice } from '@/lib/discount';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; qty: number; size?: string; color?: string } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QTY'; payload: { cartKey: string; qty: number } }
  | { type: 'UPDATE_VARIANT'; payload: { cartKey: string; size?: string; color?: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD'; payload: CartItem[] };

function normalizeCartItems(items: CartItem[]): CartItem[] {
  return items.map((item) => ({
    ...item,
    cartKey: item.cartKey || getCartItemKey(item.product._id, item.size, item.color),
  }));
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'LOAD':
      return { items: normalizeCartItems(action.payload) };
    case 'ADD_ITEM': {
      const cartKey = getCartItemKey(action.payload.product._id, action.payload.size, action.payload.color);
      const existing = state.items.find(
        (item) => item.cartKey === cartKey
      );

      if (existing) {
        return {
          items: state.items.map((i) =>
            i.cartKey === cartKey
              ? { ...i, qty: i.qty + action.payload.qty }
              : i
          ),
        };
      }

      return {
        items: [
          ...state.items,
          {
            ...action.payload,
            cartKey,
          },
        ],
      };
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter((item) => item.cartKey !== action.payload) };
    case 'UPDATE_QTY':
      return {
        items: state.items.map((i) =>
          i.cartKey === action.payload.cartKey ? { ...i, qty: action.payload.qty } : i
        ),
      };
    case 'UPDATE_VARIANT': {
      const { cartKey, size, color } = action.payload;
      const item = state.items.find((i) => i.cartKey === cartKey);
      if (!item) return state;
      const newKey = getCartItemKey(item.product._id, size, color);
      if (newKey === cartKey) return state;
      const existingTarget = state.items.find((i) => i.cartKey === newKey);
      if (existingTarget) {
        return {
          items: state.items
            .filter((i) => i.cartKey !== cartKey)
            .map((i) => i.cartKey === newKey ? { ...i, qty: i.qty + item.qty } : i),
        };
      }
      return {
        items: state.items.map((i) =>
          i.cartKey === cartKey ? { ...i, cartKey: newKey, size, color } : i
        ),
      };
    }
    case 'CLEAR_CART':
      return { items: [] };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product, qty?: number, size?: string, color?: string) => void;
  removeItem: (cartKey: string) => void;
  updateQty: (cartKey: string, qty: number) => void;
  updateVariant: (cartKey: string, size?: string, color?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) dispatch({ type: 'LOAD', payload: JSON.parse(stored) });
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const totalItems = state.items.reduce((acc, i) => acc + i.qty, 0);
  const totalPrice = state.items.reduce((acc, i) => acc + getEffectivePrice(i.product) * i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        totalPrice,
        addItem: (product, qty = 1, size, color) =>
          dispatch({ type: 'ADD_ITEM', payload: { product, qty, size, color } }),
        removeItem: (cartKey) => dispatch({ type: 'REMOVE_ITEM', payload: cartKey }),
        updateQty: (cartKey, qty) => dispatch({ type: 'UPDATE_QTY', payload: { cartKey, qty } }),
        updateVariant: (cartKey, size, color) => dispatch({ type: 'UPDATE_VARIANT', payload: { cartKey, size, color } }),
        clearCart: () => dispatch({ type: 'CLEAR_CART' }),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
