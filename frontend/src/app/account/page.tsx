'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, User, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api, Order } from '@/lib/api';

export default function AccountPage() {
  const { user, logout, isAdmin, isReady } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!user) {
      router.push('/login?redirect=/account');
      return;
    }

    api.getMyOrders()
      .then((nextOrders) => {
        setOrders(nextOrders);
        setOrdersError('');
      })
      .catch((error: unknown) => {
        setOrdersError(error instanceof Error ? error.message : 'Unable to load order history');
      })
      .finally(() => setLoading(false));
  }, [isReady, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const statusColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Processing: 'bg-blue-100 text-blue-700',
    Shipped: 'bg-purple-100 text-purple-700',
    Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-black mb-1">My Account</h1>
          <p className="text-white/80">Welcome back, {user.name}</p>
        </motion.div>

        {/* Profile card */}
        <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6 mb-10`}>
          <div className="p-6 rounded-2xl border border-purple-200/80 bg-white text-black">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={24} className="text-primary" />
              </div>
              <div>
                <p className="font-bold">{user.name}</p>
                <p className="text-sm text-black/60">{user.email}</p>
                <p className="text-sm text-black/60">{user.phone || 'No phone saved'}</p>
                <p className="text-xs text-black/45 mt-0.5">
                  WhatsApp updates: {user.whatsappOptIn ? 'Enabled' : 'Disabled'}
                </p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
                  user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-purple-100 text-purple-700'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-purple-200/80 bg-white text-black flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Package size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-3xl font-black text-primary">{orders.length}</p>
              <p className="text-sm text-black/60">Total Orders</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-6 rounded-2xl border border-red-200 bg-white text-black flex items-center gap-4 hover:bg-red-50 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <LogOut size={24} className="text-red-500" />
            </div>
            <div className="text-left">
              <p className="font-bold text-red-500">Sign Out</p>
              <p className="text-sm text-black/60">Log out of your account</p>
            </div>
          </button>

          {isAdmin && (
            <Link
              href="/admin/products"
              className="p-6 rounded-2xl border border-amber-200 bg-white text-black flex items-center gap-4 hover:bg-amber-50 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                <ShieldCheck size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-amber-700">Admin Portal</p>
                <p className="text-sm text-black/60">Manage products, pricing, and customer orders</p>
              </div>
            </Link>
          )}
        </div>

        {/* Orders */}
        <h2 className="text-2xl font-black mb-6">Order History</h2>
        {ordersError && (
          <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
            {ordersError}
          </div>
        )}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white/14 animate-pulse" />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="flex items-center justify-between p-5 rounded-2xl border border-purple-200/80 bg-white text-black hover:border-primary transition-colors"
              >
                <div>
                  <p className="font-bold text-sm">#{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-black/50 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                  {order.status}
                </span>
                <p className="font-extrabold text-primary">${order.totalPrice.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-white/60">
            <Package size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold">No orders yet</p>
            <Link href="/collections" className="text-primary text-sm hover:underline mt-2 inline-block">
              Start shopping →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
