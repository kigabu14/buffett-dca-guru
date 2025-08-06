import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-premium bg-clip-text text-transparent">
            Thai Investment App
          </h1>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <span className="text-sm text-muted-foreground">
              สวัสดี, {user.user_metadata?.display_name || user.email}
            </span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-bold text-foreground">
            ยินดีต้อนรับสู่แอปลงทุนของคุณ
          </h2>
          <p className="text-xl text-muted-foreground">
            ระบบพร้อมใช้งาน กำลังสร้างฟีเจอร์หลักให้คุณ...
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <div className="p-6 rounded-lg border border-border/50 bg-card/50 backdrop-blur">
              <h3 className="text-lg font-semibold text-primary mb-2">📈 พอร์ตการลงทุน</h3>
              <p className="text-sm text-muted-foreground">จัดการหุ้นและคำนวณผลตอบแทน</p>
            </div>
            
            <div className="p-6 rounded-lg border border-border/50 bg-card/50 backdrop-blur">
              <h3 className="text-lg font-semibold text-primary mb-2">🧠 Buffett Analysis</h3>
              <p className="text-sm text-muted-foreground">วิเคราะห์หุ้นตาม 11 เกณฑ์</p>
            </div>
            
            <div className="p-6 rounded-lg border border-border/50 bg-card/50 backdrop-blur">
              <h3 className="text-lg font-semibold text-primary mb-2">💸 เงินปันผล</h3>
              <p className="text-sm text-muted-foreground">ติดตามเงินปันผลและ XD</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
