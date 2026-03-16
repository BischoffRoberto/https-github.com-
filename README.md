# MiAPP2026 - PWA + APK Setup

## 🚀 Paso 1: Probar PWA Localmente (con HTTPS)

### Instalar mkcert (para certificados locales)
```bash
# En Windows, usa chocolatey o descarga desde: https://github.com/FiloSottile/mkcert/releases
# Con Chocolatey:
choco install mkcert

# Crear certificados locales
mkcert -install
mkcert localhost 127.0.0.1
# Genera: localhost+1-key.pem y localhost+1.pem
```

### Crear archivo de configuración HTTPS para FastAPI
Crea `ssl_config.py`:
```python
import ssl
import os

cert_file = "localhost+1.pem"
key_file = "localhost+1-key.pem"

if os.path.exists(cert_file) and os.path.exists(key_file):
    ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    ssl_context.load_cert_chain(cert_file, key_file)
else:
    ssl_context = None
```

### Ejecutar servidor con HTTPS
```bash
# Opción 1: Uvicorn con certificados
uvicorn app:app --host 127.0.0.1 --port 8443 --ssl-keyfile=localhost+1-key.pem --ssl-certfile=localhost+1.pem

# Opción 2: Usar Gunicorn con SSL (alternativa)
pip install gunicorn
gunicorn app:app --certfile=localhost+1.pem --keyfile=localhost+1-key.pem --bind 127.0.0.1:8443
```

### Probar en navegador
1. Abre: `https://127.0.0.1:8443` en un navegador moderno
2. Ignora el aviso de certificado (es local, es seguro)
3. Haz login: usuario `admin` / contraseña `admin1234`
4. En Chrome/Edge: aparecerá un botón "Instalar" en la barra de direcciones
5. Haz click para instalar la app en tu PC/móvil
6. La app funciona offline (parcialmente) con el service worker

## 📱 Paso 2: Empaquetar como APK (Android)

### Opción A: Trusted Web Activity (TWA) - Recomendado
`build/twa-config.json`:
```json
{
  "name": "MiAPP Vencimientos",
  "packageId": "com.miapp.vencimientos",
  "host": "https://tu-dominio.com",
  "startUrl": "/",
  "theme": "#dc3545",
  "logoUrl": "https://tu-dominio.com/static/logo.png",
  "keystore": {
    "path": "miapp.keystore",
    "alias": "miapp-key"
  }
}
```

### Crear keystore para firmar APK
```bash
# Generar keystore
keytool -genkey -v -keystore miapp.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias miapp-key
# Te pide: nombre, empresa, país, etc.
```

### Usar Bubblewrap (herramienta de Google para TWA)
```bash
npm install -g @bubblewrap/cli

# Crear proyecto TWA
bubblewrap init --packageId=com.miapp.vencimientos --host=tu-dominio.com

# Construir APK
bubblewrap build

# Salida: app-release.apk en /build
```

### Opción B: React Native / Expo (si prefieres app nativa)
Puedo generar un proyecto React Native con Expo que comunique con tu servidor FastAPI.

## 🔐 Seguridad (Acceso restringido solo a usuarios autenticados)

La autenticación ya está implementada:
- **Login.html**: todos deben ingresar usuario/contraseña
- **Cookies de sesión**: solo usuarios en el dict `usuarios` pueden acceder
- **IP tracking**: el primer login vincula la IP del usuario; cambios de IP bloquean acceso
- **Admin panel**: solo usuarios con rol `admin` ven `/admin`

### Añadir nuevos usuarios
1. Entrá como admin a `/admin`
2. Rellena los campos: usuario, nombre, teléfono, legajo, contraseña
3. El usuario aparece inmediatamente en la tabla
4. Podés bloquear/desbloquear usuarios sin borrar datos

## 📦 Desplegar en servidor real (recomendado)

### Con Heroku (gratuito con limitaciones)
```bash
# Instalar Heroku CLI
npm install -g heroku

# Login y crear app
heroku login
heroku create miapp-vencimientos

# Crear Procfile
echo "web: uvicorn app:app --host 0.0.0.0 --port \$PORT" > Procfile

# Deploy
git init
git add .
git commit -m "initial"
git push heroku main
```

### Con DigitalOcean / AWS / Google Cloud
- Deploy de FastAPI con Docker
- Usar Let's Encrypt para certificados HTTPS gratuitos
- CloudFlare para CDN y protección

## 📋 Resumen de archivos añadidos (PWA)
- `static/manifest.json` — config de la app (nombre, icons, tema)
- `static/sw.js` — service worker (cache + offline)
- `templates/offline.html` — página offline
- Se registran en todas las páginas HTML

## 🎨 Personalización
- Cambiar colores: edita `theme_color` en `manifest.json` y variables CSS
- Cambiar nombre app: edita `"short_name"` en manifest
- Cambiar logo: reemplaza `/static/logo.png` (debe ser 192x192 mín)

## ✅ Checklist de pruebas locales
- [ ] Servidor HTTPS corriendo (uvicorn con certs)
- [ ] Abre `https://127.0.0.1:8443`
- [ ] Login funciona
- [ ] Agregar producto, guardar lista, descarga Excel
- [ ] Admin: subir archivo base, editar usuarios
- [ ] Botón "Instalar" aparece en navegador
- [ ] App instalada funciona offline (lectura)
- [ ] Recarga: datos persisten

---

**Próximos pasos**:
1. ¿Querés que genere el `Procfile` y `requirements.txt` para Heroku?
2. ¿O empiezo con Bubblewrap para el APK?
3. ¿Tenés un dominio registrado, o usamos un servicio free (ngrok, Vercel)?
