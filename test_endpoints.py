#!/usr/bin/env python3
import requests
import json

BASE = 'http://127.0.0.1:8000'

print("\n" + "="*70)
print("TEST DE AUTOCOMPLETADO Y BÚSQUEDA")
print("="*70)

# Iniciar sesión
session = requests.Session()
print("\n1️⃣ LOGIN")
resp = session.post(f'{BASE}/login', data={'usuario': 'admin', 'contrasena': 'admin1234'})
print(f"   Status: {resp.status_code}")

# Obtener datos EAN
print("\n2️⃣ CARGAR DATOS EAN")
resp = session.get(f'{BASE}/admin/obtener_ean')
print(f"   Status: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    items = data.get('ean_items', [])
    print(f"   ✓ Items cargados: {len(items)}")
    for item in items[:3]:
        print(f"     - {item}")
else:
    print(f"   ❌ Error: {resp.text[:200]}")

# Buscar por código
print("\n3️⃣ BUSCAR POR CÓDIGO")
resp = session.get(f'{BASE}/buscar_producto?codigo=1001')
print(f"   Status: {resp.status_code}")
data = resp.json()
matches = data.get('matches', [])
print(f"   ✓ Resultados: {len(matches)}")
for m in matches:
    print(f"     - {m}")

# Buscar por EAN
print("\n4️⃣ BUSCAR POR EAN")
resp = session.get(f'{BASE}/buscar_producto?ean=1234567890123')
print(f"   Status: {resp.status_code}")
data = resp.json()
matches = data.get('matches', [])
print(f"   ✓ Resultados: {len(matches)}")
for m in matches:
    print(f"     - {m}")

# Agregar producto
print("\n5️⃣ AGREGAR PRODUCTO")
resp = session.post(f'{BASE}/agregar_producto', json={
    'codigo': '1001',
    'descripcion': 'Producto X',
    'ean': '1234567890123',
    'fecha_vencimiento': '2026-04-01'
})
print(f"   Status: {resp.status_code}")
data = resp.json()
if 'lista' in data:
    print(f"   ✓ Producto agregado. Lista tiene {len(data['lista'])} items")
else:
    print(f"   ⚠️  {data}")

print("\n" + "="*70)
print("✅ TEST COMPLETADO")
print("="*70 + "\n")
