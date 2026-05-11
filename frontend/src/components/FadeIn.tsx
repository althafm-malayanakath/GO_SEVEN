'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInView({
  children,
  className,
  scale = false,
}: {
  children: ReactNode;
  className?: string;
  scale?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: scale ? 0 : 20, scale: scale ? 0.95 : 1 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
