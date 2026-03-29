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
  const [showToast, setShowToast] = useState(false);
  const knownCount = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = useCallback(() => {
    setShowToast(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowToast(false), 20_000);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // On mount (as admin): seed the baseline from localStorage or a quick fetch
  useEffect(() => {
    if (!isReady || !isAdmin) return;

    const stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? '', 10);

    api.getOrders().then((orders) => {
      if (!Number.isNaN(stored) && orders.length > stored) {
        triggerToast();
      }
      knownCount.current = orders.length;
      localStorage.setItem(STORAGE_KEY, String(orders.length));
    }).catch(() => {});
  }, [isReady, isAdmin, triggerToast]);

  // Poll every 30s
  useEffect(() => {
    if (!isReady || !isAdmin) return;

    const tick = async () => {
      try {
        const orders = await api.getOrders();
        const prev = knownCount.current;
        if (prev !== null && orders.length > prev) {
          triggerToast();
        }
        knownCount.current = orders.length;
        localStorage.setItem(STORAGE_KEY, String(orders.length));
      } catch {
        // silent
      }
    };

    const interval = setInterval(() => { void tick(); }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isReady, isAdmin, triggerToast]);

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -16, x: 16 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="fixed top-24 right-6 z-[9999] flex items-center gap-3 rounded-2xl border border-purple-200/40 bg-white px-5 py-4 shadow-2xl text-black"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
            <BellRing size={18} />
          </div>
          <div>
            <p className="font-bold text-sm">New order received!</p>
            <p className="text-xs text-black/55">Go to admin orders to review it.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            className="ml-2 text-black/35 hover:text-black transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
