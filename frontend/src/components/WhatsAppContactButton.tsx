'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

export default function WhatsAppContactButton() {
  const pathname = usePathname();
  const { settings } = useSettings();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, settings.whatsappMessage);

  if (!whatsappUrl) {
    return null;
  }

  return (
    <Link
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(37,211,102,0.32)] transition-transform hover:scale-[1.02] hover:bg-[#20ba59]"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/18">
        <MessageCircle size={20} />
      </span>
      <span className="hidden sm:inline">WhatsApp Us</span>
    </Link>
  );
}
