'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Star, Truck, Shield } from 'lucide-react';
import { api, Product, Review } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { isDiscountActive, getEffectivePrice } from '@/lib/discount';
import { useSettings } from '@/context/SettingsContext';
import CountdownTimer from '@/components/CountdownTimer';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();

  const { user } = useAuth();
  const { formatPrice } = useSettings();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [discountActive, setDiscountActive] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getProduct(id)
      .then((p) => {
        setProduct(p);
        setDiscountActive(isDiscountActive(p));
        if (p.sizes?.length) setSelectedSize(p.sizes[0]);
        if (p.colors?.length) setSelectedColor(p.colors[0].name);
      })
      .catch(() => router.push('/collections'))
      .finally(() => setLoading(false));

    api.getReviews(id).then((r) => setReviews(r.reviews)).catch(() => {});
  }, [id, router]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setReviewSubmitting(true);
    setReviewError('');
    try {
      await api.createReview(id, { rating: reviewRating, comment: reviewComment });
      setReviewSuccess(true);
      setReviewComment('');
      const updated = await api.getReviews(id);
      setReviews(updated.reviews);
      setProduct((p) => p ? { ...p, rating: updated.rating, numReviews: updated.numReviews } : p);
    } catch (err: unknown) {
      setReviewError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, qty, selectedSize, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  const mainImage = product.images[activeImage]?.url || 'https://placehold.co/600x600/6A0DAD/ffffff?text=Go+Seven';

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Images */}
          <div>
            <motion.div
              key={activeImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-square rounded-3xl overflow-hidden bg-white/14"
            >
              <Image src={mainImage} alt={product.name} fill className="object-cover" />
              {product.isNewArrival && (
                <div className="absolute top-6 left-6 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                  NEW
                </div>
              )}
            </motion.div>
            {product.images.length > 1 && (
              <div className="flex gap-3 mt-4">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                      i === activeImage ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <Image src={img.url} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <span className="text-primary font-semibold text-sm uppercase tracking-widest mb-2">
              {product.category}
            </span>
            <h1 className="text-4xl font-black mb-4">{product.name}</h1>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-sm text-white/80">({product.numReviews} reviews)</span>
            </div>

            {discountActive ? (
              <div className="flex flex-col mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-extrabold text-red-400">{formatPrice(getEffectivePrice(product))}</span>
                  <span className="text-xl line-through text-white/40">{formatPrice(product.price)}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white bg-red-500">{product.discount}% OFF</span>
                </div>
                {product.discountEndsAt && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-white/50">Offer ends in</span>
                    <CountdownTimer
                      endsAt={product.discountEndsAt}
                      onExpire={() => setDiscountActive(false)}
                      className="text-sm font-mono text-yellow-300"
                    />
                  </div>
                )}
              </div>
            ) : (
              <span className="text-4xl font-extrabold text-primary mb-6">{formatPrice(product.price)}</span>
            )}

            <p className="text-white/85 leading-relaxed mb-8">{product.description}</p>

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="mb-6">
                <p className="font-semibold mb-3">Size: <span className="text-primary">{selectedSize}</span></p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-colors ${
                        selectedSize === size
                          ? 'border-primary bg-primary text-white'
                          : 'border-purple-200 hover:border-primary'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors?.length > 0 && (
              <div className="mb-8">
                <p className="font-semibold mb-3">Color: <span className="text-primary">{selectedColor}</span></p>
                <div className="flex gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      title={color.name}
                      className={`w-8 h-8 rounded-full border-4 transition-all ${
                        selectedColor === color.name ? 'border-primary scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Qty + Add to cart */}
            <div className="flex gap-4 mb-8">
              <div className="flex items-center gap-3 border border-purple-200 rounded-full px-4 py-2">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="font-bold text-lg">-</button>
                <span className="w-8 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="font-bold text-lg">+</button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-bold transition-all ${
                  added
                    ? 'bg-green-500 text-white'
                    : product.stock === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                <ShoppingCart size={20} />
                {added ? 'Added!' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-col gap-3 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-primary" />
                Free shipping on orders over $150
              </div>
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-primary" />
                Authenticity guaranteed — 100% genuine
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <h2 className="text-2xl font-black mb-8">Customer Reviews</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Review list */}
          <div className="flex flex-col gap-4">
            {reviews.length === 0 ? (
              <p className="text-white/60">No reviews yet. Be the first!</p>
            ) : (
              reviews.map((r) => (
                <div key={r._id} className="glass rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                      {r.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{r.name}</p>
                      <p className="text-xs text-white/50">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="ml-auto flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13} className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/80 text-sm">{r.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Submit review */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-4">Write a Review</h3>
            {!user ? (
              <p className="text-white/60 text-sm">Please <a href="/login" className="text-primary underline">sign in</a> to leave a review.</p>
            ) : reviewSuccess ? (
              <p className="text-green-400 font-semibold">Review submitted! Thank you.</p>
            ) : (
              <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-semibold mb-2">Your Rating</p>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((star) => (
                      <button type="button" key={star} onClick={() => setReviewRating(star)}>
                        <Star size={24} className={star <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={4}
                  required
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none focus:outline-none focus:border-primary"
                />
                {reviewError && <p className="text-red-400 text-sm">{reviewError}</p>}
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="bg-primary text-white rounded-full py-3 font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
