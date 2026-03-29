'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const INTERVAL = 60_000; // 60 seconds

export default function UserHeartbeat() {
  const { user, isReady } = useAuth();

  useEffect(() => {
    if (!isReady || !user) return;

    // Ping immediately on mount, then every 60s
    void api.heartbeat().catch(() => {});
    const interval = setInterval(() => { void api.heartbeat().catch(() => {}); }, INTERVAL);
    return () => clearInterval(interval);
  }, [isReady, user]);

  return null;
}
