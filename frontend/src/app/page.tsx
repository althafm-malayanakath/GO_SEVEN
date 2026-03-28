'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Truck } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import Hero3D from '@/components/Hero3D';
import { api, Product } from '@/lib/api';

const FEATURES = [
  { icon: Zap, title: 'Premium Quality', desc: 'Every piece crafted with the finest materials' },
  { icon: Shield, title: 'Authenticity', desc: 'Guaranteed genuine streetwear, no replicas' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Free shipping on all orders' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api.getProducts()
      .then((products) => {
        setFeatured(products.filter((p) => p.isFeatured).slice(0, 4));
        setNewArrivals(products.filter((p) => p.isNewArrival).slice(0, 4));
        setLoadError('');
      })
      .catch((error) => {
        setFeatured([]);
        setNewArrivals([]);
        setLoadError(error instanceof Error ? error.message : 'Unable to load products right now.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <Hero3D />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none mb-6">
              <span className="text-gradient">STITCHED TO</span>
              <br />
              <span className="drop-shadow-[0_0_14px_rgba(255,255,255,0.2)]">STAND OUT</span>
            </h1>
            <p className="text-lg text-white/88 mb-10 max-w-md">
              Premium embroidered pieces crafted with refined texture, precise detailing, and a luxury finish built to stand apart.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/collections"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#7A1FA2] px-8 py-4 rounded-full font-semibold hover:bg-[#f1deff] transition-colors"
              >
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link
                href="/collections?filter=new"
                className="inline-flex items-center justify-center gap-2 glass px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-colors"
              >
                New Arrivals
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-y border-white/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-start gap-4"
              >
                <div className="p-3 rounded-xl bg-white/12">
                  <Icon size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{title}</h3>
                  <p className="text-white/75 text-sm mt-1">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-white/80 font-semibold text-sm uppercase tracking-widest">Curated</span>
              <h2 className="text-4xl font-black mt-1">Featured Drops</h2>
            </div>
            <Link href="/collections" className="text-white font-semibold flex items-center gap-1 hover:underline">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-white/14 animate-pulse" />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((p) => (
                <div key={p._id}>
                  <ProductCard product={p} compact />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="rounded-3xl border border-white/12 bg-white/6 px-6 py-10 text-center text-white/72">
              <p className="text-lg font-semibold text-white">Unable to load featured products</p>
              <p className="mt-2 text-sm">{loadError}</p>
            </div>
          ) : (
            <div className="text-center py-20 text-white/60">
              <p className="text-lg">Products coming soon. Check back later.</p>
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-24 bg-transparent text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="text-white/80 font-semibold text-sm uppercase tracking-widest">Fresh</span>
                <h2 className="text-4xl font-black mt-1">New Arrivals</h2>
              </div>
              <Link href="/collections?filter=new" className="text-white font-semibold flex items-center gap-1 hover:underline">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {newArrivals.map((p) => (
                <div key={p._id}>
                  <ProductCard product={p} compact />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="py-32 bg-transparent text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-black mb-6">Join the Movement</h2>
            <p className="text-white/80 text-lg mb-10">
              Sign up and get early access to exclusive drops, limited editions and members-only pricing.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-primary px-10 py-4 rounded-full font-bold hover:bg-accent transition-colors"
            >
              Create Account <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

