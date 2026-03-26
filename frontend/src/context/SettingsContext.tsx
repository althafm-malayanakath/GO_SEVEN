'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, AppSettings } from '@/lib/api';

interface SettingsContextValue {
  settings: AppSettings;
  formatPrice: (amount: number) => string;
  refreshSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = { currency: 'USD', currencySymbol: '$' };

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
      setSettings(data);
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
