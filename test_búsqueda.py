#!/usr/bin/env python3
import requests
import json
import time

BASE_URL = 'http://127.0.0.1:8000'

# Esperar a que la app se inicie
time.sleep(2)

print("=" * 60)
print("PROBANDO: Login")
print("=" * 60)

# Login
session = requests.Session()
resp = session.post(f'{BASE_URL}/login', data={'usuario': 'admin', 'contrasena': 'admin1234'})
print(f"Login status: {resp.status_code}")
if resp.status_code == 302:
    print("✅ Login exitoso")
else:
    print(f"❌ Error en login: {resp.text}")

print("\n" + "=" * 60)
print("PROBANDO: /admin/obtener_ean")
print("=" * 60)

# Obtener datos EAN
resp = session.get(f'{BASE_URL}/admin/obtener_ean')
print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    items = data.get('ean_items', [])
    print(f"✅ Datos EAN cargados: {len(items)} items")
    if items:
        print(f"\nPrimers items:")
        for item in items[:3]:
            print(f"  - Código: {item.get('codigo')} | EAN: {item.get('ean')} | Desc: {item.get('descripcion', 'N/A')}")
else:
    print(f"❌ Error: {resp.text}")

print("\n" + "=" * 60)
print("PRUEBA DE BÚSQUEDA POR CÓDIGO")
print("=" * 60)

# Buscar por código
resp = session.get(f'{BASE_URL}/buscar_producto?codigo=1001')
print(f"Status: {resp.status_code}")
data = resp.json()
matches = data.get('matches', [])
if matches:
    print(f"✅ Encontrado por código 1001:")
    for m in matches:
        print(f"  - Código: {m.get('codigo')} | EAN: {m.get('ean')} | Desc: {m.get('descripcion', 'N/A')}")
else:
    print(f"❌ No encontrados resultados")

print("\n" + "=" * 60)
print("PRUEBA DE BÚSQUEDA POR EAN")
print("=" * 60)

# Buscar por EAN
resp = session.get(f'{BASE_URL}/buscar_producto?ean=1234567890123')
print(f"Status: {resp.status_code}")
data = resp.json()
matches = data.get('matches', [])
if matches:
    print(f"✅ Encontrado por EAN 1234567890123:")
    for m in matches:
        print(f"  - Código: {m.get('codigo')} | EAN: {m.get('ean')} | Desc: {m.get('descripcion', 'N/A')}")
else:
    print(f"❌ No encontrados resultados")

print("\n" + "=" * 60)
print("✅ PRUEBAS COMPLETADAS")
print("=" * 60)
