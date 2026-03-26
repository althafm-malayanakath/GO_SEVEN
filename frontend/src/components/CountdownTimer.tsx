'use client';

import { useEffect, useState } from 'react';

interface Props {
  endsAt: string;
  onExpire?: () => void;
  className?: string;
}

function getRemaining(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return { days, hours, mins, secs };
}

export default function CountdownTimer({ endsAt, onExpire, className = '' }: Props) {
  const [remaining, setRemaining] = useState(() => getRemaining(endsAt));

  useEffect(() => {
    const tick = () => {
      const r = getRemaining(endsAt);
      setRemaining(r);
      if (!r) onExpire?.();
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt, onExpire]);

  if (!remaining) return null;

  const { days, hours, mins, secs } = remaining;
  const label = days > 0
    ? `${days}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`
    : `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <span className={className}>
      {label}
    </span>
  );
}
