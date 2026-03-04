
import { format } from "date-fns";

// Define prayer time types
export interface PrayerTime {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string;
}

export interface DailyPrayerData {
  date: string;
  timings: {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    [key: string]: string;
  };
}

// Format API response to our app format
export const formatPrayerData = (apiData: DailyPrayerData): PrayerTime => {
  return {
    fajr: formatTimeString(apiData.timings.Fajr),
    sunrise: formatTimeString(apiData.timings.Sunrise),
    dhuhr: formatTimeString(apiData.timings.Dhuhr),
    asr: formatTimeString(apiData.timings.Asr),
    maghrib: formatTimeString(apiData.timings.Maghrib),
    isha: formatTimeString(apiData.timings.Isha),
    date: apiData.date,
  };
};

// Format time from "HH:MM (GMT+3)" to "HH:MM"
const formatTimeString = (timeStr: string): string => {
  if (!timeStr) return "";
  // Example: "14:23 (GMT+3)" -> "14:23"
  return timeStr.split(" ")[0];
};

// Get next prayer time
export const getNextPrayer = (prayerTimes: PrayerTime): { name: string; time: string } => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const prayerTimesMinutes = {
    fajr: timeToMinutes(prayerTimes.fajr),
    sunrise: timeToMinutes(prayerTimes.sunrise),
    dhuhr: timeToMinutes(prayerTimes.dhuhr),
    asr: timeToMinutes(prayerTimes.asr),
    maghrib: timeToMinutes(prayerTimes.maghrib),
    isha: timeToMinutes(prayerTimes.isha),
  };
  
  const prayers = [
    { name: "الفجر", time: prayerTimes.fajr, minutes: prayerTimesMinutes.fajr },
    { name: "الشروق", time: prayerTimes.sunrise, minutes: prayerTimesMinutes.sunrise },
    { name: "الظهر", time: prayerTimes.dhuhr, minutes: prayerTimesMinutes.dhuhr },
    { name: "العصر", time: prayerTimes.asr, minutes: prayerTimesMinutes.asr },
    { name: "المغرب", time: prayerTimes.maghrib, minutes: prayerTimesMinutes.maghrib },
    { name: "العشاء", time: prayerTimes.isha, minutes: prayerTimesMinutes.isha },
  ];
  
  // Find the next prayer
  for (const prayer of prayers) {
    if (prayer.minutes > currentTime) {
      return { name: prayer.name, time: prayer.time };
    }
  }
  
  // If all prayers for today have passed, return Fajr for tomorrow
  return { name: "الفجر", time: prayerTimes.fajr };
};

// Convert time string to minutes since midnight
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// Format date string for display
export const formatDateString = (date: Date): string => {
  // Format: "الثلاثاء، 3 مايو 2023"
  // You can implement proper Arabic formatting here
  return format(date, "yyyy-MM-dd");
};

// Save prayer times to local storage
export const savePrayerTimesToLocalStorage = (data: Record<string, PrayerTime>): void => {
  localStorage.setItem("prayerTimes", JSON.stringify(data));
  localStorage.setItem("prayerTimesLastUpdated", new Date().toISOString());
};

// Get prayer times from local storage
export const getPrayerTimesFromLocalStorage = (): Record<string, PrayerTime> | null => {
  const data = localStorage.getItem("prayerTimes");
  return data ? JSON.parse(data) : null;
};

// Get today's prayer times
export const getTodaysPrayerTimes = (allTimes: Record<string, PrayerTime>): PrayerTime | null => {
  if (!allTimes) return null;
  
  // Get today's date in the format used as keys in allTimes
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;
  
  console.log(`Looking for today's prayer times (${formattedDate}) in stored data`);
  console.log("Available dates:", Object.keys(allTimes));
  
  const todaysPrayers = allTimes[formattedDate];
  console.log("Today's prayer times found:", todaysPrayers);
  
  return todaysPrayers || null;
};

// Check if we should update prayer times (once a month is reasonable)
export const shouldUpdatePrayerTimes = (): boolean => {
  const lastUpdated = localStorage.getItem("prayerTimesLastUpdated");
  if (!lastUpdated) return true;
  
  const lastUpdateDate = new Date(lastUpdated);
  const now = new Date();
  
  // Update if it's been more than 30 days
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  return now.getTime() - lastUpdateDate.getTime() > thirtyDaysInMs;
};
