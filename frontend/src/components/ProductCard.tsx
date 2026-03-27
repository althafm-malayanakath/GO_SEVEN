'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShoppingCart, Eye } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/lib/api';
import { isDiscountActive, getEffectivePrice } from '@/lib/discount';
import { useSettings } from '@/context/SettingsContext';
import CountdownTimer from '@/components/CountdownTimer';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const { formatPrice } = useSettings();
  const [added, setAdded] = useState(false);
  const [discountActive, setDiscountActive] = useState(() => isDiscountActive(product));
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name || '');
  const cardRef = useRef<HTMLDivElement>(null);
  const slideshowRef = useRef<number | null>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });
  const glowX = useTransform(rawX, [-0.5, 0.5], [0, 100]);
  const glowY = useTransform(rawY, [-0.5, 0.5], [0, 100]);
  const glowBg = useTransform([glowX, glowY], ([x, y]: number[]) =>
    `radial-gradient(circle at ${x}% ${y}%, rgba(106,13,173,0.18) 0%, transparent 65%)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    if (slideshowRef.current) {
      window.clearInterval(slideshowRef.current);
      slideshowRef.current = null;
    }

    setActiveImage(0);
    rawX.set(0);
    rawY.set(0);
  };

  const handleMouseEnter = () => {
    if (product.images.length <= 1 || slideshowRef.current) {
      return;
    }

    slideshowRef.current = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % product.images.length);
    }, 1800);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1, selectedSize || undefined, selectedColor || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  useEffect(() => () => {
    if (slideshowRef.current) {
      window.clearInterval(slideshowRef.current);
    }
  }, []);

  return (
    <motion.div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
      className="group relative flex h-full min-h-[31rem] flex-col overflow-hidden rounded-2xl border border-purple-200/80 bg-white text-black shadow-sm transition-shadow duration-300 hover:shadow-2xl sm:min-h-[33rem]"
    >
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: glowBg }}
      />

      <motion.div
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        whileTap={{ scale: 0.98 }}
        className="relative h-64 overflow-hidden sm:h-72"
      >
        <Link
          href={`/product/${product._id}/preview`}
          aria-label={`View details for ${product.name}`}
          className="absolute inset-0 block"
        >
          {product.images.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${product.images[activeImage]?.url || 'fallback'}-${activeImage}`}
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: 1, scale: 1.05 }}
                exit={{ opacity: 0, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
              >
                <Image
                  src={product.images[activeImage]?.url || 'https://placehold.co/600x700/6A0DAD/ffffff?text=Go+Seven'}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover"
                  priority={activeImage === 0}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <Image
              src="https://placehold.co/600x700/6A0DAD/ffffff?text=Go+Seven"
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute inset-0 z-30 hidden items-center justify-center gap-4 bg-black/30 opacity-0 transition-opacity duration-300 lg:flex lg:group-hover:opacity-100">
          <button
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className={`pointer-events-auto rounded-full p-3 shadow-lg transition-all active:scale-90 ${
              added ? 'bg-green-500 text-white' : 'bg-white text-primary hover:bg-primary hover:text-white'
            }`}
          >
            <ShoppingCart size={20} />
          </button>
          <Link
            href={`/product/${product._id}/preview`}
            aria-label={`Preview ${product.name}`}
            className="pointer-events-auto rounded-full bg-white p-3 text-primary shadow-lg transition-all active:scale-90 hover:bg-primary hover:text-white"
          >
            <Eye size={20} />
          </Link>
        </div>

        <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2 lg:hidden">
          <Link
            href={`/product/${product._id}/preview`}
            aria-label={`Preview ${product.name}`}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg backdrop-blur-sm transition-transform active:scale-90"
          >
            <Eye size={20} />
          </Link>
          <button
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-transform active:scale-90 ${
              added ? 'bg-green-500 text-white' : 'bg-white/95 text-primary'
            }`}
          >
            <ShoppingCart size={20} />
          </button>
        </div>

        <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm backdrop-blur-md">
            {product.category}
          </span>
          {product.isNewArrival && (
            <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-white shadow-sm">
              NEW
            </span>
          )}
          {discountActive && (
            <span className="rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold text-white shadow-sm">
              {product.discount}% OFF
            </span>
          )}
        </div>
      </motion.div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <Link href={`/product/${product._id}/preview`} className="inline-block">
          <h3 className="min-h-[3.5rem] text-lg font-bold leading-tight transition-colors line-clamp-2 group-hover:text-primary">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 min-h-[6rem]">
          {product.sizes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedSize(size);
                  }}
                  className={`rounded-md border px-3 py-1 text-xs font-semibold transition-colors ${
                    selectedSize === size
                      ? 'border-primary bg-primary text-white'
                      : 'border-purple-200 text-black/60 hover:border-primary'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 min-h-[1.75rem]">
          {product.colors?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <button
                  key={color.name}
                  title={color.name}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedColor(color.name);
                  }}
                  className={`h-5 w-5 rounded-full border-2 transition-all ${
                    selectedColor === color.name ? 'scale-125 border-primary' : 'border-purple-200'
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto flex min-h-[4.75rem] items-end justify-between gap-3 pt-4">
          <div className="min-h-[4.75rem]">
            {discountActive ? (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-red-500">{formatPrice(getEffectivePrice(product))}</span>
                <span className="text-sm text-black/40 line-through">{formatPrice(product.price)}</span>
              </div>
            ) : (
              <span className="text-xl font-extrabold text-primary">{formatPrice(product.price)}</span>
            )}

            {discountActive && product.discountEndsAt && (
              <div className="mt-0.5 flex items-center gap-1">
                <span className="text-xs text-black/50">Ends in</span>
                <CountdownTimer
                  endsAt={product.discountEndsAt}
                  onExpire={() => setDiscountActive(false)}
                  className="text-xs font-mono text-red-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 self-end pb-1">
            <span aria-hidden="true" className="text-yellow-400">&#9733;</span>
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-xs text-black/40">({product.numReviews})</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
