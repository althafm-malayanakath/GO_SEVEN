import Link from 'next/link';
import { ArrowRight, Zap, Shield, Truck } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { FadeIn, FadeInView } from '@/components/FadeIn';
import type { Product } from '@/lib/api';
import Hero3D from '@/components/Hero3DWrapper';

const FEATURES = [
  { icon: Zap, title: 'Premium Quality', desc: 'Every piece crafted with the finest materials' },
  { icon: Shield, title: 'Authenticity', desc: 'Guaranteed genuine streetwear, no replicas' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Free shipping on all orders' },
];

async function getProducts(): Promise<Product[]> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
    const res = await fetch(`${base}/products`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();
  const featured = products.filter((p) => p.isFeatured).slice(0, 4);
  const newArrivals = products.filter((p) => p.isNewArrival).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[620px] md:min-h-screen overflow-hidden">
        <Hero3D />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 md:py-32 min-h-[620px] md:min-h-screen flex items-center">
          <FadeIn className="max-w-2xl">
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none mb-6">
              <span className="text-gradient">STITCHED TO</span>
              <br />
              <span className="drop-shadow-[0_0_14px_rgba(255,255,255,0.2)]">STAND OUT</span>
            </h1>
            <p className="text-lg text-white/88 mb-10 max-w-md">
              Premium embroidered pieces crafted with refined texture, precise detailing, and a luxury finish built to stand apart.
            </p>
            <div className="relative mt-16 translate-y-24 sm:mt-0 sm:translate-y-0 flex flex-col sm:flex-row gap-4">
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
          </FadeIn>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-y border-white/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <FadeInView key={title}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white/12">
                    <Icon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{title}</h3>
                    <p className="text-white/75 text-sm mt-1">{desc}</p>
                  </div>
                </div>
              </FadeInView>
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

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((p) => (
                <div key={p._id}>
                  <ProductCard product={p} compact />
                </div>
              ))}
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
          <FadeInView scale>
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
          </FadeInView>
        </div>
      </section>
    </div>
  );
}
