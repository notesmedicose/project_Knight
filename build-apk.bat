@echo off
cd /d "%~dp0android"
set ANDROID_HOME=C:\Users\nares\AppData\Local\Android\Sdk
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot
echo Building Knight 3D Chess APK...
call .\gradlew.bat assembleDebug
if %ERRORLEVEL% EQU 0 (
  echo.
  echo ? SUCCESS! APK at: android\app\build\outputs\apk\debug\app-debug.apk
) else (
  echo.
  echo ? BUILD FAILED - see errors above
)
pause
