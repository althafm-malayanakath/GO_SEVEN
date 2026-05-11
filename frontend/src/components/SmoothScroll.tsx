'use client';
import { ReactLenis } from 'lenis/react';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.08, wheelMultiplier: 1.5, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
