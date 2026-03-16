#!/usr/bin/env python3
import subprocess
import time
import sys

print("🚀 Iniciando MiAPP2026...")
print("📍 Abriendo en: http://127.0.0.1:8000")
print("")

try:
    # Iniciar la app con uvicorn
    proc = subprocess.Popen([
        sys.executable, "-m", "uvicorn", 
        "app:app", 
        "--host", "127.0.0.1", 
        "--port", "8000"
    ], cwd="c:\\Users\\ROBERTO\\Desktop\\MiAPP2026")
    
    print("✅ App iniciada correctamente")
    print("⏳ Mantente en ejecución...")
    print("")
    print("=" * 60)
    print("LA APP ESTÁ CORRIENDO EN http://127.0.0.1:8000")
    print("=" * 60)
    print("")
    print("Presiona CTRL+C para detener")
    
    # Esperar a que el proceso termine
    proc.wait()
    
except KeyboardInterrupt:
    print("\n\n⛔ App detenida")
    proc.terminate()
    sys.exit(0)
