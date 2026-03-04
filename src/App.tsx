
import { useEffect } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Geolocation } from "@capacitor/geolocation";
import { App as CapacitorApp } from '@capacitor/app';

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Welcome from "./components/Welcome";
import MainLayout from "./components/MainLayout";
import HomePage from "./pages/HomePage";
import QuranPage from "./pages/QuranPage";
import DawahPage from "./pages/DawahPage";
import SurahView from "./pages/SurahView";
import PrayerTimesPage from "./pages/PrayerTimesPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import { initializeNotifications, registerNotificationListeners, scheduleAllNotifications } from "./services/notificationService";
import { preloadPrayerSounds } from "./utils/audioUtils";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const setupApp = async () => {
      try {
        // Register notification listeners first
        registerNotificationListeners();
        
        // Preload prayer sounds
        preloadPrayerSounds();
        
        // Initialize notifications
        const notif = await initializeNotifications();
        console.log("Notification permission:", notif);
        
        // Request location permission
        try {
          const location = await Geolocation.requestPermissions();
          console.log("Location permission:", location);
        } catch (locError) {
          console.error("Location permission error:", locError);
        }
        
        // Schedule notifications for today
        await scheduleAllNotifications();
        
        // Listen for app state changes to reschedule notifications when app resumes
        CapacitorApp.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            // App came to foreground, reschedule notifications
            scheduleAllNotifications();
          }
        });
      } catch (error) {
        console.error("App setup error:", error);
      }
    };

    setupApp();

    // Cleanup
    return () => {
      LocalNotifications.removeAllListeners();
      CapacitorApp.removeAllListeners();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route element={<MainLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/quran" element={<QuranPage />} />
              <Route path="/surah/:id" element={<SurahView />} />
              <Route path="/dawah" element={<DawahPage />} />
              <Route path="/prayer-times" element={<PrayerTimesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
