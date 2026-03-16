@echo off
REM Script para empaquetar MiAPP como APK en Windows

echo ===== MiAPP APK Builder (Windows) =====
echo Este script prepara la aplicacion para Android
echo.

REM Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js no esta instalado
    echo Descargalo desde: https://nodejs.org
    pause
    exit /b 1
)

echo Node.js encontrado
echo.

REM Instalar Bubblewrap
echo Instalando Bubblewrap...
call npm install -g @bubblewrap/cli

echo.
echo ANTES DE CONTINUAR:
echo 1. Abre build\twa-manifest.json
echo 2. Reemplaza 'https://tu-dominio.com' con tu dominio HTTPS real
echo 3. Asegura que tu servidor esta en HTTPS
echo.
pause

REM Crear keystore si no existe
if not exist "build\miapp.keystore" (
    echo.
    echo Creando keystore para firmar APK...
    echo Necesitaras proporcionar algunos detalles personales
    echo.
    keytool -genkey -v -keystore build\miapp.keystore ^
        -keyalg RSA -keysize 2048 -validity 10000 ^
        -alias miapp-key
) else (
    echo Keystore encontrado
)

echo.
echo Construyendo APK con Bubblewrap...
cd build
call bubblewrap build --manifest=twa-manifest.json --keystore=miapp.keystore --keystore-alias=miapp-key
cd ..

echo.
echo APK compilado exitosamente!
echo El archivo esta en: build\app-release.apk
echo.
echo Proximos pasos:
echo 1. Transfiere el APK a tu Android
echo 2. Instálalo (necesitas permitir fuentes desconocidas)
echo 3. Abre la app desde tu movil
echo.
pause
