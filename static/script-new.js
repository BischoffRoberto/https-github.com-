// ========== VARIABLES GLOBALES ==========
let ultimaLista = [];
let eanData = [];

// === Cargar datos EAN ===
async function cargarDatosEAN() {
    try {
        const res = await fetch('/admin/obtener_ean');
        if (!res.ok) throw new Error('No se pudo cargar EAN');
        const data = await res.json();
        eanData = data.ean_items || [];
        console.log('✓ EAN cargado:', eanData.length, 'items');
    } catch (err) {
        console.error('❌ Error cargando EAN:', err);
    }
}

function normalizarBusqueda(texto) {
    let t = texto.toLowerCase().trim().replace(/\s+/g, '');
    t = t.replace(/\.0$/, '');
    t = t.replace(/^0+/, '');
    return t;
}

// ========== DROPDOWN MEJORADO ==========

function mostrarDropdown(inputId, dropdownId, sugerencias, onSelect) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    
    dropdown.innerHTML = '';
    
    if (sugerencias.length === 0) {
        dropdown.style.display = 'none';
        return;
    }
    
    sugerencias.forEach(item => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        div.innerHTML = `
            <div class="fw-bold">${item.descripcion || ''}</div>
            <div class="small">EAN: ${item.ean || '-'} | Código: ${item.codigo || '-'}</div>
        `;
        div.addEventListener('click', () => {
            onSelect(item);
            dropdown.style.display = 'none';
        });
        dropdown.appendChild(div);
    });
    
    dropdown.style.display = 'block';
}

function cerrarDropdowns() {
    document.getElementById('descDropdown').style.display = 'none';
    document.getElementById('eanDropdown').style.display = 'none';
    document.getElementById('codigoDropdown').style.display = 'none';
}

// ========== AUTOCOMPLETADO POR DESCRIPCIÓN ==========

const descInput = document.getElementById('descripcion');
if (descInput) {
    descInput.addEventListener('input', function() {
        const query = this.value.trim();
        if (!query) {
            cerrarDropdowns();
            return;
        }
        const q = normalizarBusqueda(query);
        const sugerencias = eanData.filter(row =>
            normalizarBusqueda(row.descripcion || '').includes(q)
        ).slice(0, 10);
        
        mostrarDropdown('descripcion', 'descDropdown', sugerencias, (item) => {
            descInput.value = item.descripcion || '';
            document.getElementById('ean').value = item.ean || '';
            document.getElementById('codigo').value = item.codigo || '';
        });
    });
    
    descInput.addEventListener('change', function() {
        if (!this.value.trim()) {
            document.getElementById('ean').value = '';
            document.getElementById('codigo').value = '';
        }
    });
}

// ========== AUTOCOMPLETADO POR EAN ==========

const eanInput = document.getElementById('ean');
if (eanInput) {
    eanInput.addEventListener('input', function() {
        const query = this.value.trim();
        if (!query) {
            cerrarDropdowns();
            return;
        }
        const q = normalizarBusqueda(query);
        const sugerencias = eanData.filter(row =>
            normalizarBusqueda(row.ean || '').includes(q)
        ).slice(0, 10);
        
        mostrarDropdown('ean', 'eanDropdown', sugerencias, (item) => {
            eanInput.value = item.ean || '';
            document.getElementById('codigo').value = item.codigo || '';
            document.getElementById('descripcion').value = item.descripcion || '';
        });
    });
    
    eanInput.addEventListener('change', function() {
        if (!this.value.trim()) {
            document.getElementById('codigo').value = '';
            document.getElementById('descripcion').value = '';
        }
    });
}

// ========== AUTOCOMPLETADO POR CÓDIGO ==========

const codigoInput = document.getElementById('codigo');
if (codigoInput) {
    codigoInput.addEventListener('input', function() {
        const query = this.value.trim();
        if (!query) {
            cerrarDropdowns();
            return;
        }
        const q = normalizarBusqueda(query);
        const sugerencias = eanData.filter(row =>
            normalizarBusqueda(row.codigo || '').includes(q)
        ).slice(0, 10);
        
        mostrarDropdown('codigo', 'codigoDropdown', sugerencias, (item) => {
            codigoInput.value = item.codigo || '';
            document.getElementById('ean').value = item.ean || '';
            document.getElementById('descripcion').value = item.descripcion || '';
        });
    });
    
    codigoInput.addEventListener('change', function() {
        if (!this.value.trim()) {
            document.getElementById('ean').value = '';
            document.getElementById('descripcion').value = '';
        }
    });
}

