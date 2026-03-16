#!/usr/bin/env python
"""Script para preparar Inventario.xlsx y EAN.xlsx desde base.xlsx"""

import pandas as pd
import unicodedata

def _norm_str(s):
    s2 = str(s).strip()
    s2 = unicodedata.normalize('NFKD', s2).encode('ascii', 'ignore').decode('ascii')
    return s2.lower()

def _normalize_columns(cols):
    return [_norm_str(c) for c in cols]

# Leer base.xlsx
print("[SETUP] Leyendo base.xlsx...")
df_base = pd.read_excel('base.xlsx')

# Normalizar columnas
df_base.columns = _normalize_columns(df_base.columns)
print(f"[SETUP] Columnas normalizadas: {list(df_base.columns)}")

# Crear Inventario.xlsx (solo Codigo, Descripción)
print("[SETUP] Creando Inventario.xlsx...")
df_inventario = df_base[['codigo', 'descripcion']].copy()
df_inventario.to_excel('Inventario.xlsx', index=False)
print(f"[SETUP] ✓ Inventario.xlsx guardado ({len(df_inventario)} filas)")

# Crear EAN.xlsx (EAN, Codigo, Descripcion)
print("[SETUP] Creando EAN.xlsx...")
if 'ean' in df_base.columns:
    df_ean = df_base[['ean', 'codigo', 'descripcion']].copy()
    # Limpiar EAN y código: quitar .0, ceros a la izquierda, espacios
    df_ean['ean'] = df_ean['ean'].astype(str)
    df_ean['ean'] = df_ean['ean'].str.replace(r'\.0$', '', regex=True).str.lstrip('0').str.strip()
    df_ean['codigo'] = df_ean['codigo'].astype(str)
    df_ean['codigo'] = df_ean['codigo'].str.replace(r'\.0$', '', regex=True).str.lstrip('0').str.strip()
    df_ean.to_excel('EAN.xlsx', index=False)
    print(f"[SETUP] ✓ EAN.xlsx guardado ({len(df_ean)} filas)")
else:
    print("[SETUP] ✗ No hay columna EAN en base.xlsx")

print("[SETUP] ===== COMPLETADO =====")
