import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Target, TrendingUp, Brain, Save } from 'lucide-react';

interface AnalysisWeights {
  roe: number;
  debtToEquity: number;
  profitMargin: number;
  operatingMargin: number;
  currentRatio: number;
  peRatio: number;
  dividendYield: number;
  epsGrowth: number;
}

interface AnalysisSettingsData {
  id?: string;
  name: string;
  weights: AnalysisWeights;
  is_default: boolean;
}

const AnalysisSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [settings, setSettings] = useState<AnalysisSettingsData[]>([]);
  const [currentSetting, setCurrentSetting] = useState<AnalysisSettingsData>({
    name: 'การตั้งค่าใหม่',
    is_default: false,
    weights: {
      roe: 20,
      debtToEquity: 15,
      profitMargin: 15,
      operatingMargin: 10,
      currentRatio: 10,
      peRatio: 10,
      dividendYield: 10,
      epsGrowth: 10
    }
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('analysis_settings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSettings((data || []).map(item => ({
        ...item,
        weights: item.weights as unknown as AnalysisWeights
      })));
      
      // Load default setting if available
      const defaultSetting = data?.find(s => s.is_default);
      if (defaultSetting) {
        setCurrentSetting({
          ...defaultSetting,
          weights: defaultSetting.weights as unknown as AnalysisWeights
        });
      }
    } catch (error) {
      console.error('Error fetching analysis settings:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดการตั้งค่าได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async () => {
    if (!user) return;

    try {
      setSaveLoading(true);
      
      const settingData = {
        user_id: user.id,
        name: currentSetting.name,
        weights: currentSetting.weights as any,
        is_default: currentSetting.is_default
      };

      let error;
      if (currentSetting.id) {
        // Update existing setting
        const { error: updateError } = await supabase
          .from('analysis_settings')
          .update(settingData)
          .eq('id', currentSetting.id);
        error = updateError;
      } else {
        // Create new setting
        const { error: insertError } = await supabase
          .from('analysis_settings')
          .insert([settingData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "บันทึกสำเร็จ",
        description: "การตั้งค่าการวิเคราะห์ถูกบันทึกแล้ว"
      });

      await fetchSettings();
    } catch (error) {
      console.error('Error saving analysis settings:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าได้",
        variant: "destructive"
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const loadSetting = (setting: AnalysisSettingsData) => {
    setCurrentSetting(setting);
  };

  const resetToDefault = () => {
    setCurrentSetting({
      name: 'Buffett Style (Default)',
      is_default: true,
      weights: {
        roe: 25,
        debtToEquity: 20,
        profitMargin: 15,
        operatingMargin: 10,
        currentRatio: 10,
        peRatio: 10,
        dividendYield: 5,
        epsGrowth: 5
      }
    });
  };

  const updateWeight = (key: keyof AnalysisWeights, value: number) => {
    setCurrentSetting(prev => ({
      ...prev,
      weights: {
        ...prev.weights,
        [key]: value
      }
    }));
  };

  const getTotalWeight = () => {
    return Object.values(currentSetting.weights).reduce((sum, weight) => sum + weight, 0);
  };

  const normalizeWeights = () => {
    const total = getTotalWeight();
    if (total === 100) return;

    const factor = 100 / total;
    const normalizedWeights = Object.entries(currentSetting.weights).reduce((acc, [key, value]) => {
      acc[key as keyof AnalysisWeights] = Math.round(value * factor);
      return acc;
    }, {} as AnalysisWeights);

    setCurrentSetting(prev => ({
      ...prev,
      weights: normalizedWeights
    }));

    toast({
      title: "ปรับสัดส่วนแล้ว",
      description: "น้ำหนักทั้งหมดถูกปรับให้เท่ากับ 100%"
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-premium bg-clip-text text-transparent">
            ตั้งค่าการวิเคราะห์
          </h1>
          <p className="text-muted-foreground">
            ปรับแต่งน้ำหนักการวิเคราะห์ตามสไตล์การลงทุนของคุณ
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefault}>
            <Target className="mr-2 h-4 w-4" />
            Buffett Style
          </Button>
          <Button 
            onClick={saveSetting} 
            disabled={saveLoading}
            className="bg-gradient-premium hover:shadow-gold"
          >
            <Save className="mr-2 h-4 w-4" />
            {saveLoading ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              การตั้งค่าที่บันทึกไว้
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                  currentSetting.id === setting.id ? 'bg-primary/10 border-primary' : ''
                }`}
                onClick={() => loadSetting(setting)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{setting.name}</span>
                  {setting.is_default && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      ค่าเริ่มต้น
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weight Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {currentSetting.name}
            </CardTitle>
            <CardDescription>
              ปรับน้ำหนักของแต่ละปัจจัยในการวิเคราะห์ (รวม: {getTotalWeight()}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">ปัจจัยพื้นฐาน</TabsTrigger>
                <TabsTrigger value="advanced">ปัจจัยขั้นสูง</TabsTrigger>
                <TabsTrigger value="general">ทั่วไป</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <div className="space-y-2">
                  <Label>ROE (Return on Equity): {currentSetting.weights.roe}%</Label>
                  <Slider
                    value={[currentSetting.weights.roe]}
                    onValueChange={(value) => updateWeight('roe', value[0])}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Debt to Equity Ratio: {currentSetting.weights.debtToEquity}%</Label>
                  <Slider
                    value={[currentSetting.weights.debtToEquity]}
                    onValueChange={(value) => updateWeight('debtToEquity', value[0])}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Profit Margin: {currentSetting.weights.profitMargin}%</Label>
                  <Slider
                    value={[currentSetting.weights.profitMargin]}
                    onValueChange={(value) => updateWeight('profitMargin', value[0])}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Operating Margin: {currentSetting.weights.operatingMargin}%</Label>
                  <Slider
                    value={[currentSetting.weights.operatingMargin]}
                    onValueChange={(value) => updateWeight('operatingMargin', value[0])}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div className="space-y-2">
                  <Label>Current Ratio: {currentSetting.weights.currentRatio}%</Label>
                  <Slider
                    value={[currentSetting.weights.currentRatio]}
                    onValueChange={(value) => updateWeight('currentRatio', value[0])}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>P/E Ratio: {currentSetting.weights.peRatio}%</Label>
                  <Slider
                    value={[currentSetting.weights.peRatio]}
                    onValueChange={(value) => updateWeight('peRatio', value[0])}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Dividend Yield: {currentSetting.weights.dividendYield}%</Label>
                  <Slider
                    value={[currentSetting.weights.dividendYield]}
                    onValueChange={(value) => updateWeight('dividendYield', value[0])}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>EPS Growth: {currentSetting.weights.epsGrowth}%</Label>
                  <Slider
                    value={[currentSetting.weights.epsGrowth]}
                    onValueChange={(value) => updateWeight('epsGrowth', value[0])}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>
              </TabsContent>

              <TabsContent value="general" className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="setting-name">ชื่อการตั้งค่า</Label>
                  <Input
                    id="setting-name"
                    value={currentSetting.name}
                    onChange={(e) => setCurrentSetting(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-default"
                    checked={currentSetting.is_default}
                    onCheckedChange={(checked) => setCurrentSetting(prev => ({ ...prev, is_default: checked }))}
                  />
                  <Label htmlFor="is-default">ตั้งเป็นค่าเริ่มต้น</Label>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>น้ำหนักรวม:</span>
                    <span className={`font-bold ${getTotalWeight() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {getTotalWeight()}%
                    </span>
                  </div>
                  
                  {getTotalWeight() !== 100 && (
                    <Button
                      variant="outline"
                      onClick={normalizeWeights}
                      className="w-full"
                    >
                      ปรับสัดส่วนให้เท่ากับ 100%
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalysisSettings;