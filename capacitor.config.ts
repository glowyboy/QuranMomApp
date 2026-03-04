
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.masjidalhoda',
  appName: 'مسجد الهدى',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_launcher_foreground",
      iconColor: "#1E5631",
      sound: "fajr.mp3",
      skipPermissionCheck: false, 
      importance: 5, // HIGH importance for full-screen notifications
      actionTypeId: "PRAYER_ACTION",
      presentationOptions: ["alert", "sound"],
      fullScreen: true
    },
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: "#1E5631",
    },
    // Enable background mode for notifications
    BackgroundTask: {
      notificationTitle: 'مسجد الهدى',
      notificationText: 'تطبيق مسجد الهدى يعمل في الخلفية',
      color: '#1E5631',
      showWhen: true
    }
  },
  android: {
    buildOptions: {
      // Reduce APK size with these settings
      minifyEnabled: true,
      proguardOptions: [
        "-keep class com.getcapacitor.** { *; }",
        "-keep class com.example.masjidalhoda.** { *; }",
        "-dontwarn org.bouncycastle.**",
        "-dontwarn org.conscrypt.**",
        "-dontwarn org.openjsse.**"
      ],
      aaptOptions: {
        cruncherEnabled: true,
        noCompress: ["mp3"] // Don't compress audio files
      },
      shrinkResources: true, // Remove unused resources
    }
  }
};

export default config;
