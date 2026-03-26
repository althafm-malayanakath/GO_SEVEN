'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Boxes,
  CirclePlus,
  PencilLine,
  RefreshCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import ProductEditor from '@/components/admin/ProductEditor';
import { Product, ProductInput, api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type FilterMode = 'all' | 'featured' | 'new' | 'low-stock';

const FILTERS: Array<{ label: string; value: FilterMode }> = [
  { label: 'All products', value: 'all' },
  { label: 'Featured', value: 'featured' },
  { label: 'New arrivals', value: 'new' },
  { label: 'Low stock', value: 'low-stock' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export default function AdminProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, isReady } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProducts = useCallback(async (mode: 'initial' | 'refresh' = 'refresh') => {
    if (mode === 'initial') {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const nextProducts = await api.getProducts({ sort: 'newest' });
      setProducts(nextProducts);
      setPageError('');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to load products.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (isAdmin) {
      void loadProducts('initial');
    }
  }, [isAdmin, isReady, loadProducts, pathname, router, user]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery);

      if (!matchesQuery) {
        return false;
      }

      switch (filter) {
        case 'featured':
          return product.isFeatured;
        case 'new':
          return product.isNewArrival;
        case 'low-stock':
          return product.stock <= 10;
        default:
          return true;
      }
    });
  }, [filter, products, query]);

  const stats = useMemo(() => ({
    total: products.length,
    featured: products.filter((product) => product.isFeatured).length,
    newArrivals: products.filter((product) => product.isNewArrival).length,
    lowStock: products.filter((product) => product.stock <= 10).length,
  }), [products]);
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(products.map((product) => product.category.trim()).filter(Boolean))
      ).sort((left, right) => left.localeCompare(right)),
    [products]
  );

  const handleCreate = () => {
    setSelectedProduct(null);
    setEditorOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditorOpen(true);
  };

  const handleSave = async (payload: ProductInput) => {
    setSaving(true);

    try {
      const savedProduct = selectedProduct
        ? await api.updateProduct(selectedProduct._id, payload)
        : await api.createProduct(payload);

      setProducts((current) => {
        if (selectedProduct) {
          return current.map((product) => (product._id === savedProduct._id ? savedProduct : product));
        }

        return [savedProduct, ...current];
      });

      setEditorOpen(false);
      setSelectedProduct(null);
      setPageError('');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to save product.');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(`Delete "${product.name}"? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setDeletingId(product._id);

    try {
      await api.deleteProduct(product._id);
      setProducts((current) => current.filter((item) => item._id !== product._id));
      setPageError('');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to delete product.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isReady || (!user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen px-4 pt-28 pb-16">
        <div className="mx-auto max-w-2xl rounded-[30px] border border-white/15 bg-white/10 p-8 text-center shadow-[0_24px_60px_rgba(16,0,28,0.28)] backdrop-blur">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-100">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-3xl font-black">Admin access required</h1>
          <p className="mt-3 text-white/75">
            This portal is restricted to accounts with the <span className="font-semibold">admin</span> role.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/account"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-primary transition-colors hover:bg-accent"
            >
              Go to account
            </Link>
            <Link
              href="/collections"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Back to storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[34px] border border-white/15 bg-[linear-gradient(135deg,rgba(22,0,36,0.46),rgba(122,31,162,0.3))] shadow-[0_30px_80px_rgba(10,0,25,0.34)] backdrop-blur"
        >
          <div className="grid gap-8 px-6 py-7 lg:grid-cols-[1.4fr_0.9fr] lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/65">Admin Portal</p>
              <h1 className="mt-3 text-4xl font-black sm:text-5xl">Inventory Control</h1>
              <p className="mt-4 max-w-2xl text-white/78">
                Manage storefront products, adjust pricing, and keep stock and launch flags in sync from one place.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCreate}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-primary transition-colors hover:bg-accent"
                >
                  <CirclePlus size={18} />
                  New product
                </button>
                <Link
                  href="/admin/orders"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Customer orders
                </Link>
                <Link
                  href="/admin/settings"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => void loadProducts('refresh')}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw size={18} className={refreshing ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[28px] bg-white/12 p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/16">
                  <Boxes size={20} />
                </div>
                <p className="text-3xl font-black">{stats.total}</p>
                <p className="mt-1 text-sm text-white/72">Total products</p>
              </div>
              <div className="rounded-[28px] bg-white/12 p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/16">
                  <Star size={20} />
                </div>
                <p className="text-3xl font-black">{stats.featured}</p>
                <p className="mt-1 text-sm text-white/72">Featured</p>
              </div>
              <div className="rounded-[28px] bg-white/12 p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/16">
                  <Sparkles size={20} />
                </div>
                <p className="text-3xl font-black">{stats.newArrivals}</p>
                <p className="mt-1 text-sm text-white/72">New arrivals</p>
              </div>
              <div className="rounded-[28px] bg-white/12 p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/16">
                  <ShieldAlert size={20} />
                </div>
                <p className="text-3xl font-black">{stats.lowStock}</p>
                <p className="mt-1 text-sm text-white/72">Low stock</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 rounded-[30px] border border-white/15 bg-white/8 p-5 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-full border border-white/18 bg-white/10 py-3 pl-11 pr-4 text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/35"
                placeholder="Search by name, category, or description"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => setFilter(entry.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    filter === entry.value
                      ? 'bg-white text-primary'
                      : 'border border-white/18 bg-white/8 text-white hover:bg-white/14'
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>

          {pageError && (
            <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
              {pageError}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {loading ? (
              [...Array(4)].map((_, index) => (
                <div key={`skeleton-${index}`} className="h-32 rounded-[28px] bg-white/10 animate-pulse" />
              ))
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="grid gap-5 rounded-[28px] border border-white/14 bg-white/10 p-4 text-white shadow-[0_20px_50px_rgba(10,0,25,0.18)] lg:grid-cols-[120px_minmax(0,1fr)_auto]"
                >
                  <div className="relative h-28 overflow-hidden rounded-3xl bg-white/10">
                    <Image
                      src={product.images[0]?.url || 'https://placehold.co/600x700/6A0DAD/ffffff?text=Go+Seven'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-2xl font-black">{product.name}</h2>
                          <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/75">
                            {product.category}
                          </span>
                          {product.isFeatured && (
                            <span className="rounded-full bg-[#ffe9a8] px-3 py-1 text-xs font-bold text-[#5f4200]">Featured</span>
                          )}
                          {product.isNewArrival && (
                            <span className="rounded-full bg-[#efe0ff] px-3 py-1 text-xs font-bold text-[#5e2d7a]">New</span>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-white/72">{product.description}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm">
                      <div className="rounded-full border border-white/16 bg-white/8 px-3 py-1.5">
                        Price <span className="ml-2 font-bold text-white">{formatCurrency(product.price)}</span>
                      </div>
                      <div className="rounded-full border border-white/16 bg-white/8 px-3 py-1.5">
                        Stock <span className={`ml-2 font-bold ${product.stock <= 10 ? 'text-[#ffe9a8]' : 'text-white'}`}>{product.stock}</span>
                      </div>
                      <div className="rounded-full border border-white/16 bg-white/8 px-3 py-1.5">
                        Sizes <span className="ml-2 font-bold text-white">{product.sizes.length || 'None'}</span>
                      </div>
                      <div className="rounded-full border border-white/16 bg-white/8 px-3 py-1.5">
                        Updated <span className="ml-2 font-bold text-white">{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-44">
                    <Link
                      href={`/product/${product._id}`}
                      className="inline-flex items-center justify-center rounded-full border border-white/18 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      View product
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleEdit(product)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-accent"
                    >
                      <PencilLine size={16} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(product)}
                      disabled={deletingId === product._id}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-red-300/35 px-4 py-2.5 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/12 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      {deletingId === product._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/18 bg-white/8 px-6 py-16 text-center">
                <h2 className="text-2xl font-black">No products match this view</h2>
                <p className="mt-2 text-white/70">Adjust the filters or create a new product to populate the catalog.</p>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-primary transition-colors hover:bg-accent"
                >
                  <CirclePlus size={18} />
                  Add product
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {editorOpen && (
        <ProductEditor
          key={selectedProduct?._id ?? 'new-product'}
          categoryOptions={categoryOptions}
          product={selectedProduct}
          saving={saving}
          onClose={() => {
            setEditorOpen(false);
            setSelectedProduct(null);
          }}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
}
