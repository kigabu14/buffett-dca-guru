import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAnalysisSettings, AnalysisWeights } from '@/hooks/useAnalysisSettings';
import { Settings, Save, Trash2, Star, TrendingUp, Shield, DollarSign } from 'lucide-react';

const AnalysisSettings = () => {
  const { toast } = useToast();
  const {
    settings,
    currentSettings,
    loading,
    saveSettings,
    updateSettings,
    deleteSettings,
    setAsDefault,
    setCurrentSettings,
    getPresetWeights,
    defaultBuffettWeights,
    customPresets
  } = useAnalysisSettings();

  const [newSettingsName, setNewSettingsName] = useState('');
  const [editingWeights, setEditingWeights] = useState<AnalysisWeights>(currentSettings.weights);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const criteriaInfo = [
    { key: 'roe', label: 'ROE (Return on Equity)', icon: TrendingUp, description: 'ผลตอบแทนต่อส่วนของเจ้าของ' },
    { key: 'debtEquity', label: 'Debt to Equity Ratio', icon: Shield, description: 'อัตราส่วนหนี้สินต่อส่วนของเจ้าของ' },
    { key: 'netProfitMargin', label: 'Net Profit Margin', icon: DollarSign, description: 'อัตรากำไรสุทธิ' },
    { key: 'freeCashFlow', label: 'Free Cash Flow', icon: DollarSign, description: 'กระแสเงินสดอิสระ' },
    { key: 'epsGrowth', label: 'EPS Growth', icon: TrendingUp, description: 'การเติบโตของกำไรต่อหุ้น' },
    { key: 'operatingMargin', label: 'Operating Margin', icon: DollarSign, description: 'อัตรากำไรจากการดำเนินงาน' },
    { key: 'currentRatio', label: 'Current Ratio', icon: Shield, description: 'อัตราส่วนสภาพคล่อง' },
    { key: 'shareDilution', label: 'Share Dilution', icon: Shield, description: 'การเจือจางหุ้น' },
    { key: 'roa', label: 'ROA (Return on Assets)', icon: TrendingUp, description: 'ผลตอบแทนต่อสินทรัพย์' },
    { key: 'moat', label: 'Economic Moat', icon: Shield, description: 'คูเศรษฐกิจ' },
    { key: 'management', label: 'Management Quality', icon: Star, description: 'คุณภาพผู้บริหาร' }
  ];

  const handleWeightChange = (key: keyof AnalysisWeights, value: number[]) => {
    setEditingWeights(prev => ({
      ...prev,
      [key]: value[0]
    }));
  };

  const handlePresetSelect = (presetName: string) => {
    if (presetName === 'buffett') {
      setEditingWeights(defaultBuffettWeights);
    } else if (presetName in customPresets) {
      setEditingWeights(getPresetWeights(presetName as keyof typeof customPresets));
    }
    setSelectedPreset(presetName);
  };

  const handleSaveSettings = async () => {
    if (!newSettingsName.trim()) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณาใส่ชื่อการตั้งค่า",
        variant: "destructive"
      });
      return;
    }

    try {
      await saveSettings({
        name: newSettingsName,
        weights: editingWeights,
        is_default: false
      });

      toast({
        title: "บันทึกสำเร็จ",
        description: "การตั้งค่าการวิเคราะห์ถูกบันทึกแล้ว"
      });

      setNewSettingsName('');
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าได้",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSettings = async (id: string) => {
    try {
      await deleteSettings(id);
      toast({
        title: "ลบสำเร็จ",
        description: "การตั้งค่าถูกลบแล้ว"
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบการตั้งค่าได้",
        variant: "destructive"
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setAsDefault(id);
      toast({
        title: "ตั้งเป็นค่าเริ่มต้นสำเร็จ",
        description: "การตั้งค่านี้จะถูกใช้เป็นค่าเริ่มต้น"
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถตั้งเป็นค่าเริ่มต้นได้",
        variant: "destructive"
      });
    }
  };

  const totalWeight = Object.values(editingWeights).reduce((sum, weight) => sum + weight, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-premium bg-clip-text text-transparent">
          ตั้งค่าการวิเคราะห์ Custom
        </h1>
        <p className="text-muted-foreground">
          ปรับน้ำหนักของ 11 หลักการวิเคราะห์ตามสไตล์การลงทุนของคุณ
        </p>
      </div>

      <Tabs defaultValue="weights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weights">ปรับน้ำหนัก</TabsTrigger>
          <TabsTrigger value="saved">การตั้งค่าที่บันทึก</TabsTrigger>
        </TabsList>

        <TabsContent value="weights" className="space-y-6">
          {/* Preset Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                เลือกแบบสำเร็จรูป
              </CardTitle>
              <CardDescription>
                เลือกสไตล์การลงทุนเพื่อเป็นจุดเริ่มต้น
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedPreset} onValueChange={handlePresetSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกแบบสำเร็จรูป" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buffett">Buffett Default (แบบดั้งเดิม)</SelectItem>
                  <SelectItem value="Conservative">Conservative (เน้นความปลอดภัย)</SelectItem>
                  <SelectItem value="Growth Focused">Growth Focused (เน้นการเติบโต)</SelectItem>
                  <SelectItem value="Value Investing">Value Investing (เน้นหาหุ้นถูก)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Weight Adjustment */}
          <Card>
            <CardHeader>
              <CardTitle>ปรับน้ำหนักการวิเคราะห์</CardTitle>
              <CardDescription>
                น้ำหนักรวม: {totalWeight} คะแนน
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {criteriaInfo.map((criteria) => {
                const IconComponent = criteria.icon;
                const weight = editingWeights[criteria.key as keyof AnalysisWeights];
                const percentage = totalWeight > 0 ? (weight / totalWeight * 100).toFixed(1) : '0';
                
                return (
                  <div key={criteria.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-primary" />
                        <div>
                          <Label className="font-medium">{criteria.label}</Label>
                          <p className="text-xs text-muted-foreground">{criteria.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{percentage}%</Badge>
                        <span className="text-sm font-medium min-w-[40px] text-center">
                          {weight}
                        </span>
                      </div>
                    </div>
                    <Slider
                      value={[weight]}
                      onValueChange={(value) => handleWeightChange(criteria.key as keyof AnalysisWeights, value)}
                      max={20}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Save Settings */}
          <Card>
            <CardHeader>
              <CardTitle>บันทึกการตั้งค่า</CardTitle>
              <CardDescription>
                บันทึกการตั้งค่าน้ำหนักปัจจุบันเพื่อใช้ในอนาคต
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="ชื่อการตั้งค่า เช่น My Custom Strategy"
                  value={newSettingsName}
                  onChange={(e) => setNewSettingsName(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSaveSettings}
                  className="bg-gradient-premium hover:shadow-gold"
                >
                  <Save className="h-4 w-4 mr-2" />
                  บันทึก
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>การตั้งค่าที่บันทึกไว้</CardTitle>
              <CardDescription>
                จัดการการตั้งค่าการวิเคราะห์ที่บันทึกไว้
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">กำลังโหลด...</div>
              ) : settings.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  ยังไม่มีการตั้งค่าที่บันทึกไว้
                </div>
              ) : (
                <div className="space-y-3">
                  {settings.map((setting) => (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{setting.name}</div>
                          <div className="text-sm text-muted-foreground">
                            น้ำหนักรวม: {Object.values(setting.weights).reduce((sum, w) => sum + w, 0)} คะแนน
                          </div>
                        </div>
                        {setting.is_default && (
                          <Badge className="bg-gradient-premium">ค่าเริ่มต้น</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingWeights(setting.weights);
                            setCurrentSettings(setting);
                          }}
                        >
                          ใช้งาน
                        </Button>
                        {!setting.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(setting.id!)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSettings(setting.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisSettings;