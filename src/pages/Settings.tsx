import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, User, Bell, Palette, Database } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

const Settings = () => {
  const { toast } = useToast();
  const { settings, updateSettings } = useSettings();

  const handleSave = () => {
    updateSettings(settings);
    toast({
      title: "บันทึกการตั้งค่าสำเร็จ",
      description: "การตั้งค่าของคุณถูกบันทึกแล้ว"
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-premium bg-clip-text text-transparent">
          ตั้งค่า
        </h1>
        <p className="text-muted-foreground">
          จัดการการตั้งค่าและการแจ้งเตือนของคุณ
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            โปรไฟล์
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            การแจ้งเตือน
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            ธีม
          </TabsTrigger>
          <TabsTrigger value="trading" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            การเทรด
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลโปรไฟล์</CardTitle>
              <CardDescription>
                จัดการข้อมูลส่วนตัวของคุณ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName">ชื่อที่แสดง</Label>
                <Input
                  id="displayName"
                  value={settings.displayName}
                  onChange={(e) => updateSettings({ displayName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => updateSettings({ email: e.target.value })}
                />
              </div>
              <Button onClick={handleSave}>บันทึกการเปลี่ยนแปลง</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>การแจ้งเตือน</CardTitle>
              <CardDescription>
                เลือกประเภทการแจ้งเตือนที่คุณต้องการรับ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>แจ้งเตือนราคาหุ้น</Label>
                  <p className="text-sm text-muted-foreground">
                    รับการแจ้งเตือนเมื่อราคาหุ้นเปลี่ยนแปลงตามที่กำหนด
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.priceAlerts}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      notifications: { ...settings.notifications, priceAlerts: checked }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>แจ้งเตือนเงินปันผล</Label>
                  <p className="text-sm text-muted-foreground">
                    รับการแจ้งเตือนเมื่อมีการประกาศจ่ายเงินปันผล
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.dividendAlerts}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      notifications: { ...settings.notifications, dividendAlerts: checked }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>แจ้งเตือน DCA</Label>
                  <p className="text-sm text-muted-foreground">
                    รับการแจ้งเตือนเพื่อทำ DCA ตามกำหนดเวลา
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.dcaReminders}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      notifications: { ...settings.notifications, dcaReminders: checked }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ข่าวตลาดหุ้น</Label>
                  <p className="text-sm text-muted-foreground">
                    รับข่าวสารและการอัพเดทจากตลาดหุ้น
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.marketNews}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      notifications: { ...settings.notifications, marketNews: checked }
                    })
                  }
                />
              </div>
              <Button onClick={handleSave}>บันทึกการตั้งค่า</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>ธีมและการแสดงผล</CardTitle>
              <CardDescription>
                ปรับแต่งรูปลักษณ์ของแอปพลิเคชัน
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="theme">ธีม</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => updateSettings({ theme: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">สว่าง</SelectItem>
                    <SelectItem value="dark">มืด</SelectItem>
                    <SelectItem value="system">ตามระบบ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">สกุลเงินหลัก</Label>
                <Select
                  value={settings.currency}
                  onValueChange={(value) => updateSettings({ currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="THB">บาทไทย (THB)</SelectItem>
                    <SelectItem value="USD">ดอลลาร์สหรัฐ (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="refreshInterval">ความถี่ในการอัพเดท (วินาที)</Label>
                <Select
                  value={settings.refreshInterval.toString()}
                  onValueChange={(value) => updateSettings({ refreshInterval: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 วินาที</SelectItem>
                    <SelectItem value="30">30 วินาที</SelectItem>
                    <SelectItem value="60">1 นาที</SelectItem>
                    <SelectItem value="300">5 นาที</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave}>บันทึกการตั้งค่า</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading Settings */}
        <TabsContent value="trading">
          <Card>
            <CardHeader>
              <CardTitle>การตั้งค่าการเทรด</CardTitle>
              <CardDescription>
                ตั้งค่าที่เกี่ยวข้องกับการซื้อขายหุ้น
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="commissionRate">อัตราค่าคอมมิชชั่น (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={settings.commissionRate}
                  onChange={(e) => updateSettings({ commissionRate: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-sm text-muted-foreground">
                  อัตราค่าคอมมิชชั่นที่โบรกเกอร์เรียกเก็บต่อการซื้อขาย
                </p>
              </div>
              <Button onClick={handleSave}>บันทึกการตั้งค่า</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;