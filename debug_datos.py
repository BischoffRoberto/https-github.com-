import pandas as pd
import json

# Cargar datasets igual que app.py
df = pd.read_excel('Inventario.xlsx')
df.columns = [c.lower().strip().replace(' ', '').replace('-', '').replace('á', 'a') for c in df.columns]

ean_df = pd.read_excel('EAN.xlsx')
ean_df.columns = [c.lower().strip().replace(' ', '').replace('-', '').replace('á', 'a') for c in ean_df.columns]

print('=== INVENTARIO.xlsx ===')
print(df.to_string())
print('\n=== EAN.xlsx ===')
print(ean_df.to_string())

# Simular lo que hace el endpoint
ean_items = []

# Agregar datos del inventario
if not df.empty:
    inv_items = df.to_dict(orient='records')
    print(f'\n✓ Inventario items: {len(inv_items)}')
    for item in inv_items:
        print(f"  - {item}")
    ean_items.extend(inv_items)

# Agregar/actualizar datos EAN
if not ean_df.empty:
    ean_only = ean_df.to_dict(orient='records')
    print(f'\n✓ EAN items: {len(ean_only)}')
    for item in ean_only:
        print(f"  - {item}")
    
    ean_by_codigo = {str(r.get('codigo','')).strip().upper(): r for r in ean_only}
    inv_codigos = {str(i.get('codigo','')).strip().upper() for i in ean_items}
    print(f'\n✓ Códigos en inventario: {inv_codigos}')
    print(f'✓ Códigos en EAN dict: {list(ean_by_codigo.keys())}')
    
    for item in ean_items:
        codigo = str(item.get('codigo','')).strip().upper()
        if codigo in ean_by_codigo:
            item['ean'] = ean_by_codigo[codigo].get('ean', item.get('ean', ''))
            print(f'✓ Actualizado {codigo} con EAN: {item["ean"]}')
        else:
            print(f'✗ No encontrado {codigo} en EAN')
    
    for ean_item in ean_only:
        codigo = str(ean_item.get('codigo','')).strip().upper()
        if codigo not in inv_codigos:
            print(f'✓ Agregando nuevo item del EAN: {codigo}')
            ean_items.append(ean_item)

print(f'\n=== RESULTADO FINAL ({len(ean_items)} items) ===')
for item in ean_items:
    print(f'Código: {item.get("codigo")} | EAN: {item.get("ean", "N/A")} | Desc: {item.get("descripcion", "N/A")}')
