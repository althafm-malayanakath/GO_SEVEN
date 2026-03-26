'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { getEffectivePrice, isDiscountActive } from '@/lib/discount';

export default function CartPage() {
  const { items, removeItem, updateQty, updateVariant, totalItems, totalPrice, clearCart } = useCart();
  const { formatPrice } = useSettings();

  const tax = totalPrice * 0.08;
  const shipping = totalPrice > 150 ? 0 : 12.99;
  const orderTotal = totalPrice + tax + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center">
        <ShoppingBag size={64} className="text-purple-200 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-white/80 mb-8">Add some pieces to get started.</p>
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-dark transition-colors"
        >
          Shop Collections <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black mb-2">Your Cart</h1>
        <p className="text-white/80 mb-10">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => {
                const img = item.product.images[0]?.url || 'https://placehold.co/200x200/6A0DAD/fff?text=G7';
                return (
                  <motion.div
                    key={item.cartKey}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex gap-5 p-5 rounded-2xl border border-purple-200/80 bg-white text-black"
                  >
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0">
                      <Image src={img} alt={item.product.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <Link href={`/product/${item.product._id}`} className="font-bold hover:text-primary transition-colors line-clamp-1">
                          {item.product.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.cartKey || item.product._id)}
                          className="text-black/35 hover:text-red-500 transition-colors shrink-0"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Size selector */}
                      {item.product.sizes?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.product.sizes.map((s) => (
                            <button
                              key={s}
                              onClick={() => updateVariant(item.cartKey || item.product._id, s, item.color)}
                              className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border transition-colors ${
                                item.size === s
                                  ? 'border-primary bg-primary text-white'
                                  : 'border-purple-200 text-black/60 hover:border-primary'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Color selector */}
                      {item.product.colors?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {item.product.colors.map((c) => (
                            <button
                              key={c.name}
                              title={c.name}
                              onClick={() => updateVariant(item.cartKey || item.product._id, item.size, c.name)}
                              className={`w-5 h-5 rounded-full border-2 transition-all ${
                                item.color === c.name ? 'border-primary scale-125' : 'border-purple-200'
                              }`}
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 border border-purple-200 rounded-full px-3 py-1 text-sm">
                          <button
                            onClick={() =>
                              item.qty > 1
                                ? updateQty(item.cartKey || item.product._id, item.qty - 1)
                                : removeItem(item.cartKey || item.product._id)
                            }
                            className="font-bold"
                          >-</button>
                          <span className="w-6 text-center">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.cartKey || item.product._id, item.qty + 1)}
                            className="font-bold"
                          >+</button>
                        </div>
                        <div className="text-right">
                          {isDiscountActive(item.product) ? (
                            <>
                              <span className="font-extrabold text-red-500">
                                {formatPrice(getEffectivePrice(item.product) * item.qty)}
                              </span>
                              <span className="block text-xs line-through text-black/40">
                                {formatPrice(item.product.price * item.qty)}
                              </span>
                            </>
                          ) : (
                            <span className="font-extrabold text-primary">
                              {formatPrice(item.product.price * item.qty)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <button
              onClick={clearCart}
              className="text-sm text-white/70 hover:text-red-200 transition-colors mt-4"
            >
              Clear cart
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 rounded-3xl border border-purple-200/80 bg-white text-black">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-black/60">Subtotal</span>
                  <span className="font-semibold">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Shipping</span>
                  <span className="font-semibold">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Tax (8%)</span>
                  <span className="font-semibold">{formatPrice(tax)}</span>
                </div>
                <div className="border-t border-purple-100 pt-3 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(orderTotal)}</span>
                </div>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-black/60 mb-4">
                  Add {formatPrice(150 - totalPrice)} more for free shipping
                </p>
              )}
              <Link
                href="/checkout"
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-full font-bold hover:bg-primary-dark transition-colors"
              >
                Checkout <ArrowRight size={18} />
              </Link>
              <Link
                href="/collections"
                className="w-full flex items-center justify-center mt-3 text-sm text-black/60 hover:text-primary transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
