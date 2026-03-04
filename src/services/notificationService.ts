import { LocalNotifications } from '@capacitor/local-notifications';
import { format } from 'date-fns';
import { PrayerTime } from '../utils/prayerTimeUtils';
import { playPrayerNotificationSound } from '../utils/audioUtils';
import { App } from '@capacitor/app';
import { toast } from '@/components/ui/sonner';

// Define extra data type for notifications
interface NotificationExtra {
  prayerKey: string;
  [key: string]: string | number | boolean;
}

// Initialize notifications
export const initializeNotifications = async () => {
  try {
    // Check first if we already have permission before requesting
    const { display } = await LocalNotifications.checkPermissions();
    
    if (display === 'granted') {
      console.log('Notification permission already granted');
      return true;
    }
    
    // Request permission to show notifications
    const permission = await LocalNotifications.requestPermissions();
    console.log('Notification permission requested:', permission);
    
    if (permission.display === 'granted') {
      // Register the notification channel for Android
      await LocalNotifications.createChannel({
        id: 'prayer-notifications',
        name: 'Prayer Notifications',
        description: 'Notifications for prayer times',
        importance: 4, // HIGH
        visibility: 1, // PUBLIC
        lights: true,
        vibration: true,
        sound: 'fajr.mp3'
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Convert prayer time string (HH:MM) to Date object for today
const prayerTimeToDate = (timeString: string): Date => {
  if (!timeString) return new Date();
  
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  return date;
};

// Schedule prayer time notifications
export const schedulePrayerNotifications = async (prayerTimes: PrayerTime, notificationsEnabled: boolean = true) => {
  // Check if all notifications are disabled
  const allNotificationsDisabled = localStorage.getItem('all-notifications-disabled') === 'true';
  
  if (!prayerTimes || !notificationsEnabled || allNotificationsDisabled) {
    console.log('Notifications disabled or no prayer times available');
    return;
  }
  
  try {
    console.log('Scheduling prayer notifications for:', prayerTimes);
    
    // Cancel existing notifications
    await LocalNotifications.getPending().then(({ notifications }) => {
      if (notifications.length > 0) {
        return LocalNotifications.cancel({ notifications });
      }
    });
    
    // Define prayers to notify
    const prayers = [
      { name: 'الفجر', time: prayerTimes.fajr, key: 'fajr' },
      { name: 'الظهر', time: prayerTimes.dhuhr, key: 'dhuhr' },
      { name: 'العصر', time: prayerTimes.asr, key: 'asr' },
      { name: 'المغرب', time: prayerTimes.maghrib, key: 'maghrib' },
      { name: 'العشاء', time: prayerTimes.isha, key: 'isha' }
    ];
    
    // Create notification batch
    const notifications = prayers.map((prayer, index) => {
      const prayerDate = prayerTimeToDate(prayer.time);
      
      // Only schedule notifications for future times
      if (prayerDate > new Date()) {
        return {
          id: 1000 + index,
          title: `حان وقت صلاة ${prayer.name}`,
          body: `حان الآن وقت صلاة ${prayer.name}`,
          schedule: {
            at: prayerDate,
            allowWhileIdle: true,
          },
          sound: 'fajr.mp3',
          autoCancel: false, // Don't auto cancel so user must interact
          ongoing: true, // Make persistent
          channelId: 'prayer-notifications',
          extra: {
            prayerKey: prayer.key,
            fullScreen: true
          } as NotificationExtra
        };
      }
      return null;
    }).filter(Boolean);
    
    // Schedule dua notifications
    const morningTime = new Date();
    morningTime.setHours(8, 0, 0, 0);
    
    if (morningTime > new Date()) {
      notifications.push({
        id: 2000,
        title: 'أذكار الصباح',
        body: 'حان وقت أذكار الصباح',
        schedule: {
          at: morningTime,
          allowWhileIdle: true,
        },
        sound: '', // no sound
        autoCancel: true,
        ongoing: true,
        channelId: 'prayer-notifications',
        extra: {
          prayerKey: 'morning_dhikr',
          duaType: 'morning'
        } as NotificationExtra
      });
    }
    
    // Add after-prayer duas (22 minutes after each prayer)
    prayers.forEach((prayer, index) => {
      const prayerDate = prayerTimeToDate(prayer.time);
      const duaTime = new Date(prayerDate.getTime() + 22 * 60 * 1000); // 22 minutes after prayer
      
      if (duaTime > new Date()) {
        notifications.push({
          id: 3000 + index,
          title: `أذكار بعد صلاة ${prayer.name}`,
          body: `حان وقت أذكار ما بعد صلاة ${prayer.name}`,
          schedule: {
            at: duaTime,
            allowWhileIdle: true,
          },
          sound: '', // no sound
          autoCancel: true,
          ongoing: true,
          channelId: 'prayer-notifications',
          extra: {
            prayerKey: `after_${prayer.key}`,
            prayer: prayer.key
          } as NotificationExtra
        });
      }
    });
    
    // Schedule the notifications if we have any
    if (notifications.length > 0) {
      await LocalNotifications.schedule({
        notifications: notifications as any
      });
      console.log(`Scheduled ${notifications.length} prayer notifications`);
    }
    
  } catch (error) {
    console.error('Error scheduling prayer notifications:', error);
  }
};

// Handle notification received
export const handleNotificationReceived = (notification: any) => {
  console.log('Notification received:', notification);
  
  // Play adhan sound
  try {
    playPrayerNotificationSound(notification?.extra?.prayerKey || 'fajr');
  } catch (error) {
    console.error('Error playing adhan sound:', error);
  }
  
  // You can add custom handling here
  const { prayerKey } = notification.extra || {};
  
  if (prayerKey) {
    // Handle prayer notification
    console.log(`Prayer notification for ${prayerKey}`);
    // You could navigate to a specific screen, play adhan, etc.
  }
};

// Register notification listeners
export const registerNotificationListeners = () => {
  // Local Notification listeners
  LocalNotifications.addListener("localNotificationReceived", (notification) => {
    console.log("Notification received: ", notification);
    handleNotificationReceived(notification);
  });

  LocalNotifications.addListener("localNotificationActionPerformed", (notification) => {
    console.log("Notification action performed: ", notification);
    handleNotificationReceived(notification);
  });
  
  // Register for app state changes to reschedule notifications
  App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) {
      console.log('App is now active, checking notifications');
      await scheduleAllNotifications();
    }
  });
};

// Schedule today's notifications on app start or background resume
export const scheduleAllNotifications = async () => {
  try {
    // Get all saved prayer times from localStorage
    const storedTimes = localStorage.getItem("prayerTimes");
    if (!storedTimes) {
      console.log('No prayer times stored, cannot schedule notifications');
      return;
    }
    const prayerData = JSON.parse(storedTimes);
    const notificationsEnabled = localStorage.getItem('notifications-enabled') !== 'false';
    const now = new Date();
    let scheduledCount = 0;
    // For each day in localStorage
    for (const dateKey of Object.keys(prayerData)) {
      const dayPrayers = prayerData[dateKey];
      if (!dayPrayers) continue;
      // For each prayer in the day
      const prayers = [
        { name: 'الفجر', time: dayPrayers.fajr, key: 'fajr' },
        { name: 'الظهر', time: dayPrayers.dhuhr, key: 'dhuhr' },
        { name: 'العصر', time: dayPrayers.asr, key: 'asr' },
        { name: 'المغرب', time: dayPrayers.maghrib, key: 'maghrib' },
        { name: 'العشاء', time: dayPrayers.isha, key: 'isha' }
      ];
      for (const prayer of prayers) {
        // Build the Date object for this prayer
        const [year, month, day] = dateKey.split('-').map(Number);
        const [hour, minute] = prayer.time.split(':').map(Number);
        const prayerDate = new Date(year, month - 1, day, hour, minute, 0, 0);
        // Only schedule if in the future
        if (prayerDate > now) {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: Number(`${year}${month}${day}${prayer.key.length}`),
                title: `حان وقت صلاة ${prayer.name}`,
                body: `حان الآن وقت صلاة ${prayer.name}`,
                schedule: {
                  at: prayerDate,
                  allowWhileIdle: true,
                },
                sound: 'fajr', // Use 'fajr' for all, or map per prayer if you have more sounds
                autoCancel: false,
                ongoing: true,
                channelId: 'prayer-notifications',
                extra: {
                  prayerKey: prayer.key,
                  fullScreen: true
                }
              }
            ]
          });
          scheduledCount++;
        }
      }
    }
    console.log(`Scheduled ${scheduledCount} prayer notifications for all saved days.`);
  } catch (error) {
    console.error("Error scheduling all notifications:", error);
  }
};
