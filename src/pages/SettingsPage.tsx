import React, { useState, useEffect } from 'react';
import { Cog, Bell, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { initializeNotifications } from '../services/notificationService';

interface SettingsOption {
  id: string;
  name: string;
  description: string;
  default: boolean;
}

const themeOptions = [
  { id: 'dark-green-theme', name: 'الأخضر الداكن' },
  { id: 'light-green-theme', name: 'الأخضر الفاتح' },
  { id: 'brown-orange-theme', name: 'البني البرتقالي' },
];
const fontColorOptions = [
  { id: 'font-white', name: 'أبيض' },
  { id: 'font-black', name: 'أسود' },
];

const SettingsPage: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [theme, setTheme] = useState('dark-green-theme');
  const [fontColor, setFontColor] = useState('font-black');

  useEffect(() => {
    // Load settings from localStorage
    const loadSettings = () => {
      const notifs = localStorage.getItem('notifications-enabled');
      if (notifs !== null) setNotificationsEnabled(notifs !== 'false');
      const sounds = localStorage.getItem('sounds-enabled');
      if (sounds !== null) setSoundsEnabled(sounds !== 'false');
      const darkMode = localStorage.getItem('dark-mode-enabled');
      if (darkMode !== null) setDarkModeEnabled(darkMode === 'true');
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) setTheme(savedTheme);
      const savedFontColor = localStorage.getItem('font-color');
      if (savedFontColor) setFontColor(savedFontColor);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    document.body.classList.remove('dark-green-theme', 'light-green-theme', 'brown-orange-theme');
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.remove('font-white', 'font-black');
    document.body.classList.add(fontColor);
    localStorage.setItem('font-color', fontColor);
  }, [fontColor]);

  const toggleSetting = (settingId: string, value: boolean) => {
    switch (settingId) {
      case 'notifications':
        localStorage.setItem('notifications-enabled', value ? 'true' : 'false');
        setNotificationsEnabled(value);
        if (value) {
          initializeNotifications().then(result => {
            if (result) {
              toast.success('تم تفعيل الإشعارات');
            } else {
              setNotificationsEnabled(false);
              localStorage.setItem('notifications-enabled', 'false');
              toast.error('تعذر تفعيل الإشعارات. يرجى التحقق من إذونات التطبيق');
            }
          });
        } else {
          toast.info('تم إيقاف الإشعارات');
        }
        break;
      case 'sounds':
        localStorage.setItem('sounds-enabled', value ? 'true' : 'false');
        setSoundsEnabled(value);
        toast.info(value ? 'تم تفعيل الأصوات' : 'تم إيقاف الأصوات');
        break;
      case 'dark-mode':
        localStorage.setItem('dark-mode-enabled', value ? 'true' : 'false');
        setDarkModeEnabled(value);
        document.documentElement.classList.toggle('dark', value);
        toast.info(value ? 'تم تفعيل الوضع الداكن' : 'تم إيقاف الوضع الداكن');
        break;
      default:
        break;
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-islamic-green text-center mb-6">الإعدادات</h1>
      
      <Card className="mb-4 islamic-card islamic-pattern-border">
        <CardHeader>
          <CardTitle className="flex items-center text-islamic-green">
            <Bell className="ml-2" /> الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">تفعيل الإشعارات</Label>
              <p className="text-sm text-gray-500">إشعارات لمواقيت الصلاة والأذكار</p>
            </div>
            <Switch 
              checked={notificationsEnabled} 
              onCheckedChange={(value) => toggleSetting('notifications', value)} 
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-4 islamic-card islamic-pattern-border">
        <CardHeader>
          <CardTitle className="flex items-center text-islamic-green">
            <Volume2 className="ml-2" /> الأصوات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">تفعيل الأصوات</Label>
              <p className="text-sm text-gray-500">صوت الأذان وتلاوة القرآن</p>
            </div>
            <Switch 
              checked={soundsEnabled} 
              onCheckedChange={(value) => toggleSetting('sounds', value)} 
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-4 islamic-card islamic-pattern-border">
        <CardHeader>
          <CardTitle className="flex items-center text-islamic-green">
            <Cog className="ml-2" /> المظهر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-base">سمة الألوان</Label>
              <div className="flex flex-wrap gap-2 mt-2 w-full">
                {themeOptions.map(opt => (
                  <Button
                    key={opt.id}
                    variant={theme === opt.id ? 'default' : 'outline'}
                    className={`min-w-[120px] sm:min-w-[100px] flex-1 ${theme === opt.id ? 'bg-islamic-green text-white' : ''}`}
                    onClick={() => setTheme(opt.id)}
                  >
                    {opt.name}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-base">لون الخط</Label>
              <div className="flex flex-wrap gap-2 mt-2 w-full">
                {fontColorOptions.map(opt => (
                  <Button
                    key={opt.id}
                    variant={fontColor === opt.id ? 'default' : 'outline'}
                    className={`min-w-[100px] sm:min-w-[80px] flex-1 ${fontColor === opt.id ? 'bg-islamic-gold text-black' : ''}`}
                    onClick={() => setFontColor(opt.id)}
                  >
                    {opt.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div>
                <Label className="text-base">الوضع الداكن</Label>
                <p className="text-sm text-gray-500">قم بتبديل سمة التطبيق</p>
              </div>
              <Switch 
                checked={darkModeEnabled} 
                onCheckedChange={(value) => toggleSetting('dark-mode', value)} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>مسجد الهدى - الإصدار 1.0.0</p>
        <p className="mt-1">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

export default SettingsPage;
