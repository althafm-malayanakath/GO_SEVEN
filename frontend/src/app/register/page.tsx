'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isReady } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    whatsappOptIn: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const redirectTo = searchParams.get('redirect');

  React.useEffect(() => {
    if (!isReady || !user) {
      return;
    }

    router.replace(redirectTo || (user.role === 'admin' ? '/admin/products' : '/'));
  }, [isReady, redirectTo, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const user = await api.register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        whatsappOptIn: form.whatsappOptIn,
      });
      login(user);
      router.push(redirectTo || (user.role === 'admin' ? '/admin/products' : '/'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-3xl p-8"
      >
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black text-white">GO SEVEN</Link>
          <h1 className="text-2xl font-bold text-white mt-4">Join the movement</h1>
          <p className="text-white/60 text-sm mt-1">Create your account</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/60 transition-colors"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/60 transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">WhatsApp Number</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/60 transition-colors"
              placeholder="+919876543210"
            />
            <p className="mt-1 text-xs text-white/55">Use the number with country code.</p>
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/60 transition-colors"
              placeholder="Min. 6 characters"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/60 transition-colors"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
            />
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={form.whatsappOptIn}
              onChange={(e) => setForm({ ...form, whatsappOptIn: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-white/30 bg-transparent"
            />
            <span>
              I agree to receive order updates and confirmations on WhatsApp.
            </span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-primary font-bold hover:bg-accent transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating accountâ€¦' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-white/60 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-white font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center pt-24"><div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}
