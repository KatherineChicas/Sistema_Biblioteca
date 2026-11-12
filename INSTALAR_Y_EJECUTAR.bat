@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Sistema Biblioteca
where npm >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js. Instalalo desde https://nodejs.org ^(version LTS^) y vuelve a abrir este archivo.
  echo Si ya lo instalaste, reinicia la computadora y prueba otra vez.
  pause
  exit /b
)
if not exist "node_modules\@supabase\supabase-js\package.json" (
  echo Instalando dependencias, esto tarda unos minutos. No cierres esta ventana...
  call npm install
  if not exist "node_modules\@supabase\supabase-js\package.json" (
    echo.
    echo ERROR: la instalacion no termino. Toma una captura de pantalla completa de esta ventana.
    pause
    exit /b
  )
)
echo.
echo Iniciando el sistema. En unos segundos se abrira el navegador en http://localhost:5173
echo Para apagar el sistema cierra esta ventana.
start "" cmd /c "timeout /t 6 /nobreak >nul & start http://localhost:5173"
call npm run dev
pause
