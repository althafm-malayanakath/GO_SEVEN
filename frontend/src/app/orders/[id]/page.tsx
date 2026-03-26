'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CreditCard, CheckCircle2, MapPin, MessageCircle, Package, ShieldCheck } from 'lucide-react';
import { api, Order, OrderStatus } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const ORDER_STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export default function OrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const { id } = useParams<{ id: string }>();
  const { user, isReady, isAdmin } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusDraft, setStatusDraft] = useState<OrderStatus>('Pending');
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!user) {
      router.push(`/login?redirect=/orders/${id}`);
      return;
    }

    if (!id) {
      return;
    }

    api.getOrder(id)
      .then((nextOrder) => {
        setOrder(nextOrder);
        setStatusDraft(nextOrder.status as OrderStatus);
        setError('');
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load order details.');
      })
      .finally(() => setLoading(false));
  }, [id, isReady, router, user]);

  if (!isReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!order || error) {
    return (
      <div className="min-h-screen px-4 pt-28 pb-16">
        <div className="mx-auto max-w-2xl rounded-[30px] border border-white/15 bg-white/10 p-8 text-center shadow-[0_24px_60px_rgba(16,0,28,0.28)] backdrop-blur">
          <h1 className="text-3xl font-black">Order unavailable</h1>
          <p className="mt-3 text-white/75">{error || 'This order could not be loaded.'}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/account"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-primary transition-colors hover:bg-accent"
            >
              Back to account
            </Link>
            <Link
              href="/collections"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleStatusSave = async () => {
    if (!isAdmin || !order || statusDraft === order.status) {
      return;
    }

    setSavingStatus(true);

    try {
      const updatedOrder = await api.updateOrderStatus(order._id, statusDraft);
      setOrder(updatedOrder);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update order status.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleWhatsAppChat = () => {
    if (!order) return;

    const adminNumber = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN_NUMBER || '+97431685812';
    const cleanNumber = adminNumber.replace(/\D/g, '');

    let productSummary = '';
    order.orderItems.forEach((item, index) => {
      productSummary += `\n🛍️ *Item ${index + 1}:* ${item.name}`;
      productSummary += `\n   Quantity: ${item.qty}`;
      if (item.size) productSummary += `\n   Size: ${item.size}`;
      if (item.color) productSummary += `\n   Color: ${item.color}`;
      if (item.image) productSummary += `\n   Image: ${item.image}`;
      productSummary += '\n';
    });

    const message = `Hello! I have just placed a new order.

📌 *Order ID:* #${order._id.slice(-8).toUpperCase()}
👤 *Customer:* ${order.customerName}
📞 *Phone:* ${order.customerPhone}
💰 *Total:* ${formatCurrency(order.totalPrice)}

📦 *Order Details:*${productSummary}
📍 *Shipping Address:*
${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}

Looking forward to the update!`;

    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {isSuccess && (
          <section className="mb-8 overflow-hidden rounded-[32px] border border-green-500/30 bg-green-500/10 shadow-[0_20px_50px_rgba(34,197,94,0.15)] backdrop-blur-md">
            <div className="flex flex-col items-center gap-6 p-8 text-center md:flex-row md:text-left md:items-start md:p-10">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-green-500/20 text-green-400">
                <CheckCircle2 size={32} />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-black text-white">Order successfully placed!</h2>
                <p className="mt-2 text-lg text-white/75">
                  Thank you for shopping with Go Seven. Your order <span className="font-bold text-white">#{order._id.slice(-8).toUpperCase()}</span> is now being processed.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <button
                    onClick={handleWhatsAppChat}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-[#20bd5a] active:scale-[0.98]"
                  >
                    <MessageCircle size={22} fill="white" className="text-[#25D366]" />
                    Chat with Admin on WhatsApp
                  </button>
                  <Link
                    href="/collections"
                    className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-white/10"
                  >
                    Continue shopping
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-[30px] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Order</p>
              <h1 className="mt-3 text-3xl font-black">#{order._id.slice(-8).toUpperCase()}</h1>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-white/12 px-4 py-2 text-white/80">
                  Placed {new Date(order.createdAt).toLocaleDateString()}
                </span>
                <span className="rounded-full bg-white/12 px-4 py-2 text-white/80">
                  Status: <span className="font-semibold text-white">{order.status}</span>
                </span>
                <span className="rounded-full bg-white/12 px-4 py-2 text-white/80">
                  Payment: <span className="font-semibold text-white">{order.isPaid ? 'Paid' : 'Pending'}</span>
                </span>
              </div>
            </section>

            <section className="rounded-[30px] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Items</h2>
                  <p className="text-sm text-white/70">{order.orderItems.length} item(s)</p>
                </div>
              </div>

              <div className="space-y-4">
                {order.orderItems.map((item, index) => (
                  <div key={`${item.product}-${index}`} className="grid gap-4 rounded-[24px] border border-white/12 bg-white/8 p-4 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center">
                    <div className="relative h-24 overflow-hidden rounded-2xl bg-white/10">
                      <Image
                        src={item.image || 'https://placehold.co/200x200/6A0DAD/ffffff?text=Go+Seven'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <Link href={`/product/${item.product}`} className="text-lg font-bold transition-colors hover:text-accent">
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm text-white/70">Quantity: {item.qty}</p>
                      {(item.size || item.color) && (
                        <p className="mt-1 text-sm text-white/70">
                          {item.size ? `Size: ${item.size}` : ''}
                          {item.size && item.color ? ' · ' : ''}
                          {item.color ? `Color: ${item.color}` : ''}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-white/70">Unit price: {formatCurrency(item.price)}</p>
                    </div>
                    <p className="text-lg font-black text-white">{formatCurrency(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {isAdmin && order.user && (
              <section className="rounded-[30px] border border-white/15 bg-white/10 p-6 backdrop-blur">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                    <ShieldCheck size={20} />
                  </div>
                  <h2 className="text-2xl font-black">Customer</h2>
                </div>
                <div className="space-y-2 text-sm text-white/78">
                  <p className="font-semibold text-white">{order.user.name}</p>
                  <p>{order.user.email}</p>
                  <p>{order.customerPhone}</p>
                </div>
              </section>
            )}

            {isAdmin && (
              <section className="rounded-[30px] border border-white/15 bg-white/10 p-6 backdrop-blur">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Admin</p>
                    <h2 className="mt-2 text-2xl font-black">Fulfillment Status</h2>
                  </div>
                  <Link
                    href="/admin/orders"
                    className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    All orders
                  </Link>
                </div>
                <div className="space-y-3">
                  <select
                    value={statusDraft}
                    onChange={(event) => setStatusDraft(event.target.value as OrderStatus)}
                    className="w-full rounded-full border border-white/18 bg-white/10 px-4 py-3 text-sm font-semibold text-white outline-none transition-colors focus:border-white/35"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status} className="text-black">
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void handleStatusSave()}
                    disabled={savingStatus || statusDraft === order.status}
                    className="inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingStatus ? 'Saving...' : 'Save status'}
                  </button>
                </div>
              </section>
            )}

            <section className="rounded-[30px] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                  <MapPin size={20} />
                </div>
                <h2 className="text-2xl font-black">Shipping</h2>
              </div>
              <div className="space-y-2 text-sm text-white/78">
                <p className="font-semibold text-white">{order.customerName}</p>
                <p>{order.customerPhone}</p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </section>

            <section className="rounded-[30px] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-2xl font-black">WhatsApp</h2>
              </div>
              <div className="space-y-3 text-sm text-white/78">
                <div>
                  <p className="font-semibold text-white">Customer notification</p>
                  <p>
                    {order.notifications?.customer?.sent
                      ? `Sent${order.notifications.customer.sentAt ? ` on ${new Date(order.notifications.customer.sentAt).toLocaleString()}` : ''}`
                      : order.notifications?.customer?.error || 'Not sent'}
                  </p>
                </div>
                {isAdmin && (
                  <div>
                    <p className="font-semibold text-white">Admin notification</p>
                    <p>
                      {order.notifications?.admin?.sent
                        ? `Sent${order.notifications.admin.sentAt ? ` on ${new Date(order.notifications.admin.sentAt).toLocaleString()}` : ''}`
                        : order.notifications?.admin?.error || 'Not sent'}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[30px] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                  <CreditCard size={20} />
                </div>
                <h2 className="text-2xl font-black">Payment</h2>
              </div>
              <div className="space-y-2 text-sm text-white/78">
                <p>Method: <span className="font-semibold text-white">{order.paymentMethod}</span></p>
                <p>Payment status: <span className="font-semibold text-white">{order.isPaid ? 'Paid' : 'Awaiting payment'}</span></p>
                {order.paidAt && <p>Paid on: {new Date(order.paidAt).toLocaleString()}</p>}
              </div>
            </section>

            <section className="rounded-[30px] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <h2 className="text-2xl font-black">Summary</h2>
              <div className="mt-5 space-y-3 text-sm text-white/78">
                <div className="flex items-center justify-between">
                  <span>Items</span>
                  <span className="font-semibold text-white">{formatCurrency(order.itemsPrice ?? order.totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-white">{formatCurrency(order.shippingPrice ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax</span>
                  <span className="font-semibold text-white">{formatCurrency(order.taxPrice ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/12 pt-3 text-base">
                  <span className="font-semibold text-white">Total</span>
                  <span className="text-xl font-black text-white">{formatCurrency(order.totalPrice)}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
