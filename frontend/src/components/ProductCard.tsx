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

  // Tilt motion values
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
      className="group bg-white text-black border border-purple-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-shadow duration-300"
    >
      {/* Glare sheen */}
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: glowBg }}
      />

      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        {product.images.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${product.images[activeImage]?.url || 'fallback'}-${activeImage}`}
              initial={{ opacity: 0, x: 28, scale: 1.01 }}
              animate={{ opacity: 1, x: 0, scale: 1.05 }}
              exit={{ opacity: 0, x: -28, scale: 1 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={product.images[activeImage]?.url || 'https://placehold.co/600x700/6A0DAD/ffffff?text=Go+Seven'}
                alt={product.name}
                fill
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <Image
            src="https://placehold.co/600x700/6A0DAD/ffffff?text=Go+Seven"
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {product.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {product.images.map((image, index) => (
              <span
                key={`dot-${image.url}-${index}`}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  index === activeImage ? 'bg-white' : 'bg-white/35'
                }`}
              />
            ))}
          </div>
        )}

        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
          <button
            onClick={handleAddToCart}
            className={`p-3 rounded-full transition-colors ${
              added ? 'bg-green-500 text-white' : 'bg-white text-primary hover:bg-primary hover:text-white'
            }`}
          >
            <ShoppingCart size={20} />
          </button>
          <Link
            href={`/product/${product._id}/preview`}
            aria-label={`Preview ${product.name}`}
            title={`Preview ${product.name}`}
            className="bg-white text-primary p-3 rounded-full hover:bg-primary hover:text-white transition-colors"
          >
            <Eye size={20} />
          </Link>
        </div>
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
          <span className="glass px-3 py-1 rounded-full text-xs font-semibold text-primary uppercase tracking-wider bg-white/80">
            {product.category}
          </span>
          {product.isNewArrival && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-primary">
              NEW
            </span>
          )}
          {discountActive && (
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-red-500">
              {product.discount}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-6">
        <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
        {/* Sizes */}
        {product.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={(e) => { e.preventDefault(); setSelectedSize(s); }}
                className={`text-xs font-semibold px-3 py-1 rounded-md border transition-colors ${
                  selectedSize === s
                    ? 'border-primary bg-primary text-white'
                    : 'border-purple-200 text-black/60 hover:border-primary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {/* Colors */}
        {product.colors?.length > 0 && (
          <div className="flex gap-2 mb-3">
            {product.colors.map((c) => (
              <button
                key={c.name}
                title={c.name}
                onClick={(e) => { e.preventDefault(); setSelectedColor(c.name); }}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  selectedColor === c.name ? 'border-primary scale-125' : 'border-purple-200'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        )}
        <div className="flex justify-between items-center">
          <div>
            {discountActive ? (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-red-500">{formatPrice(getEffectivePrice(product))}</span>
                <span className="text-sm line-through text-black/40">{formatPrice(product.price)}</span>
              </div>
            ) : (
              <span className="text-xl font-extrabold text-primary">{formatPrice(product.price)}</span>
            )}
            {discountActive && product.discountEndsAt && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-black/50">Ends in</span>
                <CountdownTimer
                  endsAt={product.discountEndsAt}
                  onExpire={() => setDiscountActive(false)}
                  className="text-xs font-mono text-red-500"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-400">★</span>
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-xs text-black/40">({product.numReviews})</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
