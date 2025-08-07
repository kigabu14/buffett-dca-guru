import { useState, useEffect } from 'react';

export interface UserSettings {
  displayName: string;
  email: string;
  notifications: {
    priceAlerts: boolean;
    dividendAlerts: boolean;
    dcaReminders: boolean;
    marketNews: boolean;
  };
  theme: string;
  currency: string;
  commissionRate: number;
  refreshInterval: number;
}

const defaultSettings: UserSettings = {
  displayName: 'ผู้ใช้',
  email: 'user@example.com',
  notifications: {
    priceAlerts: true,
    dividendAlerts: true,
    dcaReminders: false,
    marketNews: true
  },
  theme: 'dark',
  currency: 'THB',
  commissionRate: 0.15,
  refreshInterval: 30
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
  };

  return {
    settings,
    updateSettings
  };
};