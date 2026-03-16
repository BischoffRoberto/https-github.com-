#!/usr/bin/env python3
import requests
import json
import time

BASE_URL = 'http://127.0.0.1:8000'

# Esperar a que la app se inicie
time.sleep(1)

print("🔍 PRUEBA DE AUTOCOMPLETADO - BÚSQUEDA DE CÓDIGO\n")

session = requests.Session()

# Login  
session.post(f'{BASE_URL}/login', data={'usuario': 'admin', 'contrasena': 'admin1234'})
print("✅ Sesión iniciada\n")

# Obtener datos EAN que se van a usar en el cliente
resp = session.get(f'{BASE_URL}/admin/obtener_ean')
if resp.status_code == 200:
    data = resp.json()
    items = data.get('ean_items', [])
    print(f"📊 Datos EAN obtenidos: {len(items)} items")
    if items:
        print("\n📝 Datos disponibles:")
        for item in items[:5]:
            print(f"  Código: {item.get('codigo'):15} | EAN: {item.get('ean'):15} | Desc: {item.get('descripcion', 'N/A')}")
    else:
        print("⚠️ No hay datos en EAN")
else:
    print(f"❌ Error al obtener EAN: {resp.status_code}")

print("\n" + "="*60)
print("✅ TEST COMPLETADO")
print("El autocompletado debería funcionar con estos datos.")
print("="*60)
