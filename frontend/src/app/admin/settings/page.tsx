'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { api, AppSettings } from '@/lib/api';
import { useSettings } from '@/context/SettingsContext';

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'AED', symbol: 'AED ', label: 'UAE Dirham' },
  { code: 'SAR', symbol: 'SAR ', label: 'Saudi Riyal' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  { code: 'MYR', symbol: 'RM', label: 'Malaysian Ringgit' },
  { code: 'LKR', symbol: 'Rs ', label: 'Sri Lankan Rupee' },
];

export default function AdminSettingsPage() {
  const { settings, refreshSettings } = useSettings();
  const [selected, setSelected] = useState<AppSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelected(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.updateSettings(selected);
      await refreshSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-black mb-2">Store Settings</h1>
      <p className="text-white/60 mb-10">Configure global settings for your storefront.</p>

      <div className="rounded-3xl border border-purple-200/30 bg-white/5 p-6">
        <h2 className="text-lg font-bold mb-1">Currency</h2>
        <p className="text-sm text-white/50 mb-5">All prices will be displayed in the selected currency.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelected((current) => ({ ...current, currency: c.code, currencySymbol: c.symbol }))}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-left transition-colors ${
                selected.currency === c.code
                  ? 'border-primary bg-primary/10 text-white'
                  : 'border-white/10 text-white/70 hover:border-primary/50'
              }`}
            >
              <div>
                <span className="block font-bold text-sm">{c.code} — {c.symbol}</span>
                <span className="text-xs text-white/50">{c.label}</span>
              </div>
              {selected.currency === c.code && <Check size={16} className="text-primary" />}
            </button>
          ))}
        </div>

        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold mb-1">WhatsApp Contact</h2>
          <p className="text-sm text-white/50 mb-5">This number and message power customer contact buttons and footer links.</p>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white/80">Admin WhatsApp Number</span>
              <input
                value={selected.whatsappNumber}
                onChange={(event) => setSelected({ ...selected, whatsappNumber: event.target.value })}
                placeholder="+97431685812"
                className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white/80">Default WhatsApp Message</span>
              <textarea
                value={selected.whatsappMessage}
                onChange={(event) => setSelected({ ...selected, whatsappMessage: event.target.value })}
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white/80">Footer Support Text</span>
              <textarea
                value={selected.footerSupportText}
                onChange={(event) => setSelected({ ...selected, footerSupportText: event.target.value })}
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-primary"
              />
            </label>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-full bg-primary text-white py-3 font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
