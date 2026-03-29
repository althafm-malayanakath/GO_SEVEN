'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const STORAGE_KEY = 'admin_last_known_order_count';
const POLL_INTERVAL = 30_000;

export default function AdminOrderNotifier() {
  const { isAdmin, isReady } = useAuth();
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const knownCount = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    setShowToast(false);
    setNewOrderCount(0);
  }, []);

  const handleNewOrders = useCallback((diff: number) => {
    setShowToast(true);
    // While toast is visible, accumulate; after dismiss (count=0), start fresh
    setNewOrderCount((prev) => (prev === 0 ? diff : prev + diff));
  }, []);

  // On mount: seed baseline from localStorage or fetch
  useEffect(() => {
    if (!isReady || !isAdmin) return;

    const stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? '', 10);

    api.getOrders().then((orders) => {
      if (!Number.isNaN(stored) && orders.length > stored) {
        handleNewOrders(orders.length - stored);
      }
      knownCount.current = orders.length;
      localStorage.setItem(STORAGE_KEY, String(orders.length));
    }).catch(() => {});
  }, [isReady, isAdmin, handleNewOrders]);

  // Poll every 30s
  useEffect(() => {
    if (!isReady || !isAdmin) return;

    const tick = async () => {
      try {
        const orders = await api.getOrders();
        const prev = knownCount.current;
        if (prev !== null && orders.length > prev) {
          handleNewOrders(orders.length - prev);
        }
        knownCount.current = orders.length;
        localStorage.setItem(STORAGE_KEY, String(orders.length));
      } catch {
        // silent
      }
    };

    const interval = setInterval(() => { void tick(); }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isReady, isAdmin, handleNewOrders]);

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -16, x: 16 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -16 }}
          onClick={() => { router.push('/admin/orders'); dismiss(); }}
          className="fixed top-24 right-6 z-[9999] flex cursor-pointer items-center gap-3 rounded-2xl border border-purple-200/40 bg-white px-5 py-4 shadow-2xl text-black transition-shadow hover:shadow-[0_20px_50px_rgba(106,13,173,0.18)]"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
            <BellRing size={18} />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white">
              {newOrderCount}
            </span>
          </div>
          <div>
            <p className="font-bold text-sm">
              {newOrderCount === 1 ? 'New order received!' : `${newOrderCount} new orders received!`}
            </p>
            <p className="text-xs text-black/55">Tap to review in admin orders.</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            className="ml-2 text-black/35 hover:text-black transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
