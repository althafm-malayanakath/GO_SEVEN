'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowUpRight, CreditCard, PackageSearch, RefreshCcw, ShieldAlert, ShoppingBag, Truck } from 'lucide-react';
import { Order, OrderStatus, api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const STATUS_OPTIONS: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: 'bg-[#fff0bf] text-[#6d4e00]',
  Processing: 'bg-[#d7e9ff] text-[#0f4f90]',
  Shipped: 'bg-[#eadcff] text-[#5a2b8a]',
  Delivered: 'bg-[#daf6df] text-[#17633a]',
  Cancelled: 'bg-[#ffd9dc] text-[#8e2330]',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, isReady } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, OrderStatus>>({});

  const loadOrders = useCallback(async (mode: 'initial' | 'refresh' = 'refresh') => {
    if (mode === 'initial') {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const nextOrders = await api.getOrders();
      setOrders(nextOrders);
      setPageError('');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to load orders.');
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
      void loadOrders('initial');
    }
  }, [isAdmin, isReady, loadOrders, pathname, router, user]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((order) => order.status === 'Pending').length,
    paid: orders.filter((order) => order.isPaid).length,
    revenue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
  }), [orders]);

  const updateStatusDraft = (orderId: string, status: OrderStatus) => {
    setStatusDrafts((current) => ({ ...current, [orderId]: status }));
  };

  const handleStatusSave = async (order: Order) => {
    const nextStatus = statusDrafts[order._id] || order.status;

    if (nextStatus === order.status) {
      return;
    }

    setSavingId(order._id);

    try {
      const updatedOrder = await api.updateOrderStatus(order._id, nextStatus);
      setOrders((current) => current.map((entry) => (entry._id === updatedOrder._id ? updatedOrder : entry)));
      setPageError('');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to update order status.');
    } finally {
      setSavingId(null);
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
          <p className="mt-3 text-white/75">This order console is restricted to admin accounts.</p>
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
          className="overflow-hidden rounded-[34px] border border-white/15 bg-[linear-gradient(135deg,rgba(22,0,36,0.46),rgba(32,84,137,0.3))] shadow-[0_30px_80px_rgba(10,0,25,0.34)] backdrop-blur"
        >
          <div className="grid gap-8 px-6 py-7 lg:grid-cols-[1.4fr_0.9fr] lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/65">Admin Portal</p>
              <h1 className="mt-3 text-4xl font-black sm:text-5xl">Customer Orders</h1>
              <p className="mt-4 max-w-2xl text-white/78">
                Review incoming purchases, inspect customer details, and update fulfillment status from one queue.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/admin/products"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-primary transition-colors hover:bg-accent"
                >
                  <ShoppingBag size={18} />
                  Products
                </Link>
                <button
                  type="button"
                  onClick={() => void loadOrders('refresh')}
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
                  <PackageSearch size={20} />
                </div>
                <p className="text-3xl font-black">{stats.total}</p>
                <p className="mt-1 text-sm text-white/72">Total orders</p>
              </div>
              <div className="rounded-[28px] bg-white/12 p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/16">
                  <Truck size={20} />
                </div>
                <p className="text-3xl font-black">{stats.pending}</p>
                <p className="mt-1 text-sm text-white/72">Pending</p>
              </div>
              <div className="rounded-[28px] bg-white/12 p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/16">
                  <CreditCard size={20} />
                </div>
                <p className="text-3xl font-black">{stats.paid}</p>
                <p className="mt-1 text-sm text-white/72">Paid</p>
              </div>
              <div className="rounded-[28px] bg-white/12 p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/16">
                  <ShoppingBag size={20} />
                </div>
                <p className="text-2xl font-black">{formatCurrency(stats.revenue)}</p>
                <p className="mt-1 text-sm text-white/72">Gross revenue</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 rounded-[30px] border border-white/15 bg-white/8 p-5 backdrop-blur">
          {pageError && (
            <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
              {pageError}
            </div>
          )}

          <div className="space-y-4">
            {loading ? (
              [...Array(4)].map((_, index) => (
                <div key={`order-skeleton-${index}`} className="h-44 rounded-[28px] bg-white/10 animate-pulse" />
              ))
            ) : orders.length > 0 ? (
              orders.map((order, index) => {
                const selectedStatus = statusDrafts[order._id] || order.status;
                const statusClassName = STATUS_STYLES[(order.status as OrderStatus) || 'Pending'] || STATUS_STYLES.Pending;

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="grid gap-5 rounded-[28px] border border-white/14 bg-white/10 p-5 text-white shadow-[0_20px_50px_rgba(10,0,25,0.18)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-black">#{order._id.slice(-8).toUpperCase()}</h2>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClassName}`}>
                          {order.status}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${order.isPaid ? 'bg-[#daf6df] text-[#17633a]' : 'bg-[#fff0bf] text-[#6d4e00]'}`}>
                          {order.isPaid ? 'Paid' : 'Payment pending'}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Customer</p>
                          <p className="mt-2 font-semibold text-white">{order.customerName || order.user?.name || 'Unknown customer'}</p>
                          <p className="text-sm text-white/70">{order.user?.email || 'No email available'}</p>
                          <p className="text-sm text-white/70">{order.customerPhone}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Shipping</p>
                          <p className="mt-2 text-sm text-white/78">{order.shippingAddress.address}</p>
                          <p className="text-sm text-white/70">
                            {order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <div className="rounded-[22px] border border-white/12 bg-white/8 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Placed</p>
                        <p className="mt-2 font-semibold text-white">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="rounded-[22px] border border-white/12 bg-white/8 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Order summary</p>
                        <p className="mt-2 font-semibold text-white">{order.orderItems.length} item(s)</p>
                        <p className="text-sm text-white/70">{formatCurrency(order.totalPrice)}</p>
                        <p className="text-sm text-white/70">
                          Customer WhatsApp: {order.notifications?.customer?.sent ? 'Sent' : order.notifications?.customer?.error || 'Pending'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 xl:w-56">
                      <select
                        value={selectedStatus}
                        onChange={(event) => updateStatusDraft(order._id, event.target.value as OrderStatus)}
                        className="rounded-full border border-white/18 bg-white/10 px-4 py-3 text-sm font-semibold text-white outline-none transition-colors focus:border-white/35"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status} className="text-black">
                            {status}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleStatusSave(order)}
                        disabled={savingId === order._id || selectedStatus === order.status}
                        className="inline-flex items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === order._id ? 'Saving...' : 'Save status'}
                      </button>
                      <Link
                        href={`/orders/${order._id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                      >
                        View details
                        <ArrowUpRight size={16} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/18 bg-white/8 px-6 py-16 text-center">
                <h2 className="text-2xl font-black">No customer orders yet</h2>
                <p className="mt-2 text-white/70">Orders will appear here as soon as customers complete checkout.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