// Cerrar dropdowns al hacer click fuera
document.addEventListener('click', (e) => {
    const formContainer = document.querySelector('.form-container');
    if (formContainer && !formContainer.contains(e.target)) {
        cerrarDropdowns();
    }
});

// ========== MENSAJES ==========

function mostrarMensaje(texto, tipo = "info") {
    const msg = document.getElementById("mensaje");
    if (!msg) return;
    msg.className = `alert alert-${tipo}`;
    msg.textContent = texto;
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 4000);
}

function mostrarMensajeForm(texto, tipo = "info") {
    const msg = document.getElementById("mensajeForm");
    if (!msg) return;
    msg.className = `alert alert-${tipo}`;
    msg.textContent = texto;
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 4000);
}

// ========== AGREGAR PRODUCTO ==========

async function agregarProducto() {
    const codigoInput = document.getElementById("codigo");
    const descripcionInput = document.getElementById("descripcion");
    const fechaInput = document.getElementById("fecha");
    const eanInput = document.getElementById("ean");

    const codigo = codigoInput.value.trim();
    const descripcion = descripcionInput.value.trim();
    const fecha = fechaInput.value;
    const ean = eanInput.value.trim();

    if (!codigo) {
        mostrarMensaje("⚠️ Ingresa un código", "warning");
        return;
    }
    if (!descripcion) {
        mostrarMensaje("⚠️ Ingresa una descripción", "warning");
        return;
    }
    if (!fecha) {
        mostrarMensaje("⚠️ Ingresa fecha de vencimiento", "warning");
        return;
    }

    try {
        const response = await fetch("/agregar_producto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                codigo, descripcion, ean, fecha_vencimiento: fecha
            })
        });
        
        const result = await response.json();
        
        if (result.lista) {
            renderLista(result.lista);
            mostrarMensajeForm("✅ Producto agregado", "success");
            codigoInput.value = "";
            descripcionInput.value = "";
            fechaInput.value = "";
            eanInput.value = "";
            cerrarDropdowns();
        } else {
            mostrarMensaje("❌ " + (result.detail || "Error"), "danger");
        }
    } catch (e) {
        console.error(e);
        mostrarMensaje("❌ Error de conexión", "danger");
    }
}

// ========== BORRAR PRODUCTO ==========

async function borrarProducto(codigo) {
    try {
        const response = await fetch(`/borrar_producto/${codigo}`, { method: "DELETE" });
        const result = await response.json();
        if (result.lista !== undefined) {
            renderLista(result.lista);
            mostrarMensaje("🗑️ Producto borrado", "danger");
        }
    } catch (e) {
        mostrarMensaje("❌ Error al borrar", "danger");
    }
}

// ========== EDITAR PRODUCTO ==========

async function editarProducto(codigo) {
    const nuevaDesc = prompt('Nueva descripción:');
    if (!nuevaDesc) return;
    
    try {
        const response = await fetch(`/modificar_producto/${codigo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descripcion: nuevaDesc })
        });
        const result = await response.json();
        if (result.lista) {
            renderLista(result.lista);
            mostrarMensaje("✏️ Actualizado", "success");
        }
    } catch (e) {
        mostrarMensaje("❌ Error", "danger");
    }
}

// ========== RENDERIZAR LISTA ==========

function renderLista(lista) {
    const contenedor = document.getElementById("lista");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!Array.isArray(lista) || lista.length === 0) {
        contenedor.innerHTML = '<li class="list-group-item text-muted text-center">No hay productos</li>';
        return;
    }

    lista.forEach(p => {
        let li = document.createElement("li");
        li.className = "list-group-item small d-flex align-items-start justify-content-between";

        const left = document.createElement('div');
        left.className = 'flex-grow-1';
        left.innerHTML = `
            <div class="fw-bold">${p.Descripcion || ''}</div>
            <div class="text-muted small">Código: <strong>${p.Codigo}</strong>${p.EAN ? ' | EAN: <strong>' + p.EAN + '</strong>' : ''}</div>
            <div class="text-muted small">Fecha: <input type="date" class="form-control form-control-sm fecha-input" value="${p.FechaVencimiento || ''}" style="max-width: 150px;" /></div>
            <div class="small mt-1">Stock: ${p.Stock || '-'} | Días: <span class="badge bg-warning text-dark">${p.DiasRestantes || 0}</span></div>
            <div class="text-muted small">Usuario: <strong>${p.Usuario || '-'}</strong> | Legajo: <strong>${p.Legajo || '-'}</strong></div>
        `;

        const right = document.createElement('div');
        right.className = 'd-flex gap-2';

        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-info btn-sm rounded-circle';
        btnEditar.style.width = '40px';
        btnEditar.style.height = '40px';
        btnEditar.innerHTML = '✏️';
        btnEditar.addEventListener('click', () => editarProducto(p.Codigo));

        const btnBorrar = document.createElement('button');
        btnBorrar.className = 'btn btn-danger btn-sm rounded-circle';
        btnBorrar.style.width = '40px';
        btnBorrar.style.height = '40px';
        btnBorrar.innerHTML = '🗑️';
        btnBorrar.addEventListener('click', () => borrarProducto(p.Codigo));

        right.appendChild(btnEditar);
        right.appendChild(btnBorrar);
        li.appendChild(left);
        li.appendChild(right);
        contenedor.appendChild(li);

        const fechaInput = li.querySelector('.fecha-input');
        if (fechaInput) {
            fechaInput.addEventListener('change', async (e) => {
                try {
                    const resp = await fetch(`/modificar_producto/${p.Codigo}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fecha_vencimiento: e.target.value })
                    });
                    const resJson = await resp.json();
                    if (resJson.lista) {
                        renderLista(resJson.lista);
                        mostrarMensaje('✅ Fecha actualizada', 'success');
                    }
                } catch (err) {
                    mostrarMensaje('❌ Error', 'danger');
                }
            });
        }
    });
}

