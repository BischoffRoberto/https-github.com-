#!/usr/bin/env python3
"""
Comprehensive test of app functionality
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"
session = requests.Session()

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_login():
    print_section("TEST 1: LOGIN")
    r = session.post(f"{BASE_URL}/login", data={
        'usuario': 'admin',
        'contrasena': 'admin1234'
    }, allow_redirects=False)
    print(f"Login request: {r.status_code}")
    print(f"Cookies after login: {session.cookies}")
    
    # Follow the redirect
    if r.status_code == 302:
        redirect_url = r.headers.get('Location')
        print(f"Following redirect to: {redirect_url}")
        r = session.get(f"{BASE_URL}{redirect_url}")
        print(f"After redirect: {r.status_code}")
    
    if session.cookies.get('session_id'):
        print(f"✓ LOGIN SUCCESSFUL - session_id set to: {session.cookies.get('session_id')}\n")
        return True
    elif r.status_code in [200, 302]:
        print("⚠️ Login returned OK but no session_id\n")
        return True
    else:
        print("❌ LOGIN FAILED\n")
        return False

def test_home_page():
    print_section("TEST 2: GET HOME PAGE")
    r = session.get(f"{BASE_URL}/home")
    print(f"Home page: {r.status_code}")
    
    if "script.js" in r.text and "btnAgregar" in r.text:
        print("✓ Home page contains script.js and elements\n")
        return True
    else:
        print("❌ Home page missing expected elements\n")
        return False

def test_obtain_ean():
    print_section("TEST 3: LOAD EAN DATA")
    r = session.get(f"{BASE_URL}/admin/obtener_ean")
    print(f"EAN endpoint: {r.status_code}")
    
    if r.status_code == 200:
        data = r.json()
        items = data.get('ean_items', [])
        print(f"✓ Loaded {len(items)} items")
        for item in items[:3]:
            print(f"  - Código: {item.get('codigo')}, Desc: {item.get('descripcion')}")
        print()
        return items
    else:
        print("❌ Failed to load EAN data\n")
        return []

def test_search(codigo=None, ean=None, descripcion=None):
    print_section(f"TEST: SEARCH (codigo={codigo}, ean={ean}, desc={descripcion})")
    
    params = {}
    if codigo:
        params['codigo'] = codigo
    if ean:
        params['ean'] = ean
    if descripcion:
        params['descripcion'] = descripcion
    
    r = session.get(f"{BASE_URL}/buscar_producto", params=params)
    print(f"Search request: {r.status_code}")
    
    if r.status_code == 200:
        data = r.json()
        matches = data.get('matches', [])
        print(f"✓ Found {len(matches)} matches:")
        for match in matches:
            print(f"  - {match}")
        print()
        return matches
    else:
        print("❌ Search failed\n")
        return []

def test_agregar_producto(codigo, descripcion, ean, fecha):
    print_section(f"TEST 4: ADD PRODUCT")
    
    payload = {
        'codigo': codigo,
        'descripcion': descripcion,
        'ean': ean,
        'fecha_vencimiento': fecha
    }
    
    print(f"Adding product: {payload}")
    
    r = session.post(f"{BASE_URL}/agregar_producto", json=payload)
    print(f"Add product: {r.status_code}")
    print(f"Response: {r.text[:200]}")
    
    if r.status_code == 200:
        result = r.json()
        lista = result.get('lista', [])
        print(f"✓ Product added. List now has {len(lista)} items\n")
        return lista
    else:
        print("❌ Failed to add product\n")
        return []

def test_get_lista():
    print_section("TEST 5: GET LISTA")
    
    r = session.get(f"{BASE_URL}/obtener_lista")
    print(f"Get lista: {r.status_code}")
    
    if r.status_code == 200:
        data = r.json()
        lista = data.get('lista', [])
        print(f"✓ Got list with {len(lista)} items\n")
        return lista
    else:
        print("❌ Failed to get lista\n")
        return []

def main():
    print("\n" + "="*60)
    print("  COMPLETE APP FUNCTIONALITY TEST")
    print("="*60)
    
    if not test_login():
        print("Cannot continue - login failed")
        return
    
    test_home_page()
    
    items = test_obtain_ean()
    if not items:
        print("Cannot continue - no items loaded")
        return
    
    # Test search with first product
    if items:
        first_item = items[0]
        codigo = first_item.get('codigo')
        ean = first_item.get('ean')
        descripcion = first_item.get('descripcion')
        
        print(f"\nTesting with first product: código={codigo}")
        
        # Search by codigo
        test_search(codigo=codigo)
        
        # Search by ean
        if ean:
            test_search(ean=ean)
        
        # Search by descripcion
        if descripcion:
            test_search(descripcion=descripcion[:5])  # Partial search
        
        # Try to add a product
        test_date = datetime.now().strftime("%Y-%m-%d")
        test_agregar_producto(
            codigo=codigo,
            descripcion=descripcion or "Test product",
            ean=ean or "",
            fecha=test_date
        )
        
        # Get current lista
        test_get_lista()
    
    print("\n" + "="*60)
    print("  TEST COMPLETED")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
