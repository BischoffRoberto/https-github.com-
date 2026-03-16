#!/bin/bash
# Script para empaquetar MiAPP como APK con Bubblewrap

set -e

echo "===== MiAPP APK Builder ====="
echo "Este script prepara la aplicación para Android"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Instálalo desde: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js encontrado: $(node -v)"
echo ""

# Instalar Bubblewrap
echo "📦 Instalando Bubblewrap..."
npm install -g @bubblewrap/cli

echo ""
echo "⚠️  ANTES DE CONTINUAR:"
echo "1. Reemplaza 'https://tu-dominio.com' en build/twa-manifest.json con tu dominio real"
echo "2. Asegúrate de que tu servidor está en HTTPS"
echo "3. Asegúrate de que manifest.json es accesible desde /static/manifest.json"
echo ""
read -p "¿Continuamos? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Cancelado."
    exit 1
fi

# Crear keystore si no existe
KEYSTORE="build/miapp.keystore"
if [ ! -f "$KEYSTORE" ]; then
    echo ""
    echo "🔐 Creando keystore para firmar APK..."
    what ¡Necesitarás responder preguntas sobre tu identidad!
    keytool -genkey -v -keystore "$KEYSTORE" \
        -keyalg RSA -keysize 2048 -validity 10000 \
        -alias miapp-key
else
    echo "✅ Keystore encontrado: $KEYSTORE"
fi

echo ""
echo "🚀 Construyendo APK con Bubblewrap..."
cd build
bubblewrap build --manifest=twa-manifest.json --keystore=miapp.keystore --keystore-alias=miapp-key
cd ..

echo ""
echo "✅ ¡APK compilado exitosamente!"
echo "📱 El APK está en: build/app-release.apk"
echo ""
echo "Próximos pasos:"
echo "1. Transfiere el APK a tu Android"
echo "2. Instálalo (necesitas permitir fuentes desconocidas)"
echo "3. ¡Abre la app y disfruta!"
