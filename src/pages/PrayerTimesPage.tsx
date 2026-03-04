import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Wifi, WifiOff } from 'lucide-react';
import { reverseGeocode } from '../services/geocodingService';
import { useQuery } from '@tanstack/react-query';
import { formatPrayerData, getNextPrayer, savePrayerTimesToLocalStorage, getPrayerTimesFromLocalStorage, getTodaysPrayerTimes, shouldUpdatePrayerTimes } from '../utils/prayerTimeUtils';
import { toast } from "@/components/ui/sonner";
import { initializeNotifications, schedulePrayerNotifications, scheduleAllNotifications } from '../services/notificationService';
import { stopPrayerNotificationSound } from '../utils/audioUtils';

export default function PrayerTimesPage() {
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [nextPrayer, setNextPrayer] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [location, setLocation] = useState({
    latitude: 21.4224779,
    // Default to Mecca coordinates
    longitude: 39.8251832,
    city: "مكة المكرمة"
  });
  const [formattedPrayerTimes, setFormattedPrayerTimes] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [debugDisplay, setDebugDisplay] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isAdhanPlaying, setIsAdhanPlaying] = useState(false);
  const [apiFetchSuccess, setApiFetchSuccess] = useState(false);

  // Format date in DD-MM-YYYY format
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format prayer time from API format (24h with seconds) to HH:MM
  const formatPrayerTime = (timeStr: string) => {
    if (!timeStr) return '';
    // The API returns times in the format "HH:MM:SS" or "HH:MM (GMT Standard Time)"
    const match = timeStr.match(/(\d{2}):(\d{2})/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
    return timeStr;
  };

  // Format prayer data from API response
  const formatPrayerDataLocal = (dayData: any) => {
    if (!dayData || !dayData.timings) return null;
    return {
      date: dayData.date.gregorian.date,
      fajr: formatPrayerTime(dayData.timings.Fajr),
      sunrise: formatPrayerTime(dayData.timings.Sunrise),
      dhuhr: formatPrayerTime(dayData.timings.Dhuhr),
      asr: formatPrayerTime(dayData.timings.Asr),
      maghrib: formatPrayerTime(dayData.timings.Maghrib),
      isha: formatPrayerTime(dayData.timings.Isha)
    };
  };

  // Get today's prayer times from formatted data
  const getTodaysPrayerTimesLocal = (formattedData: any) => {
    const today = new Date();
    const formattedDate = formatDate(today);
    console.log("Looking for today's date:", formattedDate);
    console.log("Available dates:", Object.keys(formattedData));

    // Convert date format to match the key format in the formattedData object
    const todaysKey = formattedDate;
    const result = formattedData[todaysKey];
    console.log("Today's prayer times found:", result);
    return result || null;
  };

  // Get next prayer
  const getNextPrayerLocal = (prayers: any) => {
    if (!prayers) return null;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    const prayersList = [{
      name: 'الفجر',
      time: prayers.fajr,
      key: 'fajr'
    }, {
      name: 'الشروق',
      time: prayers.sunrise,
      key: 'sunrise'
    }, {
      name: 'الظهر',
      time: prayers.dhuhr,
      key: 'dhuhr'
    }, {
      name: 'العصر',
      time: prayers.asr,
      key: 'asr'
    }, {
      name: 'المغرب',
      time: prayers.maghrib,
      key: 'maghrib'
    }, {
      name: 'العشاء',
      time: prayers.isha,
      key: 'isha'
    }];
    for (const prayer of prayersList) {
      if (prayer.time > currentTime) {
        return {
          name: prayer.name,
          time: prayer.time,
          key: prayer.key
        };
      }
    }

    // If all prayers have passed, return the first prayer of the next day
    return {
      name: 'الفجر',
      time: prayers.fajr,
      key: 'fajr'
    };
  };

  // Initialize notifications
  useEffect(() => {
    const setupNotifications = async () => {
      // Check notification settings from localStorage
      const notifSetting = localStorage.getItem('notifications-enabled');
      const enabled = notifSetting !== 'false'; // Default to true
      setNotificationsEnabled(enabled);
      if (enabled) {
        const permissionGranted = await initializeNotifications();
        if (permissionGranted) {
          toast.success("تم تفعيل الإشعارات");
          // Schedule all notifications
          await scheduleAllNotifications();
        } else {
          toast.error("لم يتم السماح بالإشعارات. يرجى تمكين الإشعارات من إعدادات الجهاز");
          localStorage.setItem('notifications-enabled', 'false');
          setNotificationsEnabled(false);
        }
      }
    };
    setupNotifications();
  }, []);

  // Fetch prayer times
  const fetchPrayerTimesApi = async () => {
    try {
      setIsLoading(true);
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${location.latitude}&longitude=${location.longitude}&method=2`;
      console.log("Fetching prayer times from:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch prayer times: ${response.status}`);
      }
      const data = await response.json();
      console.log("Prayer API data received");
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error("Invalid data format received from prayer API");
      }
      const formattedData: any = {};
      data.data.forEach((day: any) => {
        if (day?.date?.gregorian?.date && day?.timings) {
          const formatted = formatPrayerDataLocal(day);
          if (formatted) {
            // Use the date directly without changing the format
            const dateKey = formatted.date;
            formattedData[dateKey] = formatted;
          }
        }
      });
      console.log("Formatted prayer times:", formattedData);

      // Save data to localStorage
      savePrayerTimesToLocalStorage(formattedData);
      const todaysPrayers = getTodaysPrayerTimesLocal(formattedData);
      if (todaysPrayers && notificationsEnabled) {
        schedulePrayerNotifications(todaysPrayers, notificationsEnabled);
      }
      return formattedData;
    } catch (error) {
      console.error("Error fetching prayer times:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Use React Query to fetch prayer times
  const {
    data: apiPrayerTimes,
    refetch: refetchPrayerTimes
  } = useQuery({
    queryKey: ['prayerTimes', location.latitude, location.longitude],
    queryFn: fetchPrayerTimesApi,
    enabled: !isOffline && shouldUpdatePrayerTimes(),
    staleTime: 24 * 60 * 60 * 1000,
    // 1 day
    gcTime: 7 * 24 * 60 * 60 * 1000,
    // 7 days
    retry: 3
  });

  // Handle successful data fetch
  useEffect(() => {
    if (apiPrayerTimes) {
      setFormattedPrayerTimes(apiPrayerTimes);
      const todaysPrayers = getTodaysPrayerTimesLocal(apiPrayerTimes);
      if (todaysPrayers) {
        setPrayerTimes(todaysPrayers);
        const next = getNextPrayerLocal(todaysPrayers);
        setNextPrayer(next);

        // Schedule notifications for prayers
        if (notificationsEnabled) {
          schedulePrayerNotifications(todaysPrayers, notificationsEnabled);
        }
      }
    }
  }, [apiPrayerTimes, notificationsEnabled]);

  // Improved online/offline detection
  useEffect(() => {
    // Initial check
    const checkOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOffline(!online);
      console.log("Connection status:", online ? "Online" : "Offline");
    };
    
    // Listen for online/offline events
    const handleOnline = () => {
      console.log("Device is now online");
      setIsOffline(false);
      
      // When we come back online, try to update prayer times
      if (shouldUpdatePrayerTimes()) {
        refetchPrayerTimes();
      }
    };
    
    const handleOffline = () => {
      console.log("Device is now offline");
      setIsOffline(true);
    };
    
    // Initial check
    checkOnlineStatus();
    
    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Also periodically check connection status for more reliability
    const intervalId = setInterval(checkOnlineStatus, 30000); // Check every 30 seconds
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [refetchPrayerTimes]);

  // Try to load cached location from localStorage first
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const locationData = JSON.parse(savedLocation);
        setLocation(locationData);
      } catch (e) {
        console.error("Error parsing saved location:", e);
      }
    }
  }, []);

  // Try to get user location
  useEffect(() => {
    if (!isOffline && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));

        // Get city name from coordinates
        await getCityName(lat, lng);
      }, err => {
        console.warn("Geolocation error:", err);
      });
    }
  }, [isOffline]);

  // Get city name from coordinates using OpenCage
  const getCityName = async (latitude: number, longitude: number) => {
    try {
      setIsLoadingLocation(true);
      const geocodingResult = await reverseGeocode(latitude, longitude);
      if (geocodingResult.city) {
        const locationName = [geocodingResult.city, geocodingResult.state, geocodingResult.country].filter(Boolean).join(", ");
        setLocation(prev => ({
          ...prev,
          city: geocodingResult.city || locationName || "غير معروف"
        }));

        // Save to localStorage
        localStorage.setItem('userLocation', JSON.stringify({
          latitude,
          longitude,
          city: geocodingResult.city || locationName || "غير معروف"
        }));
      }
    } catch (error) {
      console.error("Error getting location name:", error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Enhanced update method that handles both online and offline states
  const updatePrayerTimes = async () => {
    try {
      setIsLoading(true);
      
      // Check online status
      const online = navigator.onLine;
      setIsOffline(!online);
      
      if (online) {
        // If online, try to fetch from API
        toast.info("جاري تحديث مواقيت الصلاة من الإنترنت...");
        try {
          await refetchPrayerTimes();
          toast.success("تم تحديث مواقيت الصلاة بنجاح");
          return;
        } catch (err) {
          console.error("API fetch failed:", err);
          toast.error("فشل تحديث المواقيت من الإنترنت، سيتم استخدام البيانات المحلية");
          // Fall back to local storage if API fetch fails
        }
      } else {
        // If offline, inform the user
        toast.info("أنت في وضع عدم الاتصال، سيتم استخدام البيانات المحلية");
      }
      
      // Use local storage data as fallback
      const localData = getPrayerTimesFromLocalStorage();
      if (localData) {
        setFormattedPrayerTimes(localData);
        const todaysPrayers = getTodaysPrayerTimesLocal(localData);
        if (todaysPrayers) {
          setPrayerTimes(todaysPrayers);
          setNextPrayer(getNextPrayerLocal(todaysPrayers));
          
          if (notificationsEnabled) {
            schedulePrayerNotifications(todaysPrayers, notificationsEnabled);
          }
          
          toast.success("تم تحديث مواقيت الصلاة من البيانات المحلية");
        } else {
          toast.error("لا توجد مواقيت صلاة لليوم الحالي في البيانات المحلية");
        }
      } else {
        toast.error("لا توجد بيانات مواقيت محفوظة للاستخدام");
      }
    } catch (error) {
      console.error("Error updating prayer times:", error);
      toast.error("حدث خطأ أثناء تحديث مواقيت الصلاة");
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // On mount, always try to fetch latest prayer times, else use localStorage, then schedule notifications
  useEffect(() => {
    const fetchAndSchedule = async () => {
      let fetched = false;
      try {
        setIsLoading(true);
        await refetchPrayerTimes();
        setApiFetchSuccess(true);
        fetched = true;
      } catch (e) {
        setApiFetchSuccess(false);
        // Ignore, will fallback to localStorage
      }
      if (!fetched) {
        const localData = getPrayerTimesFromLocalStorage();
        if (localData) {
          setFormattedPrayerTimes(localData);
          const todaysPrayers = getTodaysPrayerTimes(localData);
          if (todaysPrayers) {
            setPrayerTimes(todaysPrayers);
            setNextPrayer(getNextPrayerLocal(todaysPrayers));
          }
        }
      }
      // Always schedule notifications for all future times
      await scheduleAllNotifications();
      setIsLoading(false);
    };
    fetchAndSchedule();
  }, []);

  // Retry fetching from API every 3 seconds if not successful
  useEffect(() => {
    if (apiFetchSuccess) return;
    const interval = setInterval(async () => {
      try {
        await refetchPrayerTimes();
        setApiFetchSuccess(true);
      } catch (e) {
        // Still failed, will retry
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [apiFetchSuccess, refetchPrayerTimes]);

  // Update next prayer every minute and ensure notifications are scheduled
  useEffect(() => {
    if (!prayerTimes) return;
    const updateNextPrayer = () => {
      setNextPrayer(getNextPrayerLocal(prayerTimes));
    };

    // Make sure notifications are scheduled
    if (notificationsEnabled) {
      schedulePrayerNotifications(prayerTimes, notificationsEnabled);
    }
    const intervalId = setInterval(updateNextPrayer, 60000);
    return () => clearInterval(intervalId);
  }, [prayerTimes, notificationsEnabled]);

  // Check for new day at midnight
  useEffect(() => {
    const checkForNewDay = () => {
      const storedData = getPrayerTimesFromLocalStorage();
      if (storedData) {
        const todaysPrayers = getTodaysPrayerTimesLocal(storedData);
        if (todaysPrayers) {
          setPrayerTimes(todaysPrayers);
          setNextPrayer(getNextPrayerLocal(todaysPrayers));

          // Schedule notifications for new day
          if (notificationsEnabled) {
            schedulePrayerNotifications(todaysPrayers, notificationsEnabled);
          }
        } else if (!isOffline) {
          // If no prayer times for today in cache, fetch new data
          refetchPrayerTimes();
        }
      }
    };
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    const timerId = setTimeout(() => {
      checkForNewDay();
      // Set daily check at midnight
      setInterval(checkForNewDay, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
    return () => clearTimeout(timerId);
  }, [isOffline, notificationsEnabled]);

  // Listen for adhan play events and set state
  useEffect(() => {
    const handleAdhanPlay = () => setIsAdhanPlaying(true);
    const handleAdhanStop = () => setIsAdhanPlaying(false);
    window.addEventListener('adhan-play', handleAdhanPlay);
    window.addEventListener('adhan-stop', handleAdhanStop);
    return () => {
      window.removeEventListener('adhan-play', handleAdhanPlay);
      window.removeEventListener('adhan-stop', handleAdhanStop);
    };
  }, []);

  // Loading state
  if (isLoading && !prayerTimes) {
    return <div className="p-4 text-center">
        <div className="islamic-card islamic-pattern-border">
          <h1 className="text-xl font-bold text-islamic-green mb-4">جاري تحميل مواقيت الصلاة...</h1>
        </div>
      </div>;
  }

  // Error state
  if (error && !prayerTimes) {
    return <div className="p-4 text-center">
        <div className="islamic-card islamic-pattern-border">
          <h1 className="text-xl font-bold text-islamic-green mb-4">تعذر تحميل مواقيت الصلاة</h1>
          <p className="text-islamic-dark/80">يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.</p>
        </div>
      </div>;
  }

  // In the render/return section, show a message if offline and no data
  return <div className="p-4">
    {isAdhanPlaying && (
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 shadow-lg islamic-pattern-border bg-islamic-green text-islamic-light md:max-w-xl md:mx-auto md:rounded-b-xl md:left-1/2 md:-translate-x-1/2 transition-all">
        <div className="flex items-center gap-2">
          <svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6 text-islamic-gold' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 3v2m6.364 1.636l-1.414 1.414M21 12h-2M17.364 17.364l-1.414-1.414M12 21v-2M6.636 17.364l1.414-1.414M3 12h2M6.636 6.636l1.414 1.414' /></svg>
          <span className="font-bold text-lg sm:text-base">يتم الآن تشغيل الأذان</span>
        </div>
        <button onClick={() => { stopPrayerNotificationSound(); setIsAdhanPlaying(false); }} className="bg-islamic-gold text-islamic-dark font-semibold px-4 py-2 rounded-full shadow hover:bg-yellow-400 transition-colors text-sm ml-2">إيقاف</button>
      </div>
    )}
    {debugDisplay && <div className="bg-red-100 text-red-800 p-2 mb-4 rounded">
          Debug: {debugDisplay}
        </div>}
      
      <div className="islamic-card islamic-pattern-border mb-4">
        <h1 className="text-2xl font-bold text-islamic-green text-center mb-2">مواقيت الصلاة</h1>
        <div className="flex items-center justify-center mb-3">
          <Calendar className="h-5 w-5 text-islamic-green ml-2" />
          <span className="text-islamic-dark/80 px-[13px]">{prayerTimes?.date || "التاريخ غير متاح"}</span>
        </div>
        <div className="flex items-center justify-center mb-3">
          <MapPin className="h-5 w-5 text-islamic-green ml-2 mx-[9px]" />
          <span className="text-islamic-dark/80">
            {isLoadingLocation ? "جاري تحديد الموقع..." : location.city}
         
          </span>
        </div>
        <div className="flex items-center justify-center mb-6">
          {isOffline ? <>
              <WifiOff className="h-5 w-5 text-yellow-500 ml-2" />
              <span className="text-yellow-600">وضع عدم الاتصال</span>
            </> : <>
              <Wifi className="h-5 w-5 text-islamic-green ml-2 mx-[9px]" />
              <span className="text-islamic-green">متصل بالإنترنت</span>
            </>}
        </div>
        {nextPrayer && <div className="bg-islamic-green/10 p-3 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="text-islamic-green font-semibold">الصلاة التالية</span>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-islamic-gold mr-1" />
                <span className="text-islamic-green font-semibold">{nextPrayer.name} - {nextPrayer.time}</span>
              </div>
            </div>
          </div>}
      </div>
      
      {prayerTimes && <div className="islamic-card islamic-pattern-border">
          <h2 className="text-xl font-bold text-islamic-green text-center mb-4">مواقيت الصلاة اليوم</h2>
          <div className="space-y-4">
            {[{
          key: 'fajr',
          name: 'الفجر',
          time: prayerTimes.fajr
        }, {
          key: 'sunrise',
          name: 'الشروق',
          time: prayerTimes.sunrise
        }, {
          key: 'dhuhr',
          name: 'الظهر',
          time: prayerTimes.dhuhr
        }, {
          key: 'asr',
          name: 'العصر',
          time: prayerTimes.asr
        }, {
          key: 'maghrib',
          name: 'المغرب',
          time: prayerTimes.maghrib
        }, {
          key: 'isha',
          name: 'العشاء',
          time: prayerTimes.isha
        }].map(prayer => {
          const isNext = nextPrayer?.key === prayer.key;
          return <div key={prayer.key} className={`flex justify-between items-center p-3 rounded-lg ${isNext ? 'bg-islamic-green/10 border-r-4 border-islamic-green' : ''}`}>
                  <span className={`font-semibold ${isNext ? 'text-islamic-green' : 'text-islamic-dark'}`}>
                    {prayer.name}
                  </span>
                  <div className="flex items-center">
                    <Clock className={`h-4 w-4 mr-1 ${isNext ? 'text-islamic-gold' : 'text-islamic-dark/60'}`} />
                    <span className={isNext ? 'text-islamic-green font-bold' : 'text-islamic-dark/80'}>
                      {prayer.time}
                    </span>
                  </div>
                </div>;
        })}
          </div>
        </div>}

    {/* Button to manually refresh prayer times */}
    <div className="mt-4 flex justify-center">
      <button
        onClick={updatePrayerTimes}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md ${isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-islamic-green text-white hover:bg-islamic-green/90'}`}
      >
        تحديث مواقيت الصلاة
      </button>
    </div>
    
    {isOffline && !prayerTimes && (
      <div className="text-center text-red-600 mt-4">لا يوجد بيانات مواقيت محفوظة للاستخدام بدون إنترنت. يرجى الاتصال بالإنترنت مرة واحدة على الأقل.</div>
    )}
  </div>;
}
