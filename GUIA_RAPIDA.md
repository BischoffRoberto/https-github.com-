# 🚀 Guía Rápida: Probar PWA + Crear APK

## 1️⃣ Prueba PWA Localmente (30 minutos)

### Paso 1: Instalar mkcert
**Windows (PowerShell como admin):**
```powershell
choco install mkcert
# Si no tienes Chocolatey: descarga desde https://github.com/FiloSottile/mkcert/releases
```

**Mac:**
```bash
brew install mkcert
```

**Linux (Ubuntu):**
```bash
sudo apt-get install libnss3-tools
wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert-v1.4.4-linux-amd64
sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert
```

### Paso 2: Crear certificados locales
```bash
# En la carpeta del proyecto (C:\Users\ROBERTO\Desktop\MiAPP2026)
mkcert -install
mkcert localhost 127.0.0.1
```

Esto crea:
- `localhost+1.pem` (certificado)
- `localhost+1-key.pem` (clave privada)

### Paso 3: Ejecutar servidor HTTPS
```bash
python run-https.py
```

O manualmente:
```bash
uvicorn app:app --host 127.0.0.1 --port 8443 --ssl-keyfile=localhost+1-key.pem --ssl-certfile=localhost+1.pem --reload
```

### Paso 4: Probar en navegador
1. Abre: **https://127.0.0.1:8443**
2. Acepta el certificado (di "Avanzado" → "Continuar")
3. Login: `admin` / `admin1234`
4. ✅ Si ves un botón **"Instalar"** en la barra de direcciones, ¡la PWA funciona!

### Paso 5: Instalar la app
1. Click en **"Instalar"** (Chrome/Edge)
2. O: Menu (⋯) → "Instalar MiAPP Vencimientos"
3. La app aparece en tu escritorio/menú inicio
4. ¡Abre y funciona offline!

---

## 2️⃣ Crear APK para Android (1-2 horas)

### Requisitos previos
1. **Node.js** instalado (https://nodejs.org)
2. **Java JDK** instalado (para keytool)
3. **Tu dominio en HTTPS** (importante para APK)

### Opción A: Via Bubblewrap (Recomendado - Más fácil)

**Windows:**
```batch
cd build
build-apk.bat
```

**Linux/Mac:**
```bash
cd build
chmod +x build-apk.sh
./build-apk.sh
```

**¿Qué hace el script?**
1. Instala Bubblewrap
2. Te pide que edites `twa-manifest.json` (cambiar dominio)
3. Genera keystore (necesita tu información)
4. Compila APK

**Resultado:** `build/app-release.apk`

### Opción B: Manual (si prefieres control total)

**1. Instala Bubblewrap:**
```bash
npm install -g @bubblewrap/cli
```

**2. Edita `build/twa-manifest.json`:**
```json
{
  "host": "https://tu-dominio-real.com",   // ⚠️ CAMBIAR ESTO
  "packageId": "com.miapp.vencimientos",
  ...
}
```

**3. Genera keystore:**
```bash
keytool -genkey -v -keystore build/miapp.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias miapp-key
```

**4. Compila APK:**
```bash
cd build
bubblewrap build --manifest=twa-manifest.json \
  --keystore=miapp.keystore \
  --keystore-alias=miapp-key
```

---

## 📱 Instalar APK en Android

1. **Transferir el APK**
   - Conecta USB o copia a carpeta compartida
   - O sube a un servidor y descarga directamente

2. **Permisos**
   - En Android: Ajustes → Privacidad → Permitir instalar desde fuentes desconocidas

3. **Instalar**
   - Abre el archivo `.apk`
   - Dale click en "Instalar"
   - ¡Listo!

---

## 🌐 Desplegar a Internet (Servidor Real)

### Opción 1: Heroku (Gratuito con limitaciones)
```bash
# 1. Crea cuenta en heroku.com
# 2. Instala Heroku CLI
npm install -g heroku

# 3. En tu carpeta del proyecto
heroku login
heroku create miapp-vencimientos

# 4. Deploy
git init
git add .
git commit -m "initial"
git push heroku main

# Tu app: https://miapp-vencimientos.herokuapp.com
```

### Opción 2: DigitalOcean / VPS
- Renta VPS ($5/mes)
- Usa Docker: `docker build -t miapp .`
- Usa Let's Encrypt para HTTPS gratis
- Deploy: `docker run -p 443:8443 miapp`

### Opción 3: Cloudflare Pages / Vercel
- Conecta tu repo
- Deploy automático
- HTTPS gratis incluido

---

## 🔒 Control de Acceso (Seguridad)

El sistema ya tiene acceso restringido:

### ✅ Lo que está protegido
- Solo usuarios en `/admin` → tabla `usuarios` pueden entrar
- Login requerido por cookie `session_id`
- IP tracking: primer login = vincula la IP
- Admin panel: solo rol `admin`

### ➕ Añadir nuevo usuario
```
1. Login como admin → /admin
2. Rellena: usuario, nombre, tlf, legajo, contraseña
3. Click "➕ Agregar usuario"
4. ¡Listo! El usuario puede entrar
```

### 🚫 Bloquear usuario
```
1. Admin panel → tabla usuarios
2. Click "⛔ Bloquear"
3. El usuario no puede entrar (pero datos se guardan)
```

---

## 📊 Estructura de Carpetas

```
MiAPP2026/
├── app.py                 # Servidor FastAPI
├── requirements.txt       # Dependencias Python
├── run-https.py          # Script para HTTPS local
├── Procfile              # Para Heroku
├── build/
│   ├── build-apk.sh      # Script Linux/Mac para APK
│   ├── build-apk.bat     # Script Windows para APK
│   ├── twa-manifest.json # Config del APK
│   └── miapp.keystore    # Se genera al construir
├── static/
│   ├── logo.png          # Logo (circular en 192x192px min)
│   ├── manifest.json     # Configuración PWA
│   ├── sw.js             # Service Worker (offline)
│   └── ...               # CSS, JS
├── templates/
│   ├── login.html        # Página login
│   ├── index.html        # Página inicio (productos)
│   ├── admin.html        # Panel admin
│   └── offline.html      # Página offline
├── uploads/              # Archivos subidos
└── tests/
    └── run_tests.py      # Tests (opcional)
```

---

## 🎯 Resumen Rápido

| Tarea | Tiempo | Comando |
|-------|--------|---------|
| Probar PWA local | 10 min | `python run-https.py` |
| Instalar app (Desktop) | 2 min | Botón "Instalar" en navegador |
| Crear APK | 30 min | `cd build && build-apk.bat` |
| Deploy a Heroku | 15 min | `git push heroku main` |
| Añadir usuario | 1 min | Admin panel |

---

## ❓ Troubleshooting

### Certificado no funciona
```bash
# Limpia certificados de mkcert
mkcert -uninstall
mkcert -install
mkcert localhost 127.0.0.1
```

### APK no instala
- Asegúrate que tienes HTTPS (no HTTP)
- Verifica que `twa-manifest.json` apunta a dominio correcto
- Genera nuevo keystore

### PWA no aparece botón instalar
- Abre DevTools (F12) → Application → Manifest
- Verifica que aparece el manifest
- En Chrome Mobile: debería sugerir instalar

### App no funciona offline
- Service Worker debe estar registrado (DevTools → Application → SW)
- Solo funciona en HTTPS
- Offline solo funciona para lectura de datos (no POST)

---

## 📞 Soporte

Pregunta generada: `admin / admin1234`

Usuarios de prueba creados:
- `admin` — Administrador
- `roberto` — Usuario regular

Para más info: consulta `README.md` en la carpeta principal.

¡Éxito! 🎉