// ========== CARGAR LISTA AL INICIAR ==========

async function refreshLista() {
    try {
        const resp = await fetch('/obtener_lista');
        if (resp.ok) {
            const data = await resp.json();
            if (data.lista && Array.isArray(data.lista)) {
                renderLista(data.lista);
                const btnToggle = document.getElementById('btnToggle');
                if (btnToggle) btnToggle.textContent = data.lista.length ? 'Ocultar lista' : 'Mostrar lista';
            }
        }
    } catch (err) {
        console.error('Error cargando lista:', err);
    }
}

// ========== PAGE LOAD ==========

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Página iniciada');
    
    await cargarDatosEAN();
    await refreshLista();

    // Botón Agregar
    const btnAgregar = document.getElementById('btnAgregar');
    if (btnAgregar) btnAgregar.addEventListener('click', agregarProducto);

    // Botón Borrar Todo
    const btnBorrar = document.getElementById('btnBorrar');
    if (btnBorrar) {
        btnBorrar.addEventListener('click', async () => {
            if (!confirm('¿Borrar toda la lista?')) return;
            try {
                const response = await fetch('/borrar_lista_completa', { method: 'DELETE' });
                const result = await response.json();
                renderLista(result.lista || []);
                mostrarMensaje(result.mensaje || 'Lista borrada', 'danger');
            } catch (e) {
                mostrarMensaje('❌ Error', 'danger');
            }
        });
    }

    // Botón Guardar Excel
    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async () => {
            const lista = document.getElementById('lista');
            const items = lista ? lista.querySelectorAll('.list-group-item').length : 0;
            
            if (items === 0 || (items === 1 && lista.textContent.includes('No hay'))) {
                mostrarMensajeForm('❌ Agrega productos primero', 'warning');
                return;
            }
            
            try {
                const response = await fetch('/guardar_lista', { method: 'POST' });
                
                // Si error 400, significa lista vacía en el servidor
                if (response.status === 400) {
                    mostrarMensajeForm('❌ La lista está vacía en el servidor', 'danger');
                    return;
                }
                
                if (!response.ok) {
                    mostrarMensajeForm('❌ Error al guardar (código ' + response.status + ')', 'danger');
                    return;
                }
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'lista_vencimientos_' + new Date().toISOString().split('T')[0] + '.xlsx';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                mostrarMensajeForm('📊 Excel descargado correctamente', 'success');
            } catch (e) {
                console.error('Error:', e);
                mostrarMensajeForm('❌ Error al descargar Excel: ' + e.message, 'danger');
            }
        });
    }

    // Botón Toggle Lista
    const btnToggle = document.getElementById('btnToggle');
    if (btnToggle) {
        btnToggle.addEventListener('click', function() {
            const lista = document.getElementById('lista');
            if (lista) {
                const visible = lista.style.display !== 'none';
                lista.style.display = visible ? 'none' : 'block';
                btnToggle.textContent = visible ? 'Mostrar lista' : 'Ocultar lista';
            }
        });
    }

    // Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/static/sw.js').catch(() => {});
    }
});
