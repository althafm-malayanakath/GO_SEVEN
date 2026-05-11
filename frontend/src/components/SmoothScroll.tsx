'use client';
import { ReactLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, wheelMultiplier: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
