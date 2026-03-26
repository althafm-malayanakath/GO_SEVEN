'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Star } from 'lucide-react';
import { api, Product } from '@/lib/api';
import { MOCK_PRODUCTS } from '@/lib/mockProducts';
import { useCart } from '@/context/CartContext';
import { isDiscountActive, getEffectivePrice } from '@/lib/discount';
import { useSettings } from '@/context/SettingsContext';

const FALLBACK_IMAGE = 'https://placehold.co/700x900/6A0DAD/ffffff?text=Go+Seven';

export default function ProductPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const { formatPrice } = useSettings();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [added, setAdded] = useState(false);
  const slideshowRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      if (!id) return;
      setLoading(true);

      try {
        const fetched = await api.getProduct(id);
        if (!isMounted) return;
        setProduct(fetched);
        setSelectedSize(fetched.sizes?.[0] ?? '');
      } catch {
        const mock = MOCK_PRODUCTS.find((item) => item._id === id) ?? null;
        if (!isMounted) return;
        setProduct(mock);
        setSelectedSize(mock?.sizes?.[0] ?? '');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    setActiveImage(0);
  }, [product?._id]);

  useEffect(() => {
    if (!product || product.images.length <= 1) {
      if (slideshowRef.current) {
        window.clearInterval(slideshowRef.current);
        slideshowRef.current = null;
      }
      return;
    }

    slideshowRef.current = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % product.images.length);
    }, 2200);

    return () => {
      if (slideshowRef.current) {
        window.clearInterval(slideshowRef.current);
        slideshowRef.current = null;
      }
    };
  }, [product]);

  const imageUrl = product?.images[activeImage]?.url ?? product?.images[0]?.url ?? FALLBACK_IMAGE;

  const filledStars = useMemo(() => {
    if (!product) return 0;
    return Math.round(product.rating);
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(
      product,
      1,
      selectedSize || product.sizes?.[0],
      product.colors?.[0]?.name
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-24">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <h1 className="text-2xl font-black mb-2">Product not found</h1>
          <p className="text-white/80 mb-6">This product preview is unavailable right now.</p>
          <Link
            href="/collections"
            className="inline-flex items-center justify-center rounded-full bg-white text-primary px-6 py-3 font-semibold"
          >
            Go to collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="grid grid-cols-1 md:grid-cols-2 rounded-[30px] overflow-hidden border border-white/25 shadow-[0_30px_70px_rgba(20,0,40,0.45)]"
        >
          <div className="relative p-5 sm:p-7 bg-[#2b0b43]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_15%,rgba(255,255,255,0.28),transparent_56%)]" />

            <div className="absolute top-5 left-5 z-20 flex items-center gap-2">
              <span className="rounded-full bg-white/80 text-primary px-3 py-1 text-xs font-bold uppercase tracking-wider">
                {product.category}
              </span>
              {product.isNewArrival && (
                <span className="rounded-full bg-primary text-white px-3 py-1 text-xs font-bold">
                  NEW
                </span>
              )}
            </div>

            <div className="relative z-10 mx-auto w-full max-w-[360px] aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.48)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${imageUrl}-${activeImage}`}
                  initial={{ opacity: 0, x: 34, scale: 1.03 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -34, scale: 0.99 }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.03, rotate: -0.4 }}
                  className="absolute inset-0"
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative h-full w-full"
                  >
                    <Image src={imageUrl} alt={product.name} fill className="object-cover" priority />
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {product.images.length > 1 && (
              <div className="relative z-20 mt-4 flex justify-center gap-2">
                {product.images.map((img, index) => (
                  <button
                    key={`${img.url}-${index}`}
                    onClick={() => {
                      setActiveImage(index);

                      if (slideshowRef.current) {
                        window.clearInterval(slideshowRef.current);
                        slideshowRef.current = null;
                      }

                      slideshowRef.current = window.setInterval(() => {
                        setActiveImage((current) => (current + 1) % product.images.length);
                      }, 2200);
                    }}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === activeImage ? 'bg-white' : 'bg-white/40 hover:bg-white/65'
                    }`}
                    aria-label={`Show image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#f4eff9] text-[#351a4f] p-6 sm:p-8 flex flex-col">
            <h1 className="text-3xl sm:text-4xl font-black leading-tight">{product.name}</h1>
            <p className="text-sm sm:text-base text-[#4f2f71]/85 mt-4">{product.description}</p>

            {product.sizes.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#5b3b7a] mb-2">Sizes</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-10 px-3 py-1 rounded-md text-sm font-semibold border transition-colors ${
                        selectedSize === size
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-[#4d2d70] border-[#d5c5e6] hover:border-primary'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colors?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#5b3b7a] mb-2">Colors</p>
                <div className="flex gap-2">
                  {product.colors.map((c) => (
                    <span
                      key={c.name}
                      title={c.name}
                      className="w-6 h-6 rounded-full border-2 border-[#d5c5e6]"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-7 flex items-end justify-between">
              <div>
                {isDiscountActive(product) ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-black text-red-500">{formatPrice(getEffectivePrice(product))}</p>
                      <p className="text-lg line-through text-[#4f2f71]/50">{formatPrice(product.price)}</p>
                    </div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-white bg-red-500">
                      {product.discount}% OFF
                    </span>
                  </>
                ) : (
                  <p className="text-4xl font-black text-primary">{formatPrice(product.price)}</p>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold text-[#4f2f71]">
                <span className="inline-flex">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      size={15}
                      className={
                        index < filledStars ? 'text-yellow-400 fill-yellow-400' : 'text-purple-200'
                      }
                    />
                  ))}
                </span>
                <span>{product.rating}</span>
                <span className="text-[#6f4d8f]/70">({product.numReviews})</span>
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                onClick={handleAddToCart}
                className={`flex-1 rounded-full py-3 px-4 font-bold flex items-center justify-center gap-2 transition-colors ${
                  added ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                <ShoppingCart size={18} />
                {added ? 'Added' : 'Add to cart'}
              </button>
              <Link
                href={`/product/${product._id}`}
                className="rounded-full py-3 px-5 font-semibold border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
              >
                Full details
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
