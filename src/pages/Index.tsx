import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Language Selector */}
      <header className="flex justify-between items-center p-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">Thai Investment App</h1>
        <LanguageSelector />
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center space-y-6 max-w-2xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            {t('welcome.title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('welcome.subtitle')}
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="text-lg px-8">
              {t('welcome.getStarted')}
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8">
              {t('welcome.login')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
