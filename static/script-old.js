// === Lista cacheada ===
let ultimaLista = [];
let eanData = [];

// === Cargar datos EAN ===
async function cargarDatosEAN() {
    try {
        const res = await fetch('/admin/obtener_ean');
        if (!res.ok) throw new Error('No se pudo cargar EAN');
        const data = await res.json();
        eanData = data.ean_items || [];
        console.log('EAN cargado:', eanData.length, 'items');
    } catch (err) {
        console.error('Error cargando EAN:', err);
    }
}

function normalizarBusqueda(texto) {
    let t = texto.toLowerCase().trim().replace(/\s+/g, '');
    // eliminar terminación ".0" que aparece en Excel cuando trata EAN como número
    t = t.replace(/\.0$/, '');
    // quitar ceros a la izquierda (al menos uno, para casos como 000123)
    t = t.replace(/^0+/, '');
    return t;
}

// === Buscar por EAN ===
function buscarPorEAN(eanValue) {
    if (!eanValue.trim()) return null;
    const q = normalizarBusqueda(eanValue);
    return eanData.find(row => normalizarBusqueda(row.ean || '') === q);
}

// === Buscar por Código ===
function buscarPorCodigo(codigoValue) {
    if (!codigoValue.trim()) return null;
    const q = normalizarBusqueda(codigoValue);
    return eanData.find(row => normalizarBusqueda(row.codigo || '') === q);
}

// === Sugerencias EAN ===
function actualizarSugerenciasEAN(query) {
    const datalist = document.getElementById('eanSuggestions');
    if (!datalist) return;
    datalist.innerHTML = '';
    if (!query.trim()) return;
    
    const q = normalizarBusqueda(query);
    const sugerencias = eanData.filter(row => 
        normalizarBusqueda(row.ean || '').includes(q)
    ).slice(0, 15);
    
    sugerencias.forEach(row => {
        const option = document.createElement('option');
        option.value = row.ean || '';
        option.textContent = `${row.ean} - ${row.codigo} - ${row.descripcion}`;
        datalist.appendChild(option);
    });
}

// === Sugerencias Descripción ===
function actualizarSugerenciasDesc(query) {
    const datalist = document.getElementById('descSuggestions');
    if (!datalist) return;
    datalist.innerHTML = '';
    if (!query.trim()) return;
    
    const q = normalizarBusqueda(query);
    const sugerencias = eanData.filter(row => 
        normalizarBusqueda(row.descripcion || '').includes(q)
    ).slice(0, 15);
    
    sugerencias.forEach(row => {
        const option = document.createElement('option');
        option.value = row.descripcion || '';
        option.textContent = `${row.descripcion} (${row.codigo})`;
        datalist.appendChild(option);
    });
}

