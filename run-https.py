#!/usr/bin/env python3
"""
Script para ejecutar MiAPP con HTTPS localmente (para pruebas PWA con mkcert)
Requiere mkcert instalado y certificados generados
"""

import subprocess
import sys
import os
from pathlib import Path

def run_https_server():
    cert_file = "localhost+1.pem"
    key_file = "localhost+1-key.pem"

    if not os.path.exists(cert_file) or not os.path.exists(key_file):
        print("❌ Certificados no encontrados!")
        print("")
        print("Para crear certificados locales:")
        print("1. Instala mkcert: https://github.com/FiloSottile/mkcert/releases")
        print("2. En Windows:")
        print('   - Abre PowerShell como admin')
        print('   - Ejecuta: mkcert -install')
        print('   - Ejecuta: mkcert localhost 127.0.0.1')
        print("")
        print("3. En Linux/Mac:")
        print("   - Instala mkcert (brew install mkcert)")
        print("   - Ejecuta: mkcert -install")
        print("   - Ejecuta: mkcert localhost 127.0.0.1")
        sys.exit(1)

    print("✅ Certificados encontrados")
    print("")
    print("🚀 Iniciando servidor HTTPS en https://127.0.0.1:8443")
    print("")
    print("Instrucciones:")
    print("1. Abre: https://127.0.0.1:8443")
    print("2. Ignora el aviso de certificado (es seguro, es local)")
    print("3. Login: admin / admin1234")
    print("4. Abre DevTools (F12) > Application > Manifest para verificar PWA")
    print("5. En Chrome: verás un botón 'Instalar' en la barra de direcciones")
    print("")
    print("Presiona Ctrl+C para detener el servidor")
    print("")

    cmd = [
        "uvicorn",
        "app:app",
        "--host", "127.0.0.1",
        "--port", "8443",
        "--ssl-keyfile=" + key_file,
        "--ssl-certfile=" + cert_file,
        "--reload"
    ]

    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n✅ Servidor detenido")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_https_server()
