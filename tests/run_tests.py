import requests
import pandas as pd
import time

BASE = 'http://127.0.0.1:8000'
COOKIES = {'session_id': 'admin'}

# 1) Crear Excel de prueba
df = pd.DataFrame([
    {'codigo': '1001', 'descripcion': 'Producto X', 'stock': 5},
    {'codigo': '1002', 'descripcion': 'Producto Y', 'stock': 3}
])
fn = 'tests/test_inventario.xlsx'
df.to_excel(fn, index=False)
print('Created', fn)

# 2) Subir archivo
with open(fn, 'rb') as f:
    files = {'file': ('test_inventario.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    r = requests.post(BASE + '/admin/upload_archivo', files=files, cookies=COOKIES)
    print('/admin/upload_archivo ->', r.status_code)
    try:
        print(r.json())
    except Exception as e:
        print('No JSON:', e)

# 2.1) Subir archivo EAN de prueba
import os
fn_ean = 'tests/test_ean.xlsx'
df_ean = pd.DataFrame([
    {'ean': '1234567890123', 'codigo': '1001'}
])
df_ean.to_excel(fn_ean, index=False)
with open(fn_ean, 'rb') as f:
    files = {'file': ('test_ean.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    r = requests.post(BASE + '/admin/upload_ean', files=files, cookies=COOKIES)
    print('/admin/upload_ean ->', r.status_code)
    try:
        print(r.json())
    except Exception as e:
        print('No JSON:', e)

# small wait
time.sleep(1)

# 3) Listar archivos
r = requests.get(BASE + '/admin/listar_archivos', cookies=COOKIES)
print('/admin/listar_archivos ->', r.status_code)
print(r.text[:1000])

# 4) Buscar por codigo
r = requests.get(BASE + '/buscar_producto', params={'code': '1001'})
print('/buscar_producto?code=1001 ->', r.status_code)
print(r.json())

# 4.1) Buscar por descripción (case-insensitive, substring)
r = requests.get(BASE + '/buscar_producto', params={'descripcion': 'producto'})
print('/buscar_producto?descripcion=producto ->', r.status_code)
print(r.json())

# 4.2) Alias con parámetro articulo
r = requests.get(BASE + '/buscar_producto', params={'articulo': 'producto x'})
print('/buscar_producto?articulo=producto x ->', r.status_code)
print(r.json())

# 4.3) Buscar usando EAN (debe mapear al código 1001)
r = requests.get(BASE + '/buscar_producto', params={'code': '1234567890123'})
print('/buscar_producto?code=1234567890123 ->', r.status_code)
print(r.json())

# 5) Modificar usuario 'roberto'
payload = {'usuario':'roberto', 'nombre': 'Roberto Test', 'tlf':'12345678', 'legajo':'900'}
r = requests.post(BASE + '/admin/modificar_usuario', json=payload, cookies=COOKIES)
print('/admin/modificar_usuario ->', r.status_code, r.text)

# 6) GET /admin HTML to verify name appears
r = requests.get(BASE + '/admin', cookies=COOKIES)
print('/admin page contains new name?', 'Roberto Test' in r.text)

print('Done')
