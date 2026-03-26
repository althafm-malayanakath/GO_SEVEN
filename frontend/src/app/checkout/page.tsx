'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, ShieldCheck, ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isReady, login } = useAuth();
  const { items, totalItems, totalPrice, clearCart } = useCart();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'India',
    whatsappOptIn: false,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!user) {
      router.replace('/login?redirect=/checkout');
      return;
    }

    setForm((current) => ({
      ...current,
      name: current.name || user.name,
      phone: current.phone || user.phone || '',
      whatsappOptIn: current.whatsappOptIn || Boolean(user.whatsappOptIn),
    }));
  }, [isReady, router, user]);

  const tax = useMemo(() => totalPrice * 0.08, [totalPrice]);
  const shipping = useMemo(() => (totalPrice > 150 ? 0 : 12.99), [totalPrice]);
  const orderTotal = useMemo(() => totalPrice + tax + shipping, [shipping, tax, totalPrice]);

  const handlePlaceOrder = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!user) {
      setError('Please sign in to continue.');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    if (!PHONE_PATTERN.test(form.phone.trim())) {
      setError('Phone number must be in international format, for example +919876543210.');
      return;
    }

    setSubmitting(true);

    try {
      const updatedUser = await api.updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        whatsappOptIn: form.whatsappOptIn,
      });

      login(updatedUser);

      const order = await api.createOrder({
        orderItems: items.map((item) => ({
          name: item.product.name,
          qty: item.qty,
          image: item.product.images[0]?.url || 'https://placehold.co/200x200/6A0DAD/ffffff?text=Go+Seven',
          price: item.product.price,
          product: item.product._id,
          ...(item.size ? { size: item.size } : {}),
          ...(item.color ? { color: item.color } : {}),
        })),
        customerPhone: form.phone.trim(),
        whatsappOptIn: form.whatsappOptIn,
        shippingAddress: {
          address: form.address.trim(),
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim(),
        },
        paymentMethod: 'Cash on Delivery',
        itemsPrice: totalPrice,
        taxPrice: tax,
        shippingPrice: shipping,
        totalPrice: orderTotal,
      });

      clearCart();
      router.push(`/orders/${order._id}?success=true`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isReady || (!user && items.length > 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen px-4 pt-28 pb-16">
        <div className="mx-auto max-w-2xl rounded-[30px] border border-white/15 bg-white/10 p-8 text-center shadow-[0_24px_60px_rgba(16,0,28,0.28)] backdrop-blur">
          <ShoppingBag size={44} className="mx-auto mb-5 text-white/75" />
          <h1 className="text-3xl font-black">Your cart is empty</h1>
          <p className="mt-3 text-white/75">Add products before starting checkout.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/collections"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-primary transition-colors hover:bg-accent"
            >
              Browse products
            </Link>
            <Link
              href="/cart"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Back to cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push('/cart')}
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} /> Back to cart
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] border border-white/15 bg-white/10 p-6 shadow-[0_24px_70px_rgba(16,0,28,0.24)] backdrop-blur"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Checkout</p>
            <h1 className="mt-3 text-4xl font-black">Complete Your Order</h1>
            <p className="mt-3 max-w-2xl text-white/75">
              Orders are saved first. WhatsApp confirmations are sent after that, so your order will still appear in admin even if messaging is unavailable.
            </p>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handlePlaceOrder} className="mt-8 space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white/82">Full name</span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-2xl border border-white/18 bg-white/10 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-white/35"
                    placeholder="Customer name"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white/82">WhatsApp number</span>
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    className="w-full rounded-2xl border border-white/18 bg-white/10 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-white/35"
                    placeholder="+919876543210"
                    required
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-white/82">Address</span>
                  <input
                    value={form.address}
                    onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                    className="w-full rounded-2xl border border-white/18 bg-white/10 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-white/35"
                    placeholder="House name, street, area"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white/82">City</span>
                  <input
                    value={form.city}
                    onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                    className="w-full rounded-2xl border border-white/18 bg-white/10 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-white/35"
                    placeholder="Kochi"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white/82">Postal code</span>
                  <input
                    value={form.postalCode}
                    onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))}
                    className="w-full rounded-2xl border border-white/18 bg-white/10 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-white/35"
                    placeholder="682001"
                    required
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-white/82">Country</span>
                  <input
                    value={form.country}
                    onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
                    className="w-full rounded-2xl border border-white/18 bg-white/10 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-white/35"
                    placeholder="India"
                    required
                  />
                </label>
              </div>

              <div className="rounded-[28px] border border-white/14 bg-white/8 p-5">
                <div className="flex items-start gap-3">
                  <MessageCircle size={20} className="mt-1 shrink-0 text-white/85" />
                  <div>
                    <h2 className="text-lg font-black">WhatsApp Updates</h2>
                    <p className="mt-1 text-sm text-white/72">
                      Enable this to receive an order confirmation on WhatsApp after checkout. Admin notifications are sent separately.
                    </p>
                  </div>
                </div>
                <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/12 bg-white/6 px-4 py-4 text-sm text-white/82">
                  <input
                    type="checkbox"
                    checked={form.whatsappOptIn}
                    onChange={(event) => setForm((current) => ({ ...current, whatsappOptIn: event.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-white/35 bg-transparent"
                  />
                  <span>I agree to receive order confirmations and updates on WhatsApp.</span>
                </label>
              </div>

              <div className="rounded-[28px] border border-[#ffe8a6]/30 bg-[#fff2c2]/12 p-5 text-sm text-[#fff1c2]">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Payment method</p>
                    <p className="mt-1">Cash on Delivery only. You can place the order now and pay manually on fulfillment.</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-4 text-base font-bold text-primary transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Placing order...' : 'Place order'}
              </button>
            </form>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="h-fit rounded-[32px] border border-white/15 bg-white/10 p-6 shadow-[0_24px_70px_rgba(16,0,28,0.24)] backdrop-blur"
          >
            <h2 className="text-2xl font-black">Order Summary</h2>
            <p className="mt-1 text-sm text-white/70">{totalItems} item(s)</p>

            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div key={item.cartKey || item.product._id} className="grid gap-4 rounded-[24px] border border-white/12 bg-white/8 p-4 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center">
                  <div className="relative h-20 overflow-hidden rounded-2xl bg-white/10">
                    <Image
                      src={item.product.images[0]?.url || 'https://placehold.co/200x200/6A0DAD/ffffff?text=Go+Seven'}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{item.product.name}</p>
                    <p className="mt-1 text-sm text-white/65">Qty: {item.qty}</p>
                    {(item.size || item.color) && (
                      <p className="mt-1 text-sm text-white/65">
                        {item.size ? `Size: ${item.size}` : ''}
                        {item.size && item.color ? ' · ' : ''}
                        {item.color ? `Color: ${item.color}` : ''}
                      </p>
                    )}
                  </div>
                  <p className="text-base font-black text-white">${(item.product.price * item.qty).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 text-sm text-white/78">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-white">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-white">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax</span>
                <span className="font-semibold text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/12 pt-3 text-base">
                <span className="font-semibold text-white">Total</span>
                <span className="text-xl font-black text-white">${orderTotal.toFixed(2)}</span>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
