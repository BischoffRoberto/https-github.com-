// ========== SISTEMA DE AUTOCOMPLETADO + LISTA MEJORADA ==========

let ultimaLista = [];
let eanData = [];
let dropdownActual = null;

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
    // Solo normalizar espacios y convertir a minúsculas
    // NO eliminar ceros, eso rompe búsquedas de códigos como "1001"
    let t = String(texto).toLowerCase().trim().replace(/\s+/g, ' ');
    // Eliminar .0 SOLO si es un decimal de Excel (ej: "1001.0" → "1001")
    t = t.replace(/\.0+$/, '');
    return t;
}

// ========== DROPDOWN CUSTOMIZADO ==========

function mostrarDropdown(containerID, sugerencias, onSelect, tipoSearch = null) {
    const container = document.getElementById(containerID);
    if (!container) return;
    
    if (dropdownActual && dropdownActual !== containerID) {
        const anterior = document.getElementById(dropdownActual);
        if (anterior) anterior.classList.add('d-none');
    }
    
    container.innerHTML = '';
    
    if (sugerencias.length === 0) {
        container.classList.add('d-none');
        return;
    }
    
    sugerencias.forEach(item => {
        const div = document.createElement('div');
        div.className = 'dropdown-item p-2 border-bottom';
        div.style.cursor = 'pointer';
        div.style.backgroundColor = 'white';
        
        // Mostrar de forma clara según el tipo de búsqueda
        let html = '';
        if (tipoSearch === 'ean') {
            html = `
                <div class="fw-bold text-danger" style="font-size: 1.1em;">EAN: ${item.ean || '-'}</div>
                <div class="small text-dark">📦 Código: ${item.codigo || '-'}</div>
                <div class="small text-muted">${item.descripcion || ''}</div>
            `;
        } else if (tipoSearch === 'codigo') {
            html = `
                <div class="fw-bold text-primary" style="font-size: 1.1em;">Código: ${item.codigo || '-'}</div>
                <div class="small text-dark">🔢 EAN: ${item.ean || '-'}</div>
                <div class="small text-muted">${item.descripcion || ''}</div>
            `;
        } else {
            html = `
                <div class="fw-bold text-dark" style="font-size: 1em;">${item.descripcion || 'Sin descripción'}</div>
                <div class="small text-muted">🔢 Código: ${item.codigo || '-'} | EAN: ${item.ean || '-'}</div>
            `;
        }
        
        div.innerHTML = html;
        div.addEventListener('click', () => {
            onSelect(item);
            container.classList.add('d-none');
        });
        div.addEventListener('mouseenter', () => {
            div.style.backgroundColor = '#f0f8ff';
        });
        div.addEventListener('mouseleave', () => {
            div.style.backgroundColor = 'white';
        });
        container.appendChild(div);
    });
    
    container.classList.remove('d-none');
    dropdownActual = containerID;
}

function cerrarDropdowns() {
    document.getElementById('eanDropdown')?.classList.add('d-none');
    document.getElementById('codigoDropdown')?.classList.add('d-none');
    document.getElementById('descDropdown')?.classList.add('d-none');
    dropdownActual = null;
}

// ========== BÚSQUEDA Y AUTOCOMPLETADO ==========

