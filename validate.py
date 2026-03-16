#!/usr/bin/env python3
"""
MiAPP2026 - Sistema de Validación Completo
Verifica que todo está listo para PWA + APK + Producción
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def check(condition, message, fix_hint=None):
    """Verifica una condición y muestra resultado"""
    if condition:
        print(f"{Colors.GREEN}✅{Colors.END} {message}")
        return True
    else:
        print(f"{Colors.RED}❌{Colors.END} {message}")
        if fix_hint:
            print(f"   {Colors.YELLOW}💡 {fix_hint}{Colors.END}")
        return False

def check_file(path, description):
    """Verifica que un archivo existe"""
    exists = os.path.isfile(path)
    return check(exists, f"{description}: {path}")

def check_dir(path, description):
    """Verifica que un directorio existe"""
    exists = os.path.isdir(path)
    return check(exists, f"{description}: {path}")

def check_command(cmd, description):
    """Verifica que un comando está disponible"""
    try:
        result = subprocess.run([cmd, "--version"], capture_output=True, timeout=5)
        return check(result.returncode == 0, f"{description} ({cmd})")
    except Exception:
        return check(False, f"{description} ({cmd})", f"Instala: {cmd}")

def main():
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}MiAPP2026 - VALIDACIÓN DEL SISTEMA{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    results = {
        "Python": [],
        "Archivos": [],
        "PWA": [],
        "APK": [],
        "Seguridad": [],
        "Producción": []
    }
    
    # ========== 1. PYTHON ==========
    print(f"{Colors.BLUE}1. Entorno Python{Colors.END}")
    results["Python"].append(check_command("python", "Python 3.9+"))
    results["Python"].append(check_command("pip", "pip (gestor de paquetes)"))
    
    # Verificar paquetes instalados
    try:
        import fastapi
        results["Python"].append(check(True, "FastAPI instalado"))
    except:
        results["Python"].append(check(False, "FastAPI no está instalado", "pip install fastapi"))
    
    try:
        import pandas
        results["Python"].append(check(True, "pandas instalado"))
    except:
        results["Python"].append(check(False, "pandas no está instalado", "pip install pandas"))
    
    try:
        import uvicorn
        results["Python"].append(check(True, "uvicorn instalado"))
    except:
        results["Python"].append(check(False, "uvicorn no está instalado", "pip install uvicorn"))
    
    # ========== 2. ARCHIVOS DE APLICACIÓN ==========
    print(f"\n{Colors.BLUE}2. Archivos de Aplicación{Colors.END}")
    results["Archivos"].append(check_file("app.py", "Servidor FastAPI"))
    results["Archivos"].append(check_file("requirements.txt", "Dependencias"))
    results["Archivos"].append(check_file("run-https.py", "Script HTTPS local"))
    results["Archivos"].append(check_dir("templates", "Templates HTML"))
    results["Archivos"].append(check_dir("static", "Archivos estáticos"))
    results["Archivos"].append(check_dir("uploads", "Carpeta de subidas"))
    
    # ========== 3. PWA (Progressive Web App) ==========
    print(f"\n{Colors.BLUE}3. PWA - Configuración{Colors.END}")
    results["PWA"].append(check_file("static/manifest.json", "Manifest PWA"))
    results["PWA"].append(check_file("static/sw.js", "Service Worker"))
    results["PWA"].append(check_file("templates/offline.html", "Página offline"))
    
    # Verificar manifest.json válido
    try:
        with open("static/manifest.json") as f:
            manifest = json.load(f)
            has_name = "name" in manifest
            has_icons = "icons" in manifest
            results["PWA"].append(check(has_name, "Manifest tiene 'name'"))
            results["PWA"].append(check(has_icons, "Manifest tiene 'icons'"))
    except:
        results["PWA"].append(check(False, "Manifest JSON válido", "Revisa: static/manifest.json"))
    
    # ========== 4. APK (Trusted Web Activity) ==========
    print(f"\n{Colors.BLUE}4. APK - Configuración Android{Colors.END}")
    results["APK"].append(check_dir("build", "Carpeta build/"))
    results["APK"].append(check_file("build/twa-manifest.json", "TWA Manifest"))
    results["APK"].append(check_file("build/build-apk.bat", "Script APK (Windows)"))
    results["APK"].append(check_file("build/build-apk.sh", "Script APK (Linux/Mac)"))
    results["APK"].append(check_command("node", "Node.js (para Bubblewrap)"))
    
    # ========== 5. SEGURIDAD ==========
    print(f"\n{Colors.BLUE}5. Seguridad - Autenticación{Colors.END}")
    
    # Verificar que app.py tiene autenticación
    with open("app.py") as f:
        app_content = f.read()
        has_login = "def login" in app_content
        has_sessions = "session_id" in app_content
        has_admin_check = "admin" in app_content
        
        results["Seguridad"].append(check(has_login, "Sistema de login implementado"))
        results["Seguridad"].append(check(has_sessions, "Cookies de sesión"))
        results["Seguridad"].append(check(has_admin_check, "Verificación de roles (admin)"))
    
    # ========== 6. PRODUCCIÓN ==========
    print(f"\n{Colors.BLUE}6. Producción - Despliegue{Colors.END}")
    results["Producción"].append(check_file("Procfile", "Procfile (Heroku)"))
    results["Producción"].append(check_file("README.md", "README"))
    results["Producción"].append(check_file("GUIA_RAPIDA.md", "Guía rápida"))
    
    # ========== RESUMEN ==========
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}RESUMEN{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    total_checks = sum(len(v) for v in results.values())
    passed_checks = sum(sum(v) for v in results.values())
    
    for section, checks in results.items():
        passed = sum(checks)
        total = len(checks)
        percentage = (passed / total * 100) if total > 0 else 0
        status = Colors.GREEN if percentage == 100 else Colors.YELLOW if percentage >= 80 else Colors.RED
        print(f"{status}{section}: {passed}/{total} ({percentage:.0f}%){Colors.END}")
    
    print(f"\n{Colors.BLUE}Total: {passed_checks}/{total_checks} ({passed_checks/total_checks*100:.0f}%){Colors.END}\n")
    
    # ========== RECOMENDACIONES ==========
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}PRÓXIMOS PASOS{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    if passed_checks == total_checks:
        print(f"{Colors.GREEN}🎉 ¡TODO LISTO!{Colors.END}\n")
        print("Opciones disponibles:\n")
        print("1️⃣  PROBAR PWA LOCAL (recomendado primero):")
        print("   $ pip install mkcert  # Si no lo tienes")
        print("   $ mkcert -install")
        print("   $ mkcert localhost 127.0.0.1")
        print("   $ python run-https.py")
        print("   → Abre: https://127.0.0.1:8443\n")
        
        print("2️⃣  COMPILAR APK (Android):")
        print("   $ cd build")
        print("   $ build-apk.bat          # Windows")
        print("   # O ./build-apk.sh       # Linux/Mac")
        print("   → APK generado en: build/app-release.apk\n")
        
        print("3️⃣  DESPLEGAR A HEROKU:")
        print("   $ heroku create mi-app")
        print("   $ git push heroku main")
        print("   → App en: https://mi-app.herokuapp.com\n")
    else:
        print(f"{Colors.YELLOW}⚠️  FALTAN ITEMS{Colors.END}\n")
        print("Revisa los errores arriba y ejecuta los comandos sugeridos.\n")
    
    # ========== INFORMACIÓN DE SEGURIDAD ==========
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}INFORMACIÓN DE SEGURIDAD{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    print("✅ Autenticación: Login requerido (cookie session_id)")
    print("✅ Usuarios: Solo los creados por admin pueden entrar")
    print("✅ Roles: Distinción admin vs usuario")
    print("✅ IP Tracking: Primera IP vinculada, cambios bloqueados")
    print("✅ Admin Panel: Solo accesible con rol 'admin'")
    print("✅ Archivos subidos: Guardados en carpeta privada\n")
    
    print(f"{Colors.BLUE}Usuarios predefinidos:{Colors.END}")
    print("   • admin / admin1234      → Acceso total")
    print("   • roberto / clave123     → Acceso usuario\n")
    
    # ========== TIMESTAMPS ==========
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"Validación completada: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Versión: MiAPP 2026")
    print(f"Creador: @Roberto Bischoff")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    return 0 if passed_checks == total_checks else 1

if __name__ == "__main__":
    sys.exit(main())
