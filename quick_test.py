import requests

session = requests.Session()
r = session.post('http://127.0.0.1:8000/login', data={'usuario': 'admin', 'contrasena': 'admin1234'})
print(f'Login: {r.status_code}')

r = session.get('http://127.0.0.1:8000/admin/obtener_ean')
print(f'EAN endpoint: {r.status_code}')
data = r.json()
print(f'Items count: {len(data.get("ean_items", []))}')
print(f'First item: {data.get("ean_items", [])[0] if data.get("ean_items") else "None"}')

r = session.get('http://127.0.0.1:8000/buscar_producto?codigo=1001')
print(f'Search endpoint: {r.status_code}')
data = r.json()
print(f'Matches: {data}')
