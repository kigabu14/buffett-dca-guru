import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'th' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  th: {
    // Navigation
    'nav.portfolio': 'พอร์ตการลงทุน',
    'nav.analysis': 'วิเคราะห์หุ้น',
    'nav.dividend': 'เงินปันผล',
    'nav.settings': 'ตั้งค่า',
    
    // Landing Page
    'welcome.title': 'ยินดีต้อนรับสู่แอปลงทุนของคุณ',
    'welcome.subtitle': 'เริ่มสร้างพอร์ตการลงทุนที่ยอดเยียมของคุณที่นี่!',
    'welcome.getStarted': 'เริ่มต้นใช้งาน',
    'welcome.login': 'เข้าสู่ระบบ',
    
    // Common
    'common.save': 'บันทึก',
    'common.cancel': 'ยกเลิก',
    'common.edit': 'แก้ไข',
    'common.delete': 'ลบ',
    'common.loading': 'กำลังโหลด...',
    'common.error': 'เกิดข้อผิดพลาด',
    'common.success': 'สำเร็จ',
    
    // Auth
    'auth.email': 'อีเมล',
    'auth.password': 'รหัสผ่าน',
    'auth.login': 'เข้าสู่ระบบ',
    'auth.signup': 'สมัครสมาชิก',
    'auth.logout': 'ออกจากระบบ',
    'auth.forgotPassword': 'ลืมรหัสผ่าน?',
    
    // Portfolio
    'portfolio.title': 'พอร์ตการลงทุน',
    'portfolio.addStock': 'เพิ่มหุ้น',
    'portfolio.totalValue': 'มูลค่ารวม',
    'portfolio.totalGainLoss': 'กำไร/ขาดทุนรวม',
    'portfolio.dividendYield': 'อัตราผลตอบแทนจากปันผล',
    
    // Stock Analysis
    'analysis.buffettScore': 'คะแนน Buffett',
    'analysis.recommendation': 'คำแนะนำ',
    'analysis.buyMore': 'ควร DCA เพิ่ม',
    'analysis.hold': 'ถือไว้',
    'analysis.reduce': 'ลดหรือขาย',
    
    // Language
    'language.thai': 'ไทย',
    'language.english': 'English',
    'language.select': 'เลือกภาษา'
  },
  en: {
    // Navigation
    'nav.portfolio': 'Portfolio',
    'nav.analysis': 'Stock Analysis',
    'nav.dividend': 'Dividends',
    'nav.settings': 'Settings',
    
    // Landing Page
    'welcome.title': 'Welcome to Your Investment App',
    'welcome.subtitle': 'Start building your amazing investment portfolio here!',
    'welcome.getStarted': 'Get Started',
    'welcome.login': 'Login',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Auth
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.logout': 'Logout',
    'auth.forgotPassword': 'Forgot Password?',
    
    // Portfolio
    'portfolio.title': 'Investment Portfolio',
    'portfolio.addStock': 'Add Stock',
    'portfolio.totalValue': 'Total Value',
    'portfolio.totalGainLoss': 'Total Gain/Loss',
    'portfolio.dividendYield': 'Dividend Yield',
    
    // Stock Analysis
    'analysis.buffettScore': 'Buffett Score',
    'analysis.recommendation': 'Recommendation',
    'analysis.buyMore': 'DCA More',
    'analysis.hold': 'Hold',
    'analysis.reduce': 'Reduce/Sell',
    
    // Language
    'language.thai': 'ไทย',
    'language.english': 'English',
    'language.select': 'Select Language'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('th');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'th' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};