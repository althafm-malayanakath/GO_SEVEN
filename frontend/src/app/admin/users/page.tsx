'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageCircle, PackageSearch, RefreshCcw, ShieldAlert, ShoppingBag, Users, Wifi } from 'lucide-react';
import { AdminUser, api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

function isOnline(user: AdminUser): boolean {
  if (!user.lastActiveAt) return false;
  return Date.now() - new Date(user.lastActiveAt).getTime() < ONLINE_THRESHOLD_MS;
}

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, isReady } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState('');

  const loadUsers = useCallback(async (mode: 'initial' | 'refresh' = 'refresh') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);

    try {
      const data = await api.getUsers();
      setUsers(data);
      setPageError('');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (isAdmin) void loadUsers('initial');
  }, [isAdmin, isReady, loadUsers, pathname, router, user]);

  const stats = useMemo(() => {
    const online = users.filter(isOnline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = users.filter((u) => new Date(u.createdAt) >= today);
    return { total: users.length, online: online.length, newToday: newToday.length };
  }, [users]);

  if (!isReady || (!user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen px-4 pt-28 pb-16">
        <div className="mx-auto max-w-2xl rounded-[30px] border border-white/15 bg-white/10 p-8 text-center shadow-[0_24px_60px_rgba(16,0,28,0.28)] backdrop-blur">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-100">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-3xl font-black">Admin access required</h1>
          <p className="mt-3 text-white/75">This section is restricted to admin accounts.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/account" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-primary transition-colors hover:bg-accent">
              Go to account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[34px] border border-white/15 bg-[linear-gradient(135deg,rgba(22,0,36,0.46),rgba(32,84,137,0.3))] shadow-[0_30px_80px_rgba(10,0,25,0.34)] backdrop-blur"
        >
          <div className="grid gap-8 px-6 py-7 lg:grid-cols-[1.4fr_0.9fr] lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/65">Admin Portal</p>
              <h1 className="mt-3 text-4xl font-black sm:text-5xl">Registered Users</h1>
              <p className="mt-4 max-w-2xl text-white/78">
                See who&apos;s active on the store right now, browse all registered accounts, and monitor engagement.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/admin/orders"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-primary transition-colors hover:bg-accent"
                >
                  <ShoppingBag size={18} />
                  Orders
                </Link>
                <Link
                  href="/admin/products"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <PackageSearch size={18} />
                  Products
                </Link>
                <button
                  type="button"
                  onClick={() => void loadUsers('refresh')}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw size={18} className={refreshing ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="flex min-h-[132px] flex-col justify-between rounded-[28px] bg-white/12 p-4 sm:p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/16">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black sm:text-3xl">{stats.total}</p>
                  <p className="mt-1 text-xs text-white/72 sm:text-sm">Total users</p>
                </div>
              </div>
              <div className="flex min-h-[132px] flex-col justify-between rounded-[28px] bg-white/12 p-4 sm:p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500/25">
                  <Wifi size={20} className="text-green-300" />
                </div>
                <div>
                  <p className="text-2xl font-black text-green-300 sm:text-3xl">{stats.online}</p>
                  <p className="mt-1 text-xs text-white/72 sm:text-sm">Online now</p>
                </div>
              </div>
              <div className="flex min-h-[132px] flex-col justify-between rounded-[28px] bg-white/12 p-4 sm:p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/16">
                  <PackageSearch size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black sm:text-3xl">{stats.newToday}</p>
                  <p className="mt-1 text-xs text-white/72 sm:text-sm">New today</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* User list */}
        <div className="mt-8 rounded-[30px] border border-white/15 bg-white/8 p-5 backdrop-blur">
          {pageError && (
            <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
              {pageError}
            </div>
          )}

          <div className="space-y-3">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={`skel-${i}`} className="h-24 rounded-[22px] bg-white/10 animate-pulse" />
              ))
            ) : users.length > 0 ? (
              users.map((u, index) => {
                const online = isOnline(u);
                return (
                  <motion.div
                    key={u._id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.025 }}
                    className="flex flex-col gap-3 rounded-[22px] border border-white/14 bg-white/10 px-5 py-5 sm:flex-row sm:flex-wrap sm:items-start sm:gap-4 lg:items-center"
                  >
                    {/* Avatar */}
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 text-lg font-black text-white">
                      {u.name.charAt(0).toUpperCase()}
                      {online && (
                        <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#1a0b2e] bg-green-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">{u.name}</span>
                        {u.role === 'admin' && (
                          <span className="rounded-full bg-primary/25 px-2.5 py-0.5 text-xs font-bold text-purple-200">Admin</span>
                        )}
                        {online && (
                          <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-bold text-green-300">Online</span>
                        )}
                      </div>
                      <p className="mt-0.5 break-all text-sm text-white/65">{u.email}</p>
                      <p className="mt-1 text-sm text-white/55 lg:hidden">{u.phone || '-'}</p>
                    </div>

                    {/* Phone */}
                    <div className="hidden lg:block text-sm text-white/65 min-w-[130px]">
                      {u.phone || '—'}
                    </div>

                    {/* WhatsApp */}
                    <div className="hidden lg:flex items-center gap-1.5 text-sm min-w-[110px]">
                      <MessageCircle size={14} className={u.whatsappOptIn ? 'text-green-400' : 'text-white/30'} />
                      <span className={u.whatsappOptIn ? 'text-green-300' : 'text-white/40'}>
                        {u.whatsappOptIn ? 'WhatsApp on' : 'WhatsApp off'}
                      </span>
                    </div>

                    {/* Last active */}
                    <div className="w-full min-w-[90px] rounded-2xl bg-white/8 px-3 py-2 text-left text-sm sm:w-auto sm:bg-transparent sm:px-0 sm:py-0 sm:text-right">
                      <p className="text-white/45 text-xs">Last active</p>
                      <p className="mt-1 font-semibold text-white/80">{timeAgo(u.lastActiveAt)}</p>
                    </div>

                    {/* Joined */}
                    <div className="w-full min-w-[90px] rounded-2xl bg-white/8 px-3 py-2 text-left text-sm sm:w-auto sm:bg-transparent sm:px-0 sm:py-0 sm:text-right">
                      <p className="text-white/45 text-xs">Joined</p>
                      <p className="mt-1 font-semibold text-white/80">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/18 bg-white/8 px-6 py-16 text-center">
                <h2 className="text-2xl font-black">No registered users yet</h2>
                <p className="mt-2 text-white/70">Users will appear here once they sign up.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
