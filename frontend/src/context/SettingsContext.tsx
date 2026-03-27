'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, AppSettings } from '@/lib/api';

interface SettingsContextValue {
  settings: AppSettings;
  formatPrice: (amount: number) => string;
  refreshSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'USD',
  currencySymbol: '$',
  whatsappNumber: '+97431685812',
  whatsappMessage: 'Hi, I want to enquire about your products.',
  footerSupportText: 'Need help with size, stock, or custom orders? Message us on WhatsApp.',
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  formatPrice: (amount) => `$${amount.toFixed(2)}`,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const load = async () => {
    try {
      const data = await api.getSettings();
      setSettings({ ...DEFAULT_SETTINGS, ...data });
    } catch {
      // keep defaults
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatPrice = (amount: number) =>
    `${settings.currencySymbol}${amount.toFixed(2)}`;

  return (
    <SettingsContext.Provider value={{ settings, formatPrice, refreshSettings: load }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
