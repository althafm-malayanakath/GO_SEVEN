'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-white/80 font-semibold text-sm uppercase tracking-widest">The Brand</span>
          <h1 className="text-5xl font-black mt-2 mb-8">Our Story</h1>
          <div className="space-y-6 text-lg text-white/85 leading-relaxed">
            <p>
              Go Seven was born from the streets — a vision to bridge the gap between raw streetwear culture
              and elevated craftsmanship. We believe what you wear tells the world who you are before you speak.
            </p>
            <p>
              Every piece in our collection is designed with intention. From the stitching to the silhouette,
              we obsess over details so you don&apos;t have to. Premium materials, limited runs, zero compromise.
            </p>
            <p>
              The number seven isn&apos;t just a number — it&apos;s a mindset. The drive to go beyond six, to reach
              further than expected, to be the seventh wonder in a world full of ordinary.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 text-center">
            {[
              { number: '2020', label: 'Founded' },
              { number: '50K+', label: 'Community' },
              { number: '100%', label: 'Authentic' },
            ].map(({ number, label }) => (
              <div key={label}>
                <p className="text-4xl font-black text-gradient">{number}</p>
                <p className="text-sm text-white/70 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
