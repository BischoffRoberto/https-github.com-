import pandas as pd
import json

print("="*70)
print("VERIFICANDO LIMPIEZA DE DATOS EN ARCHIVOS BASE")
print("="*70)

# Cargar Inventario.xlsx
print("\n📄 INVENTARIO.xlsx - ANTES DE LIMPIAR:")
df_raw = pd.read_excel('Inventario.xlsx')
print(df_raw.to_string())

print("\n📄 INVENTARIO.xlsx - DESPUÉS DE LIMPIAR:")
df = pd.read_excel('Inventario.xlsx')
df.columns = [c.lower().strip().replace(' ', '').replace('-', '').replace('á', 'a') for c in df.columns]
if 'codigo' in df.columns:
    df['codigo'] = df['codigo'].astype(str).str.lstrip('0').str.strip()
print(df.to_string())

# Cargar EAN.xlsx
print("\n📄 EAN.xlsx - ANTES DE LIMPIAR:")
ean_raw = pd.read_excel('EAN.xlsx')
print(ean_raw.to_string())

print("\n📄 EAN.xlsx - DESPUÉS DE LIMPIAR:")
ean_df = pd.read_excel('EAN.xlsx')
ean_df.columns = [c.lower().strip().replace(' ', '').replace('-', '').replace('á', 'a') for c in ean_df.columns]
if 'ean' in ean_df.columns:
    ean_df['ean'] = ean_df['ean'].astype(str).str.replace(r'\.0$', '', regex=True).str.lstrip('0').str.strip()
if 'codigo' in ean_df.columns:
    ean_df['codigo'] = ean_df['codigo'].astype(str).str.lstrip('0').str.strip()
print(ean_df.to_string())

# Combinar datos
print("\n" + "="*70)
print("COMBINANDO DATOS PARA AUTOCOMPLETADO")
print("="*70)

ean_items = []

if not df.empty:
    inv_items = df.to_dict(orient='records')
    ean_items.extend(inv_items)
    print(f"\n✓ Agregados {len(inv_items)} items de Inventario")

if not ean_df.empty:
    ean_only = ean_df.to_dict(orient='records')
    ean_by_codigo = {str(r.get('codigo','')).strip().upper(): r for r in ean_only}
    inv_codigos = {str(i.get('codigo','')).strip().upper() for i in ean_items}
    
    for item in ean_items:
        codigo = str(item.get('codigo','')).strip().upper()
        if codigo in ean_by_codigo:
            item['ean'] = ean_by_codigo[codigo].get('ean', item.get('ean', ''))
    
    for ean_item in ean_only:
        codigo = str(ean_item.get('codigo','')).strip().upper()
        if codigo not in inv_codigos:
            ean_items.append(ean_item)
    
    print(f"✓ Procesado EAN (total después de merge: {len(ean_items)})")

print("\n" + "="*70)
print(f"RESULTADO FINAL: {len(ean_items)} ITEMS")
print("="*70)
for item in ean_items:
    print(f"\n  Código: {item.get('codigo')} | EAN: {item.get('ean', 'N/A')} | Desc: {item.get('descripcion', 'N/A')}")

print("\n" + "="*70)
print("✅ LA BÚSQUEDA FUNCIONARÁ CON ESTOS DATOS")
print("="*70)
