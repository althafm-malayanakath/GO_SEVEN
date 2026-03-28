'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

const SHOP_LINKS = [
  { href: '/collections', label: 'Collections' },
  { href: '/about', label: 'About' },
  { href: '/account', label: 'Account' },
];

const LEGAL_LINKS = [
  { href: '/terms-and-conditions', label: 'Terms & Conditions' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/cookies-policy', label: 'Cookies Policy' },
  { href: '/copyright', label: 'Copyright Notice' },
];

export default function SiteFooter() {
  const pathname = usePathname();
  const { settings } = useSettings();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const year = new Date().getFullYear();
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, settings.whatsappMessage);

  return (
    <footer className="border-t border-white/15 bg-transparent py-12 text-white/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[auto_1fr_auto] lg:items-start">
          <div className="space-y-4">
            <Image src="/logo-go7-purple.png" alt="Go Seven" width={180} height={104} className="h-12 w-auto" />
            <p className="max-w-sm text-sm text-white/60">
              {settings.footerSupportText}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">Explore</p>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                {SHOP_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">Legal</p>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                {LEGAL_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/12 bg-white/6 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">WhatsApp Support</p>
            <p className="mt-3 text-lg font-bold text-white">{settings.whatsappNumber}</p>
            <p className="mt-2 max-w-xs text-sm text-white/60">
              Direct enquiries, stock checks, and support are available on WhatsApp.
            </p>
            {whatsappUrl && (
              <Link
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#20ba59]"
              >
                <MessageCircle size={18} />
                Chat on WhatsApp
              </Link>
            )}
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-white/50">
          <p>&#169; {year} Go Seven. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
