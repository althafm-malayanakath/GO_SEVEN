'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { api, Product } from '@/lib/api';
import { MOCK_PRODUCTS } from '@/lib/mockProducts';

function CollectionsContent() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState('default');

  useEffect(() => {
    api.getProducts()
      .then(setProducts)
      .catch(() => {
        setProducts(MOCK_PRODUCTS);
      })
      .finally(() => setLoading(false));
  }, []);

  const availableCategories = useMemo(() => {
    const sourceProducts = filterParam === 'new'
      ? products.filter((product) => product.isNewArrival)
      : products;

    const uniqueCategories = Array.from(
      new Set(
        sourceProducts
          .map((product) => product.category.trim())
          .filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right));

    return ['All', ...uniqueCategories];
  }, [filterParam, products]);

  const resolvedCategory = availableCategories.includes(activeCategory) ? activeCategory : 'All';

  const filtered = useMemo(() => {
    let result = resolvedCategory === 'All'
      ? [...products]
      : products.filter((p) => p.category.toLowerCase() === resolvedCategory.toLowerCase());

    if (filterParam === 'new') result = result.filter((p) => p.isNewArrival);

    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);

    return result;
  }, [resolvedCategory, sort, products, filterParam]);

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <span className="text-white/80 font-semibold text-sm uppercase tracking-widest">
            {filterParam === 'new' ? 'Fresh Drops' : 'Explore'}
          </span>
          <h1 className="text-5xl font-black mt-1">
            {filterParam === 'new' ? 'New Arrivals' : 'Collections'}
          </h1>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  resolvedCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-white/14 hover:bg-white/22 text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-2 rounded-full text-sm border border-white/35 bg-white text-black focus:outline-none focus:border-primary"
            >
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm border border-white/35 text-white hover:border-white transition-colors"
            >
              {showFilters ? <X size={16} /> : <SlidersHorizontal size={16} />}
              Filters
            </button>
          </div>
        </div>

        {/* Products count */}
        <p className="text-sm text-white/80 mb-6">{filtered.length} products</p>

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-white/14 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {filtered.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-32 text-white/60">
            <p className="text-xl font-semibold">No products found</p>
            <p className="text-sm mt-2">Try a different category or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
      <CollectionsContent />
    </Suspense>
  );
}
