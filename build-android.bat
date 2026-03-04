@echo off
echo Building Masjid Al-Hoda Android App...
echo.

echo Step 1: Building web assets...
call npm run build
if %errorlevel% neq 0 (
    echo Failed to build web assets
    exit /b %errorlevel%
)

echo.
echo Step 2: Syncing with Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo Failed to sync with Capacitor
    exit /b %errorlevel%
)

echo.
echo Step 3: Building Android APK...
cd android
call gradlew assembleRelease
if %errorlevel% neq 0 (
    echo Failed to build APK
    cd ..
    exit /b %errorlevel%
)
cd ..

echo.
echo ========================================
echo Build completed successfully!
echo APK location: android\app\build\outputs\apk\release\app-release.apk
echo ========================================
