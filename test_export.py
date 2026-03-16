import asyncio
from app import guardar_lista, sesiones, listas_por_usuario

# prepare fake session and data
sesiones['alice']={'usuario':'alice'}
listas_por_usuario['alice']=[
    {'Codigo':'A1','Descripcion':'Prod1','FechaVencimiento':'2026-03-20','Stock':5,'Usuario':'alice','Legajo':'123','DiasRestantes':8,'Estado':'Correcto'},
    {'Codigo':'B2','Descripcion':'Prod2','FechaVencimiento':'2026-03-15','Stock':2,'Usuario':'alice','Legajo':'123','DiasRestantes':3,'Estado':'Crítico (<7 días)'},
]

# simulate request object
class Req:
    def __init__(self):
        self.cookies={'session_id':'alice'}

req = Req()

resp = asyncio.run(guardar_lista(req))
print('resp headers', resp.headers)
# write response to a file for inspection
with open('salida_test.xlsx','wb') as f:
    # read whole stream
    for chunk in resp.body_iterator:
        f.write(chunk)
print('Excel written to salida_test.xlsx')