function setupSearchListeners() {
    const eanInput = document.getElementById('ean');
    if (eanInput) {
        eanInput.addEventListener('input', function() {
            const query = this.value.trim();
            if (!query || query.length < 1) {
                cerrarDropdowns();
                return;
            }
            
            const q = normalizarBusqueda(query).toLowerCase();
            // Buscar por EAN: primero exacto, luego parcial
            const sugerencias = eanData.filter(row => {
                const ean = normalizarBusqueda(row.ean || '').toLowerCase();
                return ean === q || ean.includes(q);
            }).sort((a, b) => {
                // Poner exacto primero
                const eanA = normalizarBusqueda(a.ean || '').toLowerCase();
                const eanB = normalizarBusqueda(b.ean || '').toLowerCase();
                if (eanA === q) return -1;
                if (eanB === q) return 1;
                return 0;
            }).slice(0, 8);
            
            mostrarDropdown('eanDropdown', sugerencias, (item) => {
                eanInput.value = item.ean || '';
                document.getElementById('codigo').value = item.codigo || '';
                document.getElementById('descripcion').value = item.descripcion || '';
                cerrarDropdowns();
            }, 'ean');
        });
        
        eanInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const dropdown = document.getElementById('eanDropdown');
                const items = dropdown?.querySelectorAll('.dropdown-item');
                if (items && items.length > 0) {
                    items[0].click();
                }
            }
        });
        
        eanInput.addEventListener('change', function() {
            if (!this.value.trim()) {
                document.getElementById('codigo').value = '';
                document.getElementById('descripcion').value = '';
            }
        });
    }

    const codigoInput = document.getElementById('codigo');
    if (codigoInput) {
        codigoInput.addEventListener('input', function() {
            const query = this.value.trim();
            if (!query || query.length < 1) {
                cerrarDropdowns();
                return;
            }
            
            const q = normalizarBusqueda(query).toLowerCase();
            // Buscar por Código: primero exacto, luego parcial
            const sugerencias = eanData.filter(row => {
                const codigo = normalizarBusqueda(row.codigo || '').toLowerCase();
                return codigo === q || codigo.includes(q);
            }).sort((a, b) => {
                // Poner exacto primero
                const codA = normalizarBusqueda(a.codigo || '').toLowerCase();
                const codB = normalizarBusqueda(b.codigo || '').toLowerCase();
                if (codA === q) return -1;
                if (codB === q) return 1;
                return 0;
            }).slice(0, 8);
            
            mostrarDropdown('codigoDropdown', sugerencias, (item) => {
                codigoInput.value = item.codigo || '';
                document.getElementById('ean').value = item.ean || '';
                document.getElementById('descripcion').value = item.descripcion || '';
                cerrarDropdowns();
            }, 'codigo');
        });
        
        codigoInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const dropdown = document.getElementById('codigoDropdown');
                const items = dropdown?.querySelectorAll('.dropdown-item');
                if (items && items.length > 0) {
                    items[0].click();
                }
            }
        });
        
        codigoInput.addEventListener('change', function() {
            if (!this.value.trim()) {
                document.getElementById('ean').value = '';
                document.getElementById('descripcion').value = '';
            }
        });
    }

    const descInput = document.getElementById('descripcion');
    if (descInput) {
        descInput.addEventListener('input', function() {
            const query = this.value.trim();
            if (!query || query.length < 1) {
                cerrarDropdowns();
                return;
            }
            
            const q = normalizarBusqueda(query).toLowerCase();
            // Buscar por Descripción: flexible, solo parcial
            const sugerencias = eanData.filter(row => {
                const desc = normalizarBusqueda(row.descripcion || '').toLowerCase();
                return desc.includes(q);
            }).slice(0, 8);
            
            mostrarDropdown('descDropdown', sugerencias, (item) => {
                descInput.value = item.descripcion || '';
                document.getElementById('ean').value = item.ean || '';
                document.getElementById('codigo').value = item.codigo || '';
                cerrarDropdowns();
            }, 'descripcion');
        });
        
        descInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const dropdown = document.getElementById('descDropdown');
                const items = dropdown?.querySelectorAll('.dropdown-item');
                if (items && items.length > 0) {
                    items[0].click();
                }
            }
        });
        
        descInput.addEventListener('change', function() {
            if (!this.value.trim()) {
                document.getElementById('ean').value = '';
                document.getElementById('codigo').value = '';
            }
        });
    }

    document.addEventListener('click', (e) => {
        const formContainer = document.querySelector('.form-container');
        if (formContainer && !formContainer.contains(e.target)) {
            cerrarDropdowns();
        }
    });
}


// ========== MENSAJES ==========

function mostrarMensaje(texto, tipo = "info") {
    const msg = document.getElementById("mensaje");
    if (!msg) return;
    msg.className = `alert alert-${tipo}`;
    msg.textContent = texto;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 4000);
}

function mostrarMensajeTop(texto, tipo = "info") {
    const msg = document.getElementById("mensajeTop");
    if (!msg) return;
    msg.className = `alert alert-${tipo}`;
    msg.textContent = texto;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 4000);
}

function mostrarMensajeForm(texto, tipo = "info") {
    const msg = document.getElementById("mensajeForm");
    if (!msg) return;
    msg.className = `alert alert-${tipo}`;
    msg.textContent = texto;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 4000);
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
        codigoInput.focus();
        return;
    }
    if (!descripcion) {
        mostrarMensaje("⚠️ Ingresa una descripción", "warning");
        descripcionInput.focus();
        return;
    }
    if (!fecha) {
        mostrarMensaje("⚠️ Ingresa fecha de vencimiento", "warning");
        fechaInput.focus();
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
            codigoInput.focus();
        } else if (result.detail) {
            if (result.detail.toLowerCase().includes("ya agregado")) {
                mostrarMensajeTop("❌ " + result.detail, "warning");
            } else {
                mostrarMensaje("❌ " + result.detail, "danger");
            }
        } else {
            mostrarMensaje("❌ Error al agregar producto", "danger");
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
            mostrarMensaje(result.mensaje || "Producto borrado", "danger");
        } else {
            mostrarMensaje(result.detail || "Error al borrar", "danger");
        }
    } catch (e) {
        mostrarMensaje("Error al borrar producto", "danger");
    }
}

// ========== REFRESCAR LISTA ==========

async function refreshLista() {
    try {
        const resp = await fetch('/obtener_lista');
        if (resp.ok) {
            const data = await resp.json();
            if (data && Array.isArray(data.lista)) {
                ultimaLista = data.lista;
                renderLista(ultimaLista);
                const btnToggle = document.getElementById('btnToggle');
                if (btnToggle) btnToggle.textContent = data.lista.length ? 'Ocultar lista' : 'Mostrar lista';
            } else {
                ultimaLista = [];
                renderLista([]);
            }
        }
    } catch (err) {
        console.error('refreshLista error', err);
    }
}

// ========== EDITAR PRODUCTO ==========

async function editarProducto(codigo) {
    try {
        const nuevaDesc = prompt('Ingresa nueva descripción:');
        if (nuevaDesc === null) return;
        const response = await fetch(`/modificar_producto/${codigo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descripcion: nuevaDesc })
        });
        const result = await response.json();
        if (result && result.lista) {
            await refreshLista();
            mostrarMensaje('✏️ Descripción actualizada', 'success');
        } else {
            mostrarMensaje(result?.detail || 'Error al modificar', 'danger');
            await refreshLista();
        }
    } catch (e) {
        console.error(e);
        mostrarMensaje('Error al editar producto', 'danger');
        await refreshLista();
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
        li.className = "list-group-item d-flex flex-column flex-sm-row align-items-start justify-content-between gap-2";

        const left = document.createElement('div');
        left.className = 'flex-grow-1 min-width-0';
        left.innerHTML = `
            <div class="fw-bold text-dark mb-1">${p.Descripcion || ''}</div>
            <div class="text-muted small mb-2">
                <div>Código: <strong>${p.Codigo}</strong>${p.EAN ? ' | EAN: <strong>' + p.EAN + '</strong>' : ''}</div>
                <div>Usuario: <strong>${p.Usuario || '-'}</strong> | Legajo: <strong>${p.Legajo || '-'}</strong></div>
            </div>
            <div class="mb-2">
                <label class="form-label small mb-1">Fecha vencimiento:</label>
                <input type="date" class="form-control form-control-sm fecha-input" value="${p.FechaVencimiento || ''}" style="max-width: 200px;" />
            </div>
            <div class="small">
                <span class="badge bg-info">Stock: ${p.Stock || '-'}</span>
                <span class="badge ${p.DiasRestantes <= 0 ? 'bg-danger' : p.DiasRestantes <= 7 ? 'bg-warning text-dark' : 'bg-success'}">Días: ${p.DiasRestantes || 0}</span>
            </div>
        `;

        const right = document.createElement('div');
        right.className = 'd-flex gap-2 flex-shrink-0';

        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-info btn-sm rounded-circle';
        btnEditar.style.width = '40px';
        btnEditar.style.height = '40px';
        btnEditar.style.padding = '0';
        btnEditar.style.display = 'flex';
        btnEditar.style.alignItems = 'center';
        btnEditar.style.justifyContent = 'center';
        btnEditar.title = 'Editar descripción';
        btnEditar.innerHTML = '✏️';
        btnEditar.addEventListener('click', () => editarProducto(p.Codigo));

        const btnBorrar = document.createElement('button');
        btnBorrar.className = 'btn btn-danger btn-sm rounded-circle';
        btnBorrar.style.width = '40px';
        btnBorrar.style.height = '40px';
        btnBorrar.style.padding = '0';
        btnBorrar.style.display = 'flex';
        btnBorrar.style.alignItems = 'center';
        btnBorrar.style.justifyContent = 'center';
        btnBorrar.title = 'Borrar producto';
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
                const nuevaFecha = e.target.value;
                try {
                    const resp = await fetch(`/modificar_producto/${p.Codigo}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fecha_vencimiento: nuevaFecha })
                    });
                    const resJson = await resp.json();
                    if (resJson && resJson.lista) {
                        await refreshLista();
                        mostrarMensaje('✅ Fecha actualizada', 'success');
                    } else {
                        mostrarMensaje(resJson?.detail || 'Error al actualizar fecha', 'danger');
                        await refreshLista();
                    }
                } catch (err) {
                    console.error(err);
                    mostrarMensaje('Error de conexión', 'danger');
                    await refreshLista();
                }
            });
        }
    });
}

// ========== PAGE LOAD ==========

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Página cargada');
    
    await cargarDatosEAN();
    
    // Configurar listeners DESPUÉS de cargar datos EAN
    setupSearchListeners();
    
    try {
        const response = await fetch('/obtener_lista');
        if (response.ok) {
            const data = await response.json();
            if (data.lista && Array.isArray(data.lista)) {
                ultimaLista = data.lista;
                renderLista(ultimaLista);
                const btnToggle = document.getElementById('btnToggle');
                if (btnToggle && data.lista.length) btnToggle.textContent = 'Ocultar lista';
            }
        }
    } catch (e) {
        console.log('No se pudo cargar lista guardada');
    }

    const btnAgregar = document.getElementById('btnAgregar');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', agregarProducto);
    }

    const btnBorrar = document.getElementById('btnBorrar');
    if (btnBorrar) {
        btnBorrar.addEventListener('click', async () => {
            if (!confirm('¿Estás seguro de que quieres borrar toda la lista?')) return;
            try {
                const response = await fetch('/borrar_lista_completa', { method: 'DELETE' });
                const result = await response.json();
                if (result.lista !== undefined) {
                    renderLista(result.lista);
                    mostrarMensaje(result.mensaje || 'Lista borrada', 'danger');
                } else {
                    mostrarMensaje(result.detail || 'Error al borrar lista', 'danger');
                }
            } catch (e) {
                mostrarMensaje('Error de conexión', 'danger');
            }
        });
    }

    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async () => {
            try {
                const response = await fetch('/guardar_lista', { method: 'POST' });
                if (!response.ok) {
                    mostrarMensajeForm('Error al guardar lista', 'danger');
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
                mostrarMensajeForm('📂 Lista descargada en Excel', 'success');
            } catch (e) {
                mostrarMensajeForm('Error al descargar lista', 'danger');
            }
        });
    }

    const btnToggle = document.getElementById('btnToggle');
    if (btnToggle) {
        btnToggle.addEventListener('click', function() {
            const lista = document.getElementById('lista');
            if (lista) {
                lista.style.display = (lista.style.display === 'none') ? 'block' : 'none';
                btnToggle.textContent = lista.style.display === 'none' ? 'Mostrar lista' : 'Ocultar lista';
            }
        });
    }

    // User controls (draggable)
    const userToggle = document.getElementById('userToggle');
    const userControls = document.querySelector('.user-controls');
    
    if (userControls) {
        try {
            const saved = localStorage.getItem('userControlsPos');
            if (saved) {
                const pos = JSON.parse(saved);
                userControls.style.top = pos.top;
                userControls.style.left = pos.left;
                userControls.style.transform = 'none';
                let left = parseFloat(pos.left);
                let top = parseFloat(pos.top);
                left = Math.max(0, Math.min(left, window.innerWidth - 50));
                top = Math.max(0, Math.min(top, window.innerHeight - 50));
                userControls.style.left = left + 'px';
                userControls.style.top = top + 'px';
            }
        } catch {}

        let dragging = false, offsetX = 0, offsetY = 0;
        userControls.style.cursor = 'move';
        
        userControls.addEventListener('mousedown', e => {
            dragging = true;
            const rect = userControls.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            userControls.style.transform = 'none';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', e => {
            if (dragging) {
                let newLeft = e.clientX - offsetX;
                let newTop = e.clientY - offsetY;
                newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - 50));
                newTop = Math.max(0, Math.min(newTop, window.innerHeight - 50));
                userControls.style.left = newLeft + 'px';
                userControls.style.top = newTop + 'px';
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (dragging) {
                dragging = false;
                localStorage.setItem('userControlsPos', JSON.stringify({
                    top: userControls.style.top,
                    left: userControls.style.left
                }));
            }
        });
    }

    if (userToggle && userControls) {
        userControls.classList.remove('expanded');
        userToggle.addEventListener('click', () => {
            userControls.classList.toggle('expanded');
        });
    }

    // Service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/static/sw.js').then(() => console.log('SW registered')).catch(()=>{});
    }
});
