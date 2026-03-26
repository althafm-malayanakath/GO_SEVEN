'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Ring lags behind the dot
  const ringX = useSpring(mouseX, { stiffness: 120, damping: 18, mass: 0.6 });
  const ringY = useSpring(mouseY, { stiffness: 120, damping: 18, mass: 0.6 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setVisible(true);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);
    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);

    const onHoverStart = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"], input, select, textarea')) {
        setHovering(true);
      } else {
        setHovering(false);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousemove', onHoverStart);
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('mouseenter', onEnter);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousemove', onHoverStart);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mouseenter', onEnter);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, [mouseX, mouseY]);

  if (typeof window === 'undefined') return null;

  return (
    <>
      {/* Dot — precise, instant */}
      <motion.div
        className="fixed top-0 left-0 z-[9999] pointer-events-none"
        style={{ x: mouseX, y: mouseY }}
        animate={{
          opacity: visible ? 1 : 0,
          scale: clicking ? 0.5 : hovering ? 1.5 : 1,
        }}
        transition={{ duration: 0.1 }}
      >
        <div
          className="rounded-full bg-primary"
          style={{
            width: 8,
            height: 8,
            marginLeft: -4,
            marginTop: -4,
          }}
        />
      </motion.div>

      {/* Ring — lags behind */}
      <motion.div
        className="fixed top-0 left-0 z-[9998] pointer-events-none"
        style={{ x: ringX, y: ringY }}
        animate={{
          opacity: visible ? 1 : 0,
          scale: clicking ? 0.8 : hovering ? 1.8 : 1,
        }}
        transition={{ duration: 0.15 }}
      >
        <div
          className="rounded-full border border-primary/50"
          style={{
            width: 36,
            height: 36,
            marginLeft: -18,
            marginTop: -18,
          }}
        />
      </motion.div>
    </>
  );
}