// === Búsqueda UNIFICADA (EAN + Inventario) ===
async function buscarUnificado(query) {
    if (!query || query.length < 1) return [];
    try {
        const res = await fetch(`/buscar_from_ean_e_inventario?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        console.log('[buscarUnificado] Busca para:', query, 'Resultados:', data.resultados);
        return data.resultados || [];
    } catch (err) {
        console.error('[buscarUnificado] Error:', err);
        return [];
    }
}

// === Mensaje (Toast) ===
function mostrarMensaje(texto, tipo = "info") {
    const msg = document.getElementById("mensaje");
    if (!msg) return;
    msg.className = `alert alert-${tipo}`;
    msg.textContent = texto;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 4000);
}

// === Mensaje superior debajo del título ===
function mostrarMensajeTop(texto, tipo = "info") {
    const msg = document.getElementById("mensajeTop");
    if (!msg) return;
    msg.className = `alert alert-${tipo}`;
    msg.textContent = texto;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 4000);
}

// === Mensaje en el formulario ===
function mostrarMensajeForm(texto, tipo = "info") {
    const msg = document.getElementById("mensajeForm");
    if (!msg) return;
    msg.className = `alert alert-${tipo}`;
    msg.textContent = texto;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 4000);
}

// === Agregar Producto ===
async function agregarProducto() {
    const codigoInput = document.getElementById("codigo");
    const descripcionInput = document.getElementById("descripcion");
    const fechaInput = document.getElementById("fecha");
    const eanInput = document.getElementById("ean");

    const codigo = codigoInput.value.trim();
    const descripcion = descripcionInput.value.trim();
    const fecha = fechaInput.value;
    const ean = eanInput.value.trim();

    console.log('agregarProducto:', { codigo, descripcion, fecha, ean });

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
                codigo: codigo,
                descripcion: descripcion,
                ean: ean,
                fecha_vencimiento: fecha
            })
        });
        
        const result = await response.json();
        console.log('agregarProducto response:', result);
        
        if (result.lista) {
            renderLista(result.lista);
            mostrarMensajeForm("✅ Producto agregado correctamente", "success");
            // también dejar feedback en la parte inferior si es necesario
            // mostrarMensaje("✅ Producto agregado correctamente", "success");
            
            // Limpiar formulario
            codigoInput.value = "";
            descripcionInput.value = "";
            fechaInput.value = "";
            eanInput.value = "";
            document.getElementById("descSuggestions").innerHTML = "";
            
            // Enfocar en código para siguiente producto
            codigoInput.focus();
        } else if (result.detail) {
            // si ya existe, mostrar arriba bajo el título
            if (result.detail.toLowerCase().includes("ya agregado")) {
                mostrarMensajeTop("❌ " + result.detail, "warning");
            } else {
                mostrarMensaje("❌ " + result.detail, "danger");
            }
        } else {
            mostrarMensaje("❌ Error al agregar producto", "danger");
        }
    } catch (e) {
        console.error('agregarProducto error:', e);
        mostrarMensaje("❌ Error de conexión: " + e.message, "danger");
    }
}

// === Borrar Producto ===
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

// === Helpers ===
async function refreshLista() {
    try {
        const resp = await fetch('/obtener_lista');
        if (resp.ok) {
            const data = await resp.json();
            if (data && Array.isArray(data.lista)) {
                ultimaLista = data.lista;
                renderLista(ultimaLista);
                // también ajustar texto del toggle si lista no está vacía
                const btnToggle = document.getElementById('btnToggle');
                if (btnToggle) btnToggle.textContent = data.lista.length ? 'Ocultar lista' : 'Mostrar lista';
            } else {
                console.warn('refreshLista: lista no es arreglo', data);
                ultimaLista = [];
                renderLista([]);
            }
        }
    } catch (err) {
        console.error('refreshLista error', err);
    }
}

// === Editar Producto ===
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
        console.log('editarProducto response', result);
        if (result && result.lista) {
            // always refresh from server to avoid stale/empty lists
            await refreshLista();
            mostrarMensaje('✏️ Descripción actualizada', 'success');
        } else {
            mostrarMensaje(result && result.detail ? result.detail : 'Error al modificar', 'danger');
            await refreshLista();
        }
    } catch (e) {
        console.error(e);
        mostrarMensaje('Error al editar producto', 'danger');
        await refreshLista();
    }
}

// === Renderizar Lista ===
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

        // Lado izquierdo: Información del producto (vertical)
        const left = document.createElement('div');
        left.className = 'flex-grow-1';
        left.innerHTML = `
            <div class="fw-bold">${p.Descripcion || ''}</div>
            <div class="text-muted small">Código: <strong>${p.Codigo}</strong>${p.EAN ? ' | EAN: <strong>' + p.EAN + '</strong>' : ''}</div>
            <div class="text-muted small">Fecha vencimiento: <input type="date" class="form-control form-control-sm fecha-input" value="${p.FechaVencimiento || ''}" /></div>
            <div class="small mt-1">Stock: ${p.Stock || '-'} | Días restantes: <span class="badge bg-warning text-dark dias-badge">${p.DiasRestantes || 0}</span></div>
            <div class="text-muted small mt-1">Usuario: <strong>${p.Usuario || '-'}</strong> | Legajo: <strong>${p.Legajo || '-'}</strong></div>
        `;

        // Lado derecho: Botones (editar y borrar)
        const right = document.createElement('div');
        right.style.minWidth = 'auto';
        right.style.paddingLeft = '10px';
        right.style.flexShrink = 0;
        right.className = 'd-flex gap-2';

        // Botón Editar (editar descripción)
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-info btn-sm rounded-circle';
        btnEditar.style.width = '40px';
        btnEditar.style.height = '40px';
        btnEditar.style.padding = '0';
        btnEditar.style.display = 'flex';
        btnEditar.style.alignItems = 'center';
        btnEditar.style.justifyContent = 'center';
        btnEditar.style.fontSize = '1rem';
        btnEditar.title = 'Editar descripción';
        btnEditar.textContent = '✏️';
        btnEditar.addEventListener('click', () => editarProducto(p.Codigo));

        // Botón Borrar
        const btnBorrar = document.createElement('button');
        btnBorrar.className = 'btn btn-danger btn-sm rounded-circle';
        btnBorrar.style.width = '40px';
        btnBorrar.style.height = '40px';
        btnBorrar.style.padding = '0';
        btnBorrar.style.display = 'flex';
        btnBorrar.style.alignItems = 'center';
        btnBorrar.style.justifyContent = 'center';
        btnBorrar.style.fontSize = '1.2rem';
        btnBorrar.title = 'Borrar producto';
        btnBorrar.textContent = '🗑️';
        btnBorrar.addEventListener('click', () => borrarProducto(p.Codigo));

        right.appendChild(btnEditar);
        right.appendChild(btnBorrar);
        li.appendChild(left);
        li.appendChild(right);
        contenedor.appendChild(li);

        // Añadir listener para edición inline de la fecha
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
                    console.log('fecha change response', resJson);
                    if (resJson && resJson.lista) {
                        await refreshLista();
                        mostrarMensaje('✅ Fecha actualizada', 'success');
                    } else {
                        mostrarMensaje(resJson && resJson.detail ? resJson.detail : 'Error al actualizar fecha', 'danger');
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

// === Autocompletado ===
let autocompleteTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
    // === Cargar lista guardada al iniciar página ===
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

    // no filters needed any more


    // === Elemento: Descripción ===
    const descInput = document.getElementById('descripcion');
    if (descInput) {
        // Autosugerencias mientras escribes
        descInput.addEventListener('input', function() {
            const val = this.value.trim();
            
            if (autocompleteTimer) clearTimeout(autocompleteTimer);
            
            if (!val) {
                const list = document.getElementById('descSuggestions');
                if (list) list.innerHTML = '';
                return;
            }

            autocompleteTimer = setTimeout(async () => {
                try {
                    const res = await fetch('/buscar_producto?descripcion=' + encodeURIComponent(val));
                    const data = await res.json();
                    const matches = data.matches || [];
                    const list = document.getElementById('descSuggestions');
                    
                    if (list) {
                        list.innerHTML = '';
                        matches.slice(0, 10).forEach(m => {
                            const opt = document.createElement('option');
                            const desc = (m.descripcion || '');
                            const cod = (m.codigo || '');
                            const ean = (m.ean || '');
                            let display = desc;
                            if (cod) display += ' [' + cod + ']';
                            if (ean) display += ' (EAN: ' + ean + ')';
                            opt.value = display;
                            opt.textContent = opt.value;
                            list.appendChild(opt);
                        });
                    }
                } catch (e) {
                    console.error('Error en autocompletado:', e);
                }
            }, 300);
        });

        // Cuando CAMBIA o SALE del campo descripción, auto-llenar código y EAN
        descInput.addEventListener('change', autocompletarDesdeDescripcion);
        descInput.addEventListener('blur', autocompletarDesdeDescripcion);
        
        async function autocompletarDesdeDescripcion() {
            const val = descInput.value.trim().split('[')[0].trim();
            if (!val) return;
            
            console.log('📝 Buscando desde descripción:', val);
            try {
                const res = await fetch('/buscar_producto?descripcion=' + encodeURIComponent(val));
                const data = await res.json();
                const matches = data.matches || [];
                
                if (matches.length > 0) {
                    const codigoVal = (matches[0].codigo || '').toString();
                    const eanVal = (matches[0].ean || '').toString();
                    const codigoInput = document.getElementById('codigo');
                    const eanInput = document.getElementById('ean');
                    
                    if (codigoVal && codigoInput && !codigoInput.value.trim()) {
                        codigoInput.value = codigoVal;
                        console.log('✓ Código autocompletado:', codigoVal);
                    }
                    if (eanVal && eanInput && !eanInput.value.trim()) {
                        eanInput.value = eanVal;
                        console.log('✓ EAN autocompletado:', eanVal);
                    }
                }
            } catch (e) {
                console.error('Error autocompletando desde descripción:', e);
            }
        }
    }

    // === Elemento: Código ===
    const codigoInput2 = document.getElementById('codigo');
    if (codigoInput2) {
        // permitir mover focus a fecha al presionar Enter
        codigoInput2.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const fechaInput = document.getElementById('fecha');
                if (fechaInput) {
                    fechaInput.focus();
                }
            }
        });

        // Cuando CAMBIA o SALE del campo código, auto-llenar descripción y EAN
        codigoInput2.addEventListener('change', autocompletarDesdeCodigo);
        codigoInput2.addEventListener('blur', autocompletarDesdeCodigo);
        
        async function autocompletarDesdeCodigo() {
            const codeVal = codigoInput2.value.trim();
            console.log('🔍 Buscando desde código:', codeVal);
            if (!codeVal) return;
            
            try {
                const res = await fetch('/buscar_producto?code=' + encodeURIComponent(codeVal) + '&codigo=' + encodeURIComponent(codeVal));
                const data = await res.json();
                const matches = data.matches || [];
                
                if (matches.length > 0) {
                    const descVal = (matches[0].descripcion || '');
                    const eanVal = (matches[0].ean || '');
                    const descInput = document.getElementById('descripcion');
                    const eanInput = document.getElementById('ean');
                    
                    if (descVal && descInput && !descInput.value.trim()) {
                        descInput.value = descVal;
                        console.log('✓ Descripción autocompletada:', descVal);
                        mostrarMensaje('✅ Producto encontrado: ' + descVal, 'success');
                    }
                    if (eanVal && eanInput && !eanInput.value.trim()) {
                        eanInput.value = eanVal;
                        console.log('✓ EAN autocompletado:', eanVal);
                    }
                } else {
                    console.log('⚠️ Código no encontrado:', codeVal);
                }
            } catch (e) {
                console.error('Error autocompletando desde código:', e);
            }
        }
    }

    // === Botones de Acción ===
    
    // Botón Agregar
    const btnAgregar = document.getElementById('btnAgregar');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', agregarProducto);
    }

    // Botón Borrar Lista Completa
    const btnBorrar = document.getElementById('btnBorrar');
    const borrarHandler = async function() {
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
    };
    if (btnBorrar) btnBorrar.addEventListener('click', borrarHandler);

    // Botón Guardar Lista
    const btnGuardar = document.getElementById('btnGuardar');
    const guardarHandler = async function() {
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
            // feedback in the same spot as adding a product
            mostrarMensajeForm('📂 Lista guardada y descargada en Excel', 'success');
            // opcional: desplazar vista hacia la lista
            const listaEl = document.getElementById('lista');
            if (listaEl) listaEl.scrollIntoView({behavior:'smooth'});
        } catch (e) {
            mostrarMensajeForm('Error al descargar lista', 'danger');
        }
    };
    if (btnGuardar) btnGuardar.addEventListener('click', guardarHandler);

    // Botón Toggle Lista
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

    // === Cerrar sesión con opciones ===
    // toggle user details panel
    const userToggle = document.getElementById('userToggle');
    const userControls = document.querySelector('.user-controls');


    if (userControls) {
        // restore saved position (top/left) if any
        try {
            const saved = localStorage.getItem('userControlsPos');
            if (saved) {
                const pos = JSON.parse(saved);
                userControls.style.top = pos.top;
                userControls.style.left = pos.left;
                userControls.style.transform = 'none';
                userControls.style.bottom = 'auto';
                userControls.style.right = 'auto';
                // clamp to screen
                let left = parseFloat(pos.left);
                let top = parseFloat(pos.top);
                left = Math.max(0, Math.min(left, window.innerWidth - 50));
                top = Math.max(0, Math.min(top, window.innerHeight - 50));
                userControls.style.left = left + 'px';
                userControls.style.top = top + 'px';
            }
        } catch {}

        // make the icon draggable to reposition
        let dragging = false, offsetX = 0, offsetY = 0;
        const dragHandle = userControls;
        if (dragHandle) {
            dragHandle.style.cursor = 'move';
            dragHandle.addEventListener('mousedown', e => {
                dragging = true;
                const rect = userControls.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                userControls.style.transform = 'none';
                e.preventDefault();
            });
            // for touch devices
            dragHandle.addEventListener('touchstart', e => {
                dragging = true;
                const rect = userControls.getBoundingClientRect();
                const touch = e.touches[0];
                offsetX = touch.clientX - rect.left;
                offsetY = touch.clientY - rect.top;
                userControls.style.transform = 'none';
                e.preventDefault();
            });
            document.addEventListener('mousemove', e => {
                if (dragging) {
                    let newLeft = e.clientX - offsetX;
                    let newTop = e.clientY - offsetY;
                    // clamp to keep button visible (assuming button is 50px)
                    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - 50));
                    newTop = Math.max(0, Math.min(newTop, window.innerHeight - 50));
                    userControls.style.left = newLeft + 'px';
                    userControls.style.top = newTop + 'px';
                }
            });
            document.addEventListener('touchmove', e => {
                if (dragging) {
                    const touch = e.touches[0];
                    let newLeft = touch.clientX - offsetX;
                    let newTop = touch.clientY - offsetY;
                    // clamp to keep button visible
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
            document.addEventListener('touchend', () => {
                if (dragging) {
                    dragging = false;
                    localStorage.setItem('userControlsPos', JSON.stringify({
                        top: userControls.style.top,
                        left: userControls.style.left
                    }));
                }
            });
        }
    }

    if (userToggle && userControls) {
        userControls.classList.remove('expanded');
        userToggle.addEventListener('click', () => {
            const isExpanding = !userControls.classList.contains('expanded');
            if (isExpanding) {
                // determinar qué borde está más cerca
                const left = parseFloat(userControls.style.left || '0');
                const top = parseFloat(userControls.style.top || '0');
                const right = window.innerWidth - left - 50;
                const bottom = window.innerHeight - top - 50;
                
                // encontrar la distancia mínima a un borde
                const distances = {
                    left: left,
                    right: right,
                    top: top,
                    bottom: bottom
                };
                
                const nearestEdge = Object.keys(distances).reduce((a, b) => 
                    distances[a] < distances[b] ? a : b
                );
                
                // remover todas las clases de dirección
                userControls.classList.remove('open-left', 'open-right', 'open-top', 'open-bottom');
                
                // agregar la clase según el borde más cercano (opuesto)
                switch(nearestEdge) {
                    case 'left':
                        userControls.classList.add('open-right');
                        break;
                    case 'right':
                        userControls.classList.add('open-left');
                        break;
                    case 'top':
                        userControls.classList.add('open-bottom');
                        break;
                    case 'bottom':
                        userControls.classList.add('open-top');
                        break;
                }
            }
            userControls.classList.toggle('expanded');
        });
        // also for touch
        userToggle.addEventListener('touchend', () => {
            const isExpanding = !userControls.classList.contains('expanded');
            if (isExpanding) {
                // determinar qué borde está más cerca
                const left = parseFloat(userControls.style.left || '0');
                const top = parseFloat(userControls.style.top || '0');
                const right = window.innerWidth - left - 50;
                const bottom = window.innerHeight - top - 50;
                
                // encontrar la distancia mínima a un borde
                const distances = {
                    left: left,
                    right: right,
                    top: top,
                    bottom: bottom
                };
                
                const nearestEdge = Object.keys(distances).reduce((a, b) => 
                    distances[a] < distances[b] ? a : b
                );
                
                // remover todas las clases de dirección
                userControls.classList.remove('open-left', 'open-right', 'open-top', 'open-bottom');
                
                // agregar la clase según el borde más cercano (opuesto)
                switch(nearestEdge) {
                    case 'left':
                        userControls.classList.add('open-right');
                        break;
                    case 'right':
                        userControls.classList.add('open-left');
                        break;
                    case 'top':
                        userControls.classList.add('open-bottom');
                        break;
                    case 'bottom':
                        userControls.classList.add('open-top');
                        break;
                }
            }
            userControls.classList.toggle('expanded');
        });
        // collapse when clicking outside
        document.addEventListener('click', (e) => {
            if (!userControls.contains(e.target)) {
                userControls.classList.remove('expanded');
            }
        });
        document.addEventListener('touchend', (e) => {
            if (!userControls.contains(e.target)) {
                userControls.classList.remove('expanded');
            }
        });
    }

    const btnCerrar = document.getElementById('btnCerrarSesion');
    console.log('btnCerrar:', btnCerrar);
    
    if (btnCerrar) {
        const modalEl = document.getElementById('modalCerrar');
        console.log('modalEl:', modalEl);
        
        let bsModal = null;
        if (modalEl && window.bootstrap && window.bootstrap.Modal) {
            bsModal = new bootstrap.Modal(modalEl);
            console.log('✓ Bootstrap Modal creado');
        } else {
            console.log('⚠️ Bootstrap Modal no disponible - usando confirm()');
        }

        btnCerrar.addEventListener('click', async () => {
            console.log('🚪 Botón cerrar sesión clickeado');
            
            if (bsModal) {
                console.log('📋 Mostrando modal');
                bsModal.show();
            } else {
                console.log('❓ Usando confirm() alternativo');
                // fallback simple confirm
                const keep = confirm('¿Guardar lista al salir?\n\n(Aceptar = mantener lista, Cancelar = eliminar)');
                console.log('✓ Usuario seleccionó:', keep ? 'mantener' : 'eliminar');
                await sessionClose(!keep);
            }
        });

        const keepBtn = document.getElementById('keepAndLogout');
        const clearBtn = document.getElementById('clearAndLogout');
        
        console.log('keepBtn:', keepBtn);
        console.log('clearBtn:', clearBtn);

        if (keepBtn) {
            keepBtn.addEventListener('click', async () => {
                console.log('✓ Mantener lista y logout');
                await sessionClose(false);
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                console.log('🗑️ Eliminar lista y logout');
                await sessionClose(true);
            });
        }
    } else {
        console.error('❌ btnCerrar no encontrado en el DOM');
    }

    async function sessionClose(clearFlag) {
        console.log('📤 Cerrando sesión - clear:', clearFlag);
        try {
            const response = await fetch('/session/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clear: clearFlag })
            });
            const data = await response.json();
            console.log('✓ Response /session/close:', data);
            mostrarMensaje('Sesión cerrada', 'success');
        } catch (e) {
            console.error('❌ Error cerrando sesión:', e);
            mostrarMensaje('Error cerrando sesión: ' + e.message, 'danger');
        }
        
        // Redirigir a logout
        console.log('🔄 Redirigiendo a /logout');
        setTimeout(() => {
            window.location.href = '/logout';
        }, 500);
    }

    // === Flujo de Teclado (Enter) ===
    
    const descInputFinal = document.getElementById('descripcion');
    if (descInputFinal) {
        descInputFinal.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('✓ Descripción + Enter → Código');
                const codInput = document.getElementById('codigo');
                if (codInput) {
                    codInput.focus();
                    codInput.select();
                }
            }
        });
    }

    const codInputFinal = document.getElementById('codigo');
    if (codInputFinal) {
        codInputFinal.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('✓ Código + Enter → Fecha. Código:', this.value);
                const fechaInput = document.getElementById('fecha');
                if (fechaInput) {
                    fechaInput.focus();
                    fechaInput.click(); // Abre el picker de fecha
                }
            }
        });
    }

    const fechaInputFinal = document.getElementById('fecha');
    if (fechaInputFinal) {
        fechaInputFinal.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('✓ Fecha + Enter → Agregar. Fecha:', this.value);
                agregarProducto();
            }
        });
    }

    // === Service Worker ===
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/static/sw.js')
            .then(() => console.log('✅ Service Worker registrado'))
            .catch(err => console.log('Service Worker error:', err));
    }

    // === Archivos del usuario ===
    const btnRefrescarArchivos = document.getElementById('btnRefrescarArchivos');
    if (btnRefrescarArchivos) {
        btnRefrescarArchivos.addEventListener('click', listarMisArchivos);
        // Cargar archivos al iniciar
        listarMisArchivos();
    }
});

// === Funciones para archivos del usuario ===
async function listarMisArchivos() {
    try {
        const response = await fetch('/listar_mis_archivos');
        const data = await response.json();
        const container = document.getElementById('archivosContainer');
        
        if (!container) return;
        
        if (!data.archivos || data.archivos.length === 0) {
            container.innerHTML = '<p class="text-muted small">No hay archivos subidos</p>';
            return;
        }
        
        let html = '<div class="table-responsive"><table class="table table-sm table-striped">';
        html += '<thead><tr><th>Archivo</th><th>Fecha</th><th>Hora</th><th>Tamaño</th><th>Acciones</th></tr></thead><tbody>';
        
        data.archivos.forEach(archivo => {
            html += `
                <tr>
                    <td>${archivo.filename}</td>
                    <td>${archivo.fecha}</td>
                    <td>${archivo.hora}</td>
                    <td>${archivo.size} bytes</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="borrarMiArchivo('${archivo.filename}')">🗑️</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    } catch (e) {
        console.error('Error listando archivos:', e);
        const container = document.getElementById('archivosContainer');
        if (container) {
            container.innerHTML = '<p class="text-danger small">Error al cargar archivos</p>';
        }
    }
}

async function borrarMiArchivo(filename) {
    if (!confirm(`¿Estás seguro de que quieres borrar "${filename}"?`)) return;
    
    try {
        const response = await fetch('/borrar_archivo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `filename=${encodeURIComponent(filename)}`
        });
        
        const result = await response.json();
        if (result.mensaje) {
            mostrarMensaje('✅ ' + result.mensaje, 'success');
            listarMisArchivos(); // refrescar lista
        } else {
            mostrarMensaje('❌ Error al borrar archivo', 'danger');
        }
    } catch (e) {
        console.error('Error borrando archivo:', e);
        mostrarMensaje('❌ Error de conexión', 'danger');
    }
}