// === Lista cacheada ===
let ultimaLista = [];
let eanData = [];

// Legacy helper (no-op) para evitar errores si el navegador carga una versión anterior del script
function renderCatalogList(query) {
    // No se usa actualmente; existe para evitar "ReferenceError: renderCatalogList is not defined"
    return;
}

console.log('📦 script.js v4 cargado');

// === Cargar datos EAN ===
async function cargarDatosEAN() {
    try {
        console.log('📥 Iniciando cargarDatosEAN...');
        const res = await fetch('/admin/obtener_ean', { credentials: 'include' });
        console.log('📥 Respuesta obtenida, status:', res.status);
        if (!res.ok) throw new Error('No se pudo cargar EAN');
        const data = await res.json();
        eanData = (data.ean_items || []).map(item => ({
            ...item,
            codigo: item.codigo ?? item.Codigo ?? item.CODIGO ?? "",
            descripcion: item.descripcion ?? item.Descripcion ?? item.DESCRIPCION ?? "",
            ean: item.ean ?? item.EAN ?? item.Ean ?? "",
        }));
        console.log('✅ EAN cargado:', eanData.length, 'items');
        console.log('📊 Primeros items:', eanData.slice(0, 2));

        // Mostrar en UI cuántos items se cargaron (para depuración y confirmación)
        const status = document.getElementById('eanStatus');
        if (status) {
            status.textContent = `Catálogo cargado: ${eanData.length} items`;
        }
    } catch (err) {
        console.error('❌ Error cargando EAN:', err);
        const status = document.getElementById('eanStatus');
        if (status) {
            status.textContent = 'Error cargando catálogo EAN';
        }
    }
}

function normalizarBusqueda(texto) {
    // Normalizar para búsqueda: minúsculas, espacios, y quitar ceros a la izquierda en números
    let t = texto.toString().toLowerCase().trim().replace(/\s+/g, '');
    // Si es solo dígitos, quitar ceros a la izquierda
    if (/^\d+$/.test(t)) {
        t = t.replace(/^0+/, '') || '0';
    }
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

    let codigo = codigoInput.value.trim();
    let descripcion = descripcionInput.value.trim();
    const fecha = fechaInput.value;
    let ean = eanInput.value.trim();

    // Si el usuario completó cualquiera de los campos, intentar autocompletar los demás
    if (!codigo || !descripcion || !ean) {
        const termCodigo = normalizarBusqueda(codigo);
        const termDesc = normalizarBusqueda(descripcion);
        const termEan = normalizarBusqueda(ean);

        const match = eanData.find(item => {
            const itemCod = normalizarBusqueda(item.codigo || '');
            const itemDesc = normalizarBusqueda(item.descripcion || '');
            const itemEan = normalizarBusqueda(item.ean || '');
            if (termCodigo && itemCod === termCodigo) return true;
            if (termEan && itemEan === termEan) return true;
            if (termDesc && itemDesc === termDesc) return true;
            return false;
        });

        if (match) {
            if (!codigo && match.codigo) {
                codigo = match.codigo;
                if (codigoInput) codigoInput.value = match.codigo;
            }
            if (!descripcion && match.descripcion) {
                descripcion = match.descripcion;
                if (descripcionInput) descripcionInput.value = match.descripcion;
            }
            if ((!ean || ean === codigo) && match.ean) {
                ean = match.ean;
                if (eanInput) eanInput.value = match.ean;
            }
        }
    }

    // Si ingresaron código pero ean quedó igual al código (o vacío), forzar lookup de EAN real
    const codigoNorm = normalizarBusqueda(codigo);
    if (codigoNorm) {
        const lookup = eanData.find(item => normalizarBusqueda(item.codigo || '') === codigoNorm);
        if (lookup && lookup.ean && lookup.ean !== codigo) {
            ean = lookup.ean;
            if (eanInput) eanInput.value = lookup.ean;
        }
    }

    console.log('agregarProducto:', { codigo, descripcion, fecha, ean });

    if (!codigo) {
        mostrarMensaje("⚠️ Ingresa un código", "warning");
        codigoInput.focus();
        return;
    }

    // Evitar enviar códigos duplicados (verificar localmente primero)
    const codigoNormCheck = normalizarBusqueda(codigo);
    if (ultimaLista.some(p => normalizarBusqueda(p.Codigo || '') === codigoNormCheck)) {
        mostrarMensajeTop("⚠️ Ya agregaste ese código", "warning");
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
            const descSuggestions = document.getElementById("descSuggestions");
            if (descSuggestions) descSuggestions.innerHTML = "";
            
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

// === Editar Producto (Stock) INLINE ===
async function modificarStock(codigo, nuevoStock) {
    try {
        const response = await fetch(`/modificar_producto/${codigo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: nuevoStock })
        });
        const result = await response.json();
        if (result && result.lista) {
            await refreshLista();
            mostrarMensaje('📦 Stock actualizado', 'success');
            return true;
        }
        mostrarMensaje(result && result.detail ? result.detail : 'Error al modificar', 'danger');
        return false;
    } catch (e) {
        console.error('Error modificar stock:', e);
        mostrarMensaje('Error de conexión', 'danger');
        return false;
    }
}

function iniciarEdicionStock(container, codigo, stockActual, descripcion = '') {
    const stockValue = container.querySelector('.stock-value');
    const stockEditor = container.querySelector('.stock-editor');
    const stockInput = container.querySelector('.stock-input');
    const btnEditar = container.querySelector('.stock-edit-btn');
    const btnGuardar = container.querySelector('.stock-save-btn');
    const btnCancelar = container.querySelector('.stock-cancel-btn');

    if (!stockValue || !stockEditor || !stockInput || !btnEditar || !btnGuardar || !btnCancelar) return;

    stockValue.classList.add('d-none');
    stockEditor.classList.remove('d-none');
    btnEditar.classList.add('d-none');

    const formatted = formatStock(stockActual, descripcion);
    stockInput.value = formatted && formatted !== '-' ? formatted : '';
    stockInput.focus();
    stockInput.select();

    btnGuardar.onclick = async () => {
        const nuevoStock = parseFloat(stockInput.value.trim().replace(',', '.'));
        if (isNaN(nuevoStock) || nuevoStock < 0) {
            mostrarMensaje('Ingresa un stock válido (número ≥ 0)', 'warning');
            return;
        }
        const ok = await modificarStock(codigo, nuevoStock);
        if (ok) {
            stockValue.textContent = nuevoStock;
            stockValue.classList.remove('d-none');
            stockEditor.classList.add('d-none');
            btnEditar.classList.remove('d-none');
        }
    };

    btnCancelar.onclick = () => {
        stockValue.classList.remove('d-none');
        stockEditor.classList.add('d-none');
        btnEditar.classList.remove('d-none');
    };
}

// === Renderizar Lista ===
function formatStock(stock, descripcion = '') {
    if (stock === null || stock === undefined || stock === '') return '-';
    const n = Number(stock);
    if (!Number.isFinite(n)) return String(stock);

    // Si es entero, mostrar sin decimales (unidades).
    // Si tiene parte decimal, mostrar siempre 3 decimales (kilos).
    if (Number.isInteger(n)) {
        return n.toString();
    }
    return n.toFixed(3);
}

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
        left.className = 'flex-grow-1 product-info';
        left.innerHTML = `
            <div class="product-desc">${p.Descripcion || ''}</div>
            <div class="d-flex flex-wrap align-items-center gap-2 mt-1">
                <div class="text-muted small">Código: <strong>${p.Codigo}</strong>${p.EAN ? ' | EAN: <strong>' + p.EAN + '</strong>' : ''}</div>
                <div class="text-muted small">Fecha: <input type="date" class="form-control form-control-sm fecha-input" value="${p.FechaVencimiento || ''}" /></div>
            </div>
            <div class="d-flex flex-wrap align-items-center gap-3 mt-2">
                <div class="stock-row">Stock: <span class="stock-value">${formatStock(p.Stock, p.Descripcion)}</span>
                    <span class="stock-editor d-none">
                        <input type="number" min="0" step="0.001" class="form-control form-control-sm stock-input" style="width:100px; display:inline-block;" />
                        <button type="button" class="btn btn-sm btn-success stock-save-btn ms-1">💾</button>
                        <button type="button" class="btn btn-sm btn-secondary stock-cancel-btn ms-1">✖</button>
                    </span>
                </div>
                <div class="dias-row">Días restantes: <span class="badge bg-warning text-dark dias-badge">${p.DiasRestantes || 0}</span></div>
            </div>
            <div class="text-muted small mt-2">Usuario: <strong>${p.Usuario || '-'}</strong> | Legajo: <strong>${p.Legajo || '-'}</strong></div>
        `;

        // Lado derecho: Botones (editar y borrar)
        const right = document.createElement('div');
        right.style.minWidth = 'auto';
        right.style.paddingLeft = '10px';
        right.style.flexShrink = 0;
        right.className = 'd-flex gap-2';

        // Botón Editar stock (inline)
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-outline-primary btn-sm stock-edit-btn';
        btnEditar.title = 'Editar stock';
        btnEditar.textContent = '✏️';
        btnEditar.style.width = '40px';
        btnEditar.style.height = '40px';
        btnEditar.style.padding = '0';
        btnEditar.addEventListener('click', () => iniciarEdicionStock(li, p.Codigo, p.Stock, p.Descripcion));

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
let ignoreCloseDropdown = false;

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-suggestions').forEach(d => {
        d.classList.add('d-none');
        d.innerHTML = '';
    });
}

function positionDropdown(dropdownEl, input) {
    if (!dropdownEl || !input) return;

    // Mostrar el dropdown debajo del campo, sin cubrirlo.
    dropdownEl.style.position = 'absolute';
    dropdownEl.style.top = '100%';
    dropdownEl.style.left = '0';
    dropdownEl.style.width = 'auto';
    dropdownEl.style.minWidth = `${Math.max(input.offsetWidth, 320)}px`;
    dropdownEl.style.maxWidth = '95vw';
    dropdownEl.style.display = 'block';
}

function renderSuggestions(dropdownEl, items, renderItem, field) {
    if (!dropdownEl) return;
    if (!items) items = [];
    dropdownEl.classList.remove('d-none');
    dropdownEl.style.display = 'none';
    console.log('renderSuggestions', field, 'items:', items.length);

    if (items.length === 0) {
        dropdownEl.innerHTML = `<div class="dropdown-item text-muted" style="cursor: default;">No hay resultados</div>`;
        return;
    }

    dropdownEl.innerHTML = items.map(it => {
        const safeEan = it.ean != null ? String(it.ean) : '';
        const safeCodigo = it.codigo != null ? String(it.codigo) : '';
        const safeDesc = it.descripcion != null ? String(it.descripcion) : '';
        return `
        <div class="dropdown-item" data-ean="${safeEan.replace(/\"/g,'&quot;')}" data-codigo="${safeCodigo.replace(/\"/g,'&quot;')}" data-desc="${safeDesc.replace(/\"/g,'&quot;')}">
            ${renderItem(it)}
        </div>
    `;
    }).join('');

    // Posicionar el dropdown cerca del input activo
    const activeInput = document.querySelector(`#${field}`);
    if (activeInput) {
        positionDropdown(dropdownEl, activeInput);
    }

    dropdownEl.addEventListener('mousedown', () => {
        // Evitar que el blur del input cierre el dropdown antes de click
        ignoreCloseDropdown = true;
    });

    dropdownEl.querySelectorAll('.dropdown-item').forEach(el => {
        el.addEventListener('click', (event) => {
            event.stopPropagation();
            const valorEan = el.dataset.ean || '';
            const valorCodigo = el.dataset.codigo || '';
            const valorDesc = el.dataset.desc || '';
            const input = document.getElementById(field);

            // Asignar el valor correcto según el campo sobre el que se está autocompletando
            if (input) {
                if (field === 'codigo') input.value = valorCodigo || input.value;
                else if (field === 'ean') input.value = valorEan || input.value;
                else input.value = valorDesc || input.value;
            }

            // Completar todos los campos para mantener consistencia
            if (document.getElementById('ean')) document.getElementById('ean').value = valorEan;
            if (document.getElementById('codigo')) document.getElementById('codigo').value = valorCodigo;
            if (document.getElementById('descripcion')) document.getElementById('descripcion').value = valorDesc;

            closeAllDropdowns();
        });
    });
}

function clearDependentFields(fieldId) {
    if (fieldId === 'descripcion') {
        const c = document.getElementById('codigo');
        const e = document.getElementById('ean');
        if (c) c.value = '';
        if (e) e.value = '';
    }
    if (fieldId === 'codigo') {
        const d = document.getElementById('descripcion');
        const e = document.getElementById('ean');
        if (d) d.value = '';
        if (e) e.value = '';
    }
    if (fieldId === 'ean') {
        const d = document.getElementById('descripcion');
        const c = document.getElementById('codigo');
        if (d) d.value = '';
        if (c) c.value = '';
    }
}

function autofillFromEanData(triggerField, value, allowSingleMatch = false) {
    const term = normalizarBusqueda(value);
    if (!term) return;

    // Buscar coincidencias en el campo indicado (código / descripción / EAN)
    const candidates = eanData.filter(item => {
        const fieldValue = normalizarBusqueda(item[triggerField] || '');
        return fieldValue === term || fieldValue.startsWith(term) || fieldValue.includes(term);
    });
    if (!candidates.length) return;

    // Preferir coincidencia exacta.
    // Si se invoca con allowSingleMatch=true, también llenar cuando hay solo 1 sugerencia.
    let match = candidates.find(item => normalizarBusqueda(item[triggerField] || '') === term);
    if (!match && allowSingleMatch && candidates.length === 1) match = candidates[0];
    if (!match) return;

    const descEl = document.getElementById('descripcion');
    const codEl = document.getElementById('codigo');
    const eanEl = document.getElementById('ean');

    // Si el campo ya tiene valor, solo actualizar si no coincide con la sugerencia.
    if (descEl && match.descripcion) {
        const current = normalizarBusqueda(descEl.value || '');
        const expected = normalizarBusqueda(match.descripcion);
        if (!current || current !== expected) {
            descEl.value = match.descripcion;
        }
    }
    if (codEl && match.codigo) {
        const current = normalizarBusqueda(codEl.value || '');
        const expected = normalizarBusqueda(match.codigo);
        if (!current || current !== expected) {
            codEl.value = match.codigo;
        }
    }
    if (eanEl && match.ean) {
        const current = normalizarBusqueda(eanEl.value || '');
        const expected = normalizarBusqueda(match.ean);
        if (!current || current !== expected) {
            eanEl.value = match.ean;
        }
    }
}

function setupAutocomplete(inputId, dropdownId, field) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    if (!input || !dropdown) return;

    // Buscar coincidencias solo en el campo que se está escribiendo
    const getMatches = (term) => {
        if (!term) return eanData.slice(); // devolver todo si no hay término para mostrar sugerencias iniciales

        if (field === 'codigo') {
            const starts = eanData.filter(item => normalizarBusqueda(item.codigo || '').startsWith(term));
            if (starts.length) return starts;
            return eanData.filter(item => normalizarBusqueda(item.codigo || '').includes(term));
        }
        if (field === 'ean') {
            const starts = eanData.filter(item => normalizarBusqueda(item.ean || '').startsWith(term));
            if (starts.length) return starts;
            return eanData.filter(item => normalizarBusqueda(item.ean || '').includes(term));
        }
        // field === 'descripcion'
        return eanData.filter(item => normalizarBusqueda(item.descripcion || '').includes(term));
    };

    const renderForField = (matches, field) => {
        const badge = (text, label) => {
            if (!text) return '';
            return `<span class="badge bg-secondary me-1" style="font-size:0.75rem;">${label ? label+': ' : ''}${text}</span>`;
        };

        renderSuggestions(dropdown, matches.slice(0, 12), (it) => {
            const code = it.codigo || '';
            const ean = it.ean || '';
            const desc = it.descripcion || '';

            if (field === 'descripcion') {
                return `
                    <div class="item-label">${desc}</div>
                    <div class="item-meta">${badge(code, 'Código')}${badge(ean, 'EAN')}</div>
                `;
            }
            if (field === 'codigo') {
                return `
                    <div class="item-label">${code}</div>
                    <div class="item-meta">${badge(desc, '')}${badge(ean, 'EAN')}</div>
                `;
            }
            // field === 'ean'
            return `
                <div class="item-label">${ean}</div>
                <div class="item-meta">${badge(desc, '')}${badge(code, 'Código')}</div>
            `;
        }, field);
    };

    input.addEventListener('input', () => {
        const val = input.value.trim();
        if (autocompleteTimer) clearTimeout(autocompleteTimer);

        // Si el campo se vacía, limpiar los campos relacionados y ocultar sugerencias
        if (val.length === 0) {
            clearDependentFields(inputId);
            dropdown.classList.add('d-none');
            return;
        }

        // Mostrar sugerencias desde 1 carácter (mejor experiencia de usuario)
        if (val.length < 1) {
            dropdown.classList.add('d-none');
            return;
        }

        console.log('autocomplete input:', inputId, 'valor:', val);

        autocompleteTimer = setTimeout(() => {
            const term = normalizarBusqueda(val);
            let matches = getMatches(term);

            // Priorizar coincidencias que comienzan exactamente con el término
            const starts = matches.filter(item => {
                const fieldVal = normalizarBusqueda(item[field] || '');
                return fieldVal.startsWith(term);
            });
            const others = matches.filter(item => {
                const fieldVal = normalizarBusqueda(item[field] || '');
                return !fieldVal.startsWith(term);
            });
            matches = [...starts, ...others];

            // Rellenar automáticamente solo cuando hay una coincidencia exacta.
            // Evitamos autocompletar por coincidencia única para no sobrescribir mientras se escribe.
            const exactMatch = matches.find(item => normalizarBusqueda(item[field] || '') === term);
            if (exactMatch) {
                autofillFromEanData(field, exactMatch[field] || val);
            }

            renderForField(matches, field);
        }, 250);
    });

    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (ignoreCloseDropdown) {
                ignoreCloseDropdown = false;
                return;
            }
            closeAllDropdowns();
        }, 150);
    });

    input.addEventListener('focus', () => {
        const val = input.value.trim();
        if (val.length < 1) {
            dropdown.classList.add('d-none');
            return;
        }
        const matches = getMatches(normalizarBusqueda(val));
        renderForField(matches, field);
    });
}

// cerrar dropdowns cuando clic en otro lado
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-suggestions') && !e.target.closest('#descripcion') && !e.target.closest('#codigo') && !e.target.closest('#ean')) {
        closeAllDropdowns();
    }
});

// ====================

document.addEventListener('DOMContentLoaded', async () => {
    // === CARGAR DATOS EAN E INVENTARIO AL INICIAR ===
    await cargarDatosEAN();

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

    // === Configurar autocompletado en los tres campos ===
    setupAutocomplete('descripcion', 'descDropdown', 'descripcion');
    setupAutocomplete('codigo', 'codigoDropdown', 'codigo');
    setupAutocomplete('ean', 'eanDropdown', 'ean');


    // Autocompletar automáticamente el resto de los campos al salir del campo actual
    const descInput = document.getElementById('descripcion');
    if (descInput) {
        descInput.addEventListener('blur', () => autofillFromEanData('descripcion', descInput.value, true));
        descInput.addEventListener('change', () => autofillFromEanData('descripcion', descInput.value, true));
        descInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                e.stopPropagation();
                autofillFromEanData('descripcion', descInput.value, true);
                const fechaInput = document.getElementById('fecha');
                if (fechaInput) {
                    fechaInput.focus();
                    fechaInput.select();
                }
            }
        });
    }
    const codigoInput = document.getElementById('codigo');
    if (codigoInput) {
        codigoInput.addEventListener('blur', () => autofillFromEanData('codigo', codigoInput.value, true));
        codigoInput.addEventListener('change', () => autofillFromEanData('codigo', codigoInput.value, true));
        codigoInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                e.stopPropagation();
                autofillFromEanData('codigo', codigoInput.value, true);
                const fechaInput = document.getElementById('fecha');
                if (fechaInput) {
                    fechaInput.focus();
                    fechaInput.select();
                }
            }
        });
        // Limpiar automáticamente el formulario al volver a ingresar un código
        codigoInput.addEventListener('focus', () => {
            const descInput = document.getElementById('descripcion');
            const eanInput = document.getElementById('ean');
            const fechaInput = document.getElementById('fecha');
            if (descInput) descInput.value = '';
            if (eanInput) eanInput.value = '';
            if (fechaInput) fechaInput.value = '';
        });
    }
    const eanInput = document.getElementById('ean');
    if (eanInput) {
        eanInput.addEventListener('blur', () => autofillFromEanData('ean', eanInput.value, true));
        eanInput.addEventListener('change', () => autofillFromEanData('ean', eanInput.value, true));
        eanInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                e.stopPropagation();
                autofillFromEanData('ean', eanInput.value, true);
                const fechaInput = document.getElementById('fecha');
                if (fechaInput) {
                    fechaInput.focus();
                    fechaInput.select();
                }
            }
        });
    }

    // Limitar a números en celdas de EAN/Código
    ['codigo', 'ean'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => {
            el.value = el.value.replace(/[^0-9]/g, '');
        });
    });

    // === Botones de Acción ===

    // Botón Agregar
    const btnAgregar = document.getElementById('btnAgregar');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', async (e) => {
            e.preventDefault();
            await agregarProducto();
            // luego de agregar, volver a código para ingresar otro
            const codigoInput = document.getElementById('codigo');
            if (codigoInput) {
                codigoInput.focus();
                codigoInput.select();
            }
        });
    }

    // Presionar Enter en campo fecha ejecuta agregar
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                await agregarProducto();
                const codigoInput = document.getElementById('codigo');
                if (codigoInput) {
                    codigoInput.focus();
                    codigoInput.select();
                }
            }
        });
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
            const response = await fetch('/guardar_lista', { method: 'POST', credentials: 'include' });
            if (!response.ok) {
                let msg = `Error ${response.status}`;
                try {
                    const json = await response.json();
                    msg = json.detail || json.message || msg;
                } catch {
                    const text = await response.text();
                    if (text) msg = text;
                }
                mostrarMensajeForm('Error al guardar lista: ' + msg, 'danger');
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