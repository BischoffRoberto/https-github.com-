// === Mensaje Admin ===
function mostrarMensaje(texto, tipo = "info", targetEl = null) {
    const div = targetEl || document.getElementById("mensajeAdmin");
    if (!div) return;
    div.textContent = texto;
    div.className = `alert alert-${tipo}`;
    div.classList.remove("d-none");
    setTimeout(() => div.classList.add("d-none"), 3000);
}

function mostrarMensajeAccion(texto, tipo = "info", buttonEl) {
    const container = buttonEl?.closest('td');
    if (!container) return;

    let msgEl = container.querySelector('.admin-action-msg');
    if (!msgEl) {
        msgEl = document.createElement('div');
        msgEl.className = 'admin-action-msg mt-1';
        container.appendChild(msgEl);
    }

    mostrarMensaje(texto, tipo, msgEl);
}

// === Modal de bloqueo/desbloqueo ===
let _blockModalCurrentUser = null;
let _blockModalCurrentButton = null;

function openBlockModal(nombre, isBlocked, buttonEl) {
    _blockModalCurrentUser = nombre;
    _blockModalCurrentButton = buttonEl;

    const modal = document.getElementById('blockModal');
    const msg = document.getElementById('blockModalMessage');
    const blockBtn = document.getElementById('blockModalBlockBtn');
    const unblockBtn = document.getElementById('blockModalUnblockBtn');
    if (!modal || !msg || !blockBtn || !unblockBtn) return;

    if (isBlocked) {
        msg.textContent = `El usuario "${nombre}" está bloqueado. ¿Deseas desbloquearlo?`;
        blockBtn.style.display = 'none';
        unblockBtn.style.display = 'inline-block';
    } else {
        msg.textContent = `¿Deseas bloquear al usuario "${nombre}"?`;
        blockBtn.style.display = 'inline-block';
        unblockBtn.style.display = 'none';
    }

    blockBtn.onclick = () => {
        bloquearUsuario(nombre, buttonEl);
        closeBlockModal();
    };
    unblockBtn.onclick = () => {
        desbloquearUsuario(nombre, buttonEl);
        closeBlockModal();
    };

    modal.classList.add('show');
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = 'blockModalBackdrop';
    document.body.appendChild(backdrop);
}

function closeBlockModal() {
    const modal = document.getElementById('blockModal');
    if (modal) modal.classList.remove('show');
    const backdrop = document.getElementById('blockModalBackdrop');
    if (backdrop) backdrop.remove();
}

// === Toggle Password Visibility ===
function togglePassword(id) {
    const input = document.getElementById(id);
    if (input) {
        input.type = input.type === "password" ? "text" : "password";
    }
}

// === Agregar Usuario ===
function agregarUsuario() {
    const usuario = document.getElementById("nuevoUsuario").value.trim();
    const nombre = document.getElementById("nuevoNombre").value.trim();
    const correo = document.getElementById("nuevoCorreo").value.trim();
    const tlf = document.getElementById("nuevoTlf").value.trim();
    const legajo = document.getElementById("nuevoLegajo").value.trim();
    const contrasena = document.getElementById("nuevaClave").value.trim();
    const rol = document.getElementById("nuevoRol").value;

    if (!usuario || !contrasena) {
        mostrarMensaje("Completa usuario y contraseña", "warning");
        return;
    }

    fetch("/admin/agregar_usuario", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasena, rol, nombre, correo, tlf, legajo })
    })
    .then(res => res.json())
    .then(data => {
        mostrarMensaje(data.mensaje || "Usuario agregado", "success");
        document.getElementById("nuevoUsuario").value = "";
        document.getElementById("nuevoNombre").value = "";
        document.getElementById("nuevoCorreo").value = "";
        document.getElementById("nuevoTlf").value = "";
        document.getElementById("nuevoLegajo").value = "";
        document.getElementById("nuevaClave").value = "";
        setTimeout(() => location.reload(), 500);
    })
    .catch(err => {
        console.error(err);
        mostrarMensaje("Error al agregar usuario", "danger");
    });
}

    // === Subir Archivo ===
function subirArchivo() {
    const input = document.getElementById("archivoBase");
    if (!input || !input.files || input.files.length === 0) {
        mostrarMensaje("Selecciona un archivo primero", "warning");
        return;
    }

    const file = input.files[0];
    const form = new FormData();
    form.append("file", file);

    fetch("/admin/upload_archivo", {
        method: "POST",
        credentials: 'include',
        body: form
    })
    .then(res => res.json())
    .then(data => {
        mostrarMensaje(data.mensaje || "Archivo procesado", data.parsed && data.parsed.length > 0 ? "success" : "warning");
        
        if (data.parsed && Array.isArray(data.parsed) && data.parsed.length > 0) {
            // Mostrar preview
            const tbody = document.querySelector("#tablaInventario tbody");
            if (tbody) {
                tbody.innerHTML = "";
                data.parsed.forEach(row => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td>${row.codigo || ""}</td><td>${row.descripcion || ""}</td><td>${row.stock || ""}</td>`;
                    tbody.appendChild(tr);
                });
            }
            // Ocultar preview después de 2 segundos
            setTimeout(() => {
                const container = document.getElementById("previewContainer");
                if (container) container.style.display = "none";
                const btn = document.getElementById("btnTogglePreview");
                if (btn) btn.textContent = "Mostrar";
            }, 2000);
        } else {
            // Limpiar preview si no hay datos
            const tbody = document.querySelector("#tablaInventario tbody");
            if (tbody) tbody.innerHTML = "";
        }
        input.value = "";
        // Recargar lista de archivos subidos
        listarArchivos();
    })
    .catch(err => {
        console.error(err);
        mostrarMensaje("Error al subir archivo", "danger");
    });
}

// === Toggle Preview (mostrar/ocultar preview del inventario) ===
function togglePreview() {
    const container = document.getElementById("previewContainer");
    const btn = document.getElementById("btnTogglePreview");
    if (!container || !btn) return;
    
    if (container.style.display === "none") {
        container.style.display = "";
        btn.textContent = "Ocultar";
    } else {
        container.style.display = "none";
        btn.textContent = "Mostrar";
    }
}

// === Toggle Preview EAN ===
function togglePreviewEAN() {
    const container = document.getElementById("previewContainerEAN");
    const btn = document.getElementById("btnTogglePreviewEAN");
    if (!container || !btn) return;
    
    if (container.style.display === "none") {
        container.style.display = "";
        btn.textContent = "Ocultar";
    } else {
        container.style.display = "none";
        btn.textContent = "Mostrar";
    }
}

    // === Subir EAN base ===
    function subirArchivoEAN() {
        const input = document.getElementById("archivoEAN");
        if (!input || !input.files || input.files.length === 0) {
            mostrarMensaje("Selecciona un archivo primero", "warning");
            return;
        }
        const file = input.files[0];
        const form = new FormData();
        form.append("file", file);

        fetch("/admin/upload_ean", {
            method: "POST",
            credentials: 'include',
            body: form
        })
        .then(res => res.json())
        .then(data => {
            mostrarMensaje(data.mensaje || "Archivo procesado", data.parsed && data.parsed.length > 0 ? "success" : "warning");
            
            if (data.parsed && Array.isArray(data.parsed) && data.parsed.length > 0) {
                const tbody = document.querySelector("#tablaEAN tbody");
                if (tbody) {
                    tbody.innerHTML = "";
                    data.parsed.forEach(row => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `<td>${row.ean || ""}</td><td>${row.codigo || ""}</td><td>${row.descripcion || ""}</td>`;
                        tbody.appendChild(tr);
                    });
                }
                // Recargar datos de EAN después de subir
                cargarDatosEANEnAdmin();
                // Ocultar preview después de 2 segundos
                setTimeout(() => {
                    const container = document.getElementById("previewContainerEAN");
                    if (container) container.style.display = "none";
                    const btn = document.getElementById("btnTogglePreviewEAN");
                    if (btn) btn.textContent = "Mostrar";
                }, 2000);
            } else {
                const tbody = document.querySelector("#tablaEAN tbody");
                if (tbody) tbody.innerHTML = "";
            }
            input.value = "";
        })
        .catch(err => {
            console.error(err);
            mostrarMensaje("Error al subir archivo EAN", "danger");
        });
    }

    // === Usar archivo como Inventario activo ===
    function usarArchivo(uploader, filename) {
        // preguntar primero si desea usar el inventario (sin borrar nada)
        if (!confirm(`¿Usar el archivo ${filename} de ${uploader} como Inventario activo?`)) {
            return;
        }
        // el usuario quiere usarlo; ahora preguntar si borrar las listas existentes
        const clearLists = confirm("¿Borrar también las listas de todos los usuarios? Pulsa Aceptar = borrar, Cancelar = conservar");
        fetch(`/admin/usar_archivo?user=${encodeURIComponent(uploader)}&filename=${encodeURIComponent(filename)}&clear=${clearLists}`, {
            method: 'POST',
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            mostrarMensaje(data.mensaje || 'Inventario aplicado', 'success');
            const tbody = document.querySelector('#tablaInventario tbody');
            if (data.parsed && Array.isArray(data.parsed) && tbody) {
                tbody.innerHTML = '';
                data.parsed.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${row.codigo || ''}</td><td>${row.descripcion || ''}</td><td>${row.stock || ''}</td>`;
                    tbody.appendChild(tr);
                });
            }
        })
        .catch(err => mostrarMensaje('Error aplicando archivo', 'danger'));
    }

    // === Listar archivos subidos (lista para administrador) ===
    function listarArchivos() {
        fetch("/admin/listar_archivos", { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                const tbody = document.querySelector("#tablaArchivos");
                if (!tbody) return;
                tbody.innerHTML = "";
                (data.archivos || []).forEach(a => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${a.uploader}</td>
                        <td>${a.filename}</td>
                        <td>${a.fecha}</td>
                        <td>${a.hora}</td>
                        <td>${a.size}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="descargarArchivo('${a.uploader}', '${a.filename}')">⬇️</button>
                            <button class="btn btn-sm btn-outline-success ms-1" onclick="usarArchivo('${a.uploader}', '${a.filename}')">✅ Usar</button>
                            <button class="btn btn-sm btn-outline-danger ms-1" onclick="borrarArchivo('${a.uploader}', '${a.filename}')">🗑️</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            })
            .catch(err => {
                console.error(err);
            });
    }

function descargarArchivo(user, filename) {
    const url = `/admin/descargar_archivo?user=${encodeURIComponent(user)}&filename=${encodeURIComponent(filename)}`;
    window.location = url;
}

function descargarTodos() {
    window.location = "/admin/descargar_todos";
}

function descargarListaUnificada() {
    window.location = "/admin/descargar_lista_unificada";
}

function borrarArchivo(user, filename) {
    if (!confirm(`¿Estás seguro de que quieres borrar el archivo "${filename}"?`)) return;
    
    fetch(`/admin/borrar_archivo?user=${encodeURIComponent(user)}&filename=${encodeURIComponent(filename)}`, {
        method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
        mostrarMensaje(data.mensaje || "Archivo borrado", "success");
        listarArchivos(); // refrescar lista
    })
    .catch(err => {
        console.error(err);
        mostrarMensaje("Error al borrar archivo", "danger");
    });
}

// === Ver y descargar listas individuales ===
function verListaUsuario(usuario) {
    fetch(`/admin/obtener_lista_usuario?user=${encodeURIComponent(usuario)}`)
        .then(res => res.json())
        .then(data => {
            const modal = document.getElementById('userListModal');
            const body = document.getElementById('userListBody');
            if (body) {
                body.innerHTML = '';
                (data.lista || []).forEach(p => {
                    const row = `<tr><td>${p.Codigo || ''}</td><td>${p.Descripcion || ''}</td><td>${p.FechaVencimiento || ''}</td><td>${p.Stock || ''}</td></tr>`;
                    body.insertAdjacentHTML('beforeend', row);
                });
            }
            if (modal) new bootstrap.Modal(modal).show();
        })
        .catch(err => console.error(err));
}

function descargarListaUsuario(usuario) {
    window.location = `/admin/descargar_lista_usuario?user=${encodeURIComponent(usuario)}`;
}

// === Cargar Lista desde EAN ===
async function cargarListaDesdeEAN(usuario) {
    if (!confirm(`¿Cargar productos desde EAN.xlsx para ${usuario}? Esto reemplazará su lista actual.`)) return;
    
    try {
        const response = await fetch(`/admin/cargar_lista_ean?usuario=${encodeURIComponent(usuario)}&clear=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensaje(data.mensaje || `Lista de ${usuario} cargada desde EAN`, "success");
            setTimeout(() => location.reload(), 1000);
        } else {
            mostrarMensaje(data.detail || "Error al cargar lista", "danger");
        }
    } catch (err) {
        console.error(err);
        mostrarMensaje("Error de conexión al cargar lista desde EAN", "danger");
    }
}

async function cargarListaDesdeBase(usuario) {
    if (!confirm(`¿Cargar productos desde Inventario.xlsx para ${usuario}? Esto reemplazará su lista actual.`)) return;
    
    try {
        const response = await fetch(`/admin/usar_archivo?usuario=${encodeURIComponent(usuario)}&clear=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensaje(data.mensaje || `Lista de ${usuario} cargada desde Inventario`, "success");
            setTimeout(() => location.reload(), 1000);
        } else {
            mostrarMensaje(data.detail || "Error al cargar lista", "danger");
        }
    } catch (err) {
        console.error(err);
        mostrarMensaje("Error de conexión al cargar lista desde Inventario", "danger");
    }
}

// === Bloquear Usuario ===
function bloquearUsuario(nombre, buttonEl) {
    fetch("/admin/bloquear_usuario", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: nombre })
    })
    .then(res => res.json())
    .then(data => {
        mostrarMensajeAccion(data.mensaje || "Usuario bloqueado", "warning", buttonEl);
        setTimeout(() => location.reload(), 500);
    })
    .catch(err => {
        console.error(err);
        mostrarMensajeAccion("Error al bloquear usuario", "danger", buttonEl);
    });
}

// === Desbloquear Usuario ===
function desbloquearUsuario(nombre, buttonEl) {
    fetch("/admin/desbloquear_usuario", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: nombre })
    })
    .then(res => res.json())
    .then(data => {
        mostrarMensajeAccion(data.mensaje || "Usuario desbloqueado", "success", buttonEl);
        setTimeout(() => location.reload(), 500);
    })
    .catch(err => {
        console.error(err);
        mostrarMensajeAccion("Error al desbloquear usuario", "danger", buttonEl);
    });
}

// === Bloquear IP ===
function bloquearIP(nombre, buttonEl) {
    fetch("/admin/bloquear_ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: nombre })
    })
    .then(res => res.json())
    .then(data => {
        mostrarMensajeAccion(data.mensaje || "IP bloqueada", "warning", buttonEl);
        setTimeout(() => location.reload(), 500);
    })
    .catch(err => {
        console.error(err);
        mostrarMensajeAccion("Error al bloquear IP", "danger", buttonEl);
    });
}

// === Desbloquear IP ===
function desbloquearIP(nombre, buttonEl) {
    fetch("/admin/desbloquear_ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: nombre })
    })
    .then(res => res.json())
    .then(data => {
        mostrarMensajeAccion(data.mensaje || "IP desbloqueada", "success", buttonEl);
        setTimeout(() => location.reload(), 500);
    })
    .catch(err => {
        console.error(err);
        mostrarMensajeAccion("Error al desbloquear IP", "danger", buttonEl);
    });
}
function borrarUsuario(nombre, buttonEl) {
    if (nombre === "admin") {
        mostrarMensajeAccion("No se puede borrar el admin", "warning", buttonEl);
        return;
    }
    if (!confirm(`¿Borrar a ${nombre}? Esta acción es irreversible.`)) return;
    
    fetch("/admin/borrar_usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: nombre })
    })
    .then(res => res.json())
    .then(data => {
        mostrarMensajeAccion(data.mensaje || "Usuario borrado", "success", buttonEl);
        setTimeout(() => location.reload(), 500);
    })
    .catch(err => {
        console.error(err);
        mostrarMensajeAccion("Error al borrar usuario", "danger", buttonEl);
    });
}

// === Modal User Edit ===
function openUserModal(nombre) {
    const row = document.getElementById(`fila_${nombre}`);
    if (!row) return;
    
    document.getElementById("modalUsuario").value = nombre;
    document.getElementById("modalNombre").value = row.children[1]?.textContent?.trim() || "";
    document.getElementById("modalCorreo").value = row.children[2]?.textContent?.trim() || "";
    document.getElementById("modalTlf").value = row.children[3]?.textContent?.trim() || "";
    document.getElementById("modalLegajo").value = row.children[4]?.textContent?.trim() || "";
    // cargar ips desde la tabla (columna 7)
    document.getElementById("modalIps").value = row.children[7]?.textContent?.trim() || "";
    document.getElementById("modalRol").value = row.children[5]?.textContent?.trim() || "usuario";
    document.getElementById("modalPass").value = "";
    
    document.getElementById("userModal").style.display = "block";
}

function closeUserModal() {
    document.getElementById("userModal").style.display = "none";
}

function submitUserModal() {
    const usuario = document.getElementById("modalUsuario").value;
    const nombre = document.getElementById("modalNombre").value;
    const correo = document.getElementById("modalCorreo").value;
    const tlf = document.getElementById("modalTlf").value;
    const legajo = document.getElementById("modalLegajo").value;
    const rol = document.getElementById("modalRol").value;
    const pass = document.getElementById("modalPass").value;

    const payload = { usuario };
    if (nombre) payload.nombre = nombre;
    if (correo) payload.correo = correo;
    if (tlf) payload.tlf = tlf;
    if (legajo) payload.legajo = legajo;
    if (rol) payload.rol = rol;
    if (pass) payload.contrasena = pass;

    fetch("/admin/modificar_usuario", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        mostrarMensaje(data.mensaje || "Usuario modificado", "success");
        closeUserModal();
        setTimeout(() => location.reload(), 500);
    })
    .catch(err => {
        console.error(err);
        mostrarMensaje("Error al modificar usuario", "danger");
    });
}


// === Cargar datos EAN en la tabla de preview ===
async function cargarDatosEANEnAdmin() {
    try {
        const res = await fetch('/admin/obtener_ean');
        if (!res.ok) {
            console.log('[cargarDatosEANEnAdmin] No se pudieron cargar datos EAN');
            return;
        }
        const data = await res.json();
        const eanItems = data.ean_items || [];
        console.log(`[cargarDatosEANEnAdmin] Cargados ${eanItems.length} items de EAN`);
        
        const tbody = document.querySelector("#tablaEAN tbody");
        if (!tbody) return;
        
        tbody.innerHTML = "";
        eanItems.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${row.ean || ""}</td><td>${row.codigo || ""}</td><td>${row.descripcion || ""}</td>`;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('[cargarDatosEANEnAdmin] Error:', err);
    }
}

// === Init on page load ===
document.addEventListener("DOMContentLoaded", function() {
    try {
        listarArchivos();
        cargarDatosEANEnAdmin();
    } catch (e) {
        console.error("Error cargando", e);
    }
    // filtro inventario
    const filterInv = document.getElementById('filterInv');
    if (filterInv) {
        filterInv.addEventListener('input', () => {
            const term = filterInv.value.trim().toLowerCase();
            const tbody = document.querySelector('#tablaInventario tbody');
            if (!tbody) return;
            Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
                const desc = tr.cells[1]?.textContent.toLowerCase() || '';
                tr.style.display = desc.includes(term) ? '' : 'none';
            });
        });
    }
    // filtro EAN
    const filterEAN = document.getElementById('filterEAN');
    if (filterEAN) {
        filterEAN.addEventListener('input', () => {
            const term = filterEAN.value.trim().toLowerCase();
            const tbody = document.querySelector('#tablaEAN tbody');
            if (!tbody) return;
            Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
                const ean = tr.cells[0]?.textContent.toLowerCase() || '';
                const cod = tr.cells[1]?.textContent.toLowerCase() || '';
                tr.style.display = (ean.includes(term) || cod.includes(term)) ? '' : 'none';
            });
        });
    }
    // toggle modal password visibility
    const toggleModalPass = document.getElementById('toggleModalPass');
    const modalPass = document.getElementById('modalPass');
    if (toggleModalPass && modalPass) {
        toggleModalPass.addEventListener('click', () => {
            modalPass.type = modalPass.type === 'password' ? 'text' : 'password';
        });
    }
    
    // === Cargar tablas EditablesInventario y EAN ===
    cargarTablaInventario();
    cargarTablaEAN();

    // Forzar teclado numérico y bloquear letras en campos EAN/Código dentro del modal
    const numericFields = ['editItemEan', 'editItemCodigo', 'nuevoEAN', 'nuevoCodigoEAN', 'nuevoCodigoInv'];
    numericFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                el.value = el.value.replace(/[^0-9]/g, '');
            });
        }
    });
});

// === Modal de edición (Inventario / EAN) ===
function openEditItemModal(type, key, data = {}) {
    const modalEl = document.getElementById('editItemModal');
    if (!modalEl) return;

    const modal = new bootstrap.Modal(modalEl);
    const typeInput = document.getElementById('editItemType');
    const keyInput = document.getElementById('editItemKey');
    const eanRow = document.getElementById('editItemEanRow');
    const stockRow = document.getElementById('editItemStockRow');
    const eanInput = document.getElementById('editItemEan');
    const codigoInput = document.getElementById('editItemCodigo');
    const descInput = document.getElementById('editItemDescripcion');
    const stockInput = document.getElementById('editItemStock');

    if (!typeInput || !keyInput || !eanRow || !stockRow || !codigoInput || !descInput) return;

    typeInput.value = type;
    keyInput.value = key;

    // Mostrar/ocultar campos según tipo
    if (type === 'ean') {
        eanRow.style.display = '';
        stockRow.style.display = 'none';
        if (eanInput) eanInput.value = data.ean || key || '';
    } else {
        eanRow.style.display = 'none';
        stockRow.style.display = '';
        if (stockInput) stockInput.value = data.stock ?? '';
    }

    codigoInput.value = data.codigo || key || '';
    descInput.value = data.descripcion || '';

    modal.show();
}

async function submitEditItemModal() {
    const type = document.getElementById('editItemType')?.value;
    const key = document.getElementById('editItemKey')?.value;
    const ean = document.getElementById('editItemEan')?.value.trim();
    const codigo = document.getElementById('editItemCodigo')?.value.trim();
    const descripcion = document.getElementById('editItemDescripcion')?.value.trim();
    const stock = document.getElementById('editItemStock')?.value.trim();

    if (!type || !key) return;

    try {
        if (type === 'inventario') {
            const params = new URLSearchParams();
            params.set('accion', 'editar');
            params.set('codigo', key);
            if (codigo) params.set('codigo_nuevo', codigo);
            if (descripcion) params.set('descripcion', descripcion);
            if (stock) params.set('stock', stock);

            const res = await fetch('/admin/actualizar_inventario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });
            const data = await res.json();
            if (data.error) {
                mostrarMensaje(`❌ ${data.error}`, 'danger');
            } else {
                mostrarMensaje(data.mensaje || '✅ Producto actualizado', 'success');
                cargarTablaInventario();
            }
        } else if (type === 'ean') {
            const params = new URLSearchParams();
            params.set('accion', 'editar');
            params.set('ean', key);
            if (ean) params.set('nuevo_ean', ean);
            if (codigo) params.set('codigo', codigo);
            if (descripcion) params.set('descripcion', descripcion);

            const res = await fetch('/admin/actualizar_ean', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });
            const data = await res.json();
            if (data.error) {
                mostrarMensaje(`❌ ${data.error}`, 'danger');
            } else {
                mostrarMensaje(data.mensaje || '✅ EAN actualizado', 'success');
                cargarTablaEAN();
            }
        }
    } catch (err) {
        console.error(err);
        mostrarMensaje('Error al guardar cambios', 'danger');
    }
}

// ========== FUNCIONES PARA GESTIÓN DE INVENTARIO ==========

async function cargarTablaInventario() {
    try {
        const res = await fetch('/admin/obtener_inventario');
        if (!res.ok) throw new Error('No se pudo cargar Inventario');

        const data = await res.json();
        const invItems = data.inventario_items || [];

        const tbody = document.getElementById('tablaInventarioBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        invItems.forEach(row => {
            const tr = document.createElement('tr');
            const tdCodigo = document.createElement('td');
            tdCodigo.textContent = row.codigo || '';
            const tdDesc = document.createElement('td');
            tdDesc.textContent = row.descripcion || '';
            const tdStock = document.createElement('td');
            tdStock.textContent = row.stock || '-';

            const tdActions = document.createElement('td');
            const btnEdit = document.createElement('button');
            btnEdit.className = 'btn btn-sm btn-warning';
            btnEdit.textContent = '✏️';
            btnEdit.addEventListener('click', () => openEditItemModal('inventario', row.codigo || '', row));

            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn btn-sm btn-danger ms-1';
            btnDelete.textContent = '🗑️';
            btnDelete.addEventListener('click', () => eliminarProductoInventario(row.codigo || ''));

            tdActions.appendChild(btnEdit);
            tdActions.appendChild(btnDelete);

            tr.appendChild(tdCodigo);
            tr.appendChild(tdDesc);
            tr.appendChild(tdStock);
            tr.appendChild(tdActions);

            tbody.appendChild(tr);
        });

        console.log(`[cargarTablaInventario] Cargados ${invItems.length} items`);
    } catch (err) {
        console.error('[cargarTablaInventario] Error:', err);
    }
}

async function cargarTablaEAN() {
    try {
        const res = await fetch('/admin/obtener_ean');
        if (!res.ok) throw new Error('No se pudo cargar EAN');

        const data = await res.json();
        const eanItems = data.ean_items || [];

        const tbody = document.getElementById('tablaEANBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        eanItems.forEach(row => {
            const tr = document.createElement('tr');
            const tdEan = document.createElement('td');
            tdEan.textContent = row.ean || '';
            const tdCodigo = document.createElement('td');
            tdCodigo.textContent = row.codigo || '';
            const tdDesc = document.createElement('td');
            tdDesc.textContent = row.descripcion || '';

            const tdActions = document.createElement('td');
            const btnEdit = document.createElement('button');
            btnEdit.className = 'btn btn-sm btn-warning';
            btnEdit.textContent = '✏️';
            btnEdit.addEventListener('click', () => openEditItemModal('ean', row.ean || '', row));

            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn btn-sm btn-danger ms-1';
            btnDelete.textContent = '🗑️';
            btnDelete.addEventListener('click', () => eliminarProductoEAN(row.ean || ''));

            tdActions.appendChild(btnEdit);
            tdActions.appendChild(btnDelete);

            tr.appendChild(tdEan);
            tr.appendChild(tdCodigo);
            tr.appendChild(tdDesc);
            tr.appendChild(tdActions);

            tbody.appendChild(tr);
        });

        console.log(`[cargarTablaEAN] Cargados ${eanItems.length} items`);
    } catch (err) {
        console.error('[cargarTablaEAN] Error:', err);
    }
}

// === INVENTARIO: Agregar producto ===
async function agregarProductoInventario() {
    const codigo = document.getElementById('nuevoCodigoInv').value.trim();
    const descripcion = document.getElementById('nuevoDescInv').value.trim();
    const stock = document.getElementById('nuevoStockInv').value.trim();
    
    if (!codigo || !descripcion) {
        mostrarMensaje('Completa código y descripción', 'warning');
        return;
    }
    
    try {
        const res = await fetch('/admin/actualizar_inventario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `accion=agregar&codigo=${encodeURIComponent(codigo)}&descripcion=${encodeURIComponent(descripcion)}&stock=${encodeURIComponent(stock || 0)}`
        });
        
        const data = await res.json();
        
        if (data.error) {
            mostrarMensaje(`❌ ${data.error}`, 'danger');
        } else {
            mostrarMensaje(data.mensaje || '✅ Producto agregado', 'success');
            document.getElementById('nuevoCodigoInv').value = '';
            document.getElementById('nuevoDescInv').value = '';
            document.getElementById('nuevoStockInv').value = '';
            
            // Recargar tabla
            recargarTablaInventario(data.data || []);
        }
    } catch (err) {
        console.error(err);
        mostrarMensaje('Error al agregar producto', 'danger');
    }
}

// === INVENTARIO: Editar producto ===
async function editarProductoInventario(codigo) {
    const nuevaDesc = prompt('Nueva descripción:');
    if (!nuevaDesc) return;
    
    const nuevoStock = prompt('Nuevo stock (dejar en blanco para no cambiar):');
    
    try {
        const res = await fetch('/admin/actualizar_inventario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `accion=editar&codigo=${encodeURIComponent(codigo)}&descripcion=${encodeURIComponent(nuevaDesc)}&stock=${encodeURIComponent(nuevoStock || '')}`
        });
        
        const data = await res.json();
        
        if (data.error) {
            mostrarMensaje(`❌ ${data.error}`, 'danger');
        } else {
            mostrarMensaje(data.mensaje || '✅ Producto actualizado', 'success');
            recargarTablaInventario(data.data || []);
        }
    } catch (err) {
        console.error(err);
        mostrarMensaje('Error al editar producto', 'danger');
    }
}

// === INVENTARIO: Eliminar producto ===
async function eliminarProductoInventario(codigo) {
    if (!confirm(`¿Eliminar producto ${codigo}?`)) return;
    
    try {
        const res = await fetch('/admin/actualizar_inventario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `accion=eliminar&codigo=${encodeURIComponent(codigo)}`
        });
        
        const data = await res.json();
        
        if (data.error) {
            mostrarMensaje(`❌ ${data.error}`, 'danger');
        } else {
            mostrarMensaje(data.mensaje || '✅ Producto eliminado', 'success');
            recargarTablaInventario(data.data || []);
        }
    } catch (err) {
        console.error(err);
        mostrarMensaje('Error al eliminar producto', 'danger');
    }
}

function recargarTablaInventario(datos) {
    const tbody = document.getElementById('tablaInventarioBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    datos.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.codigo || ''}</td>
            <td>${row.descripcion || ''}</td>
            <td>${row.stock || '-'}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editarProductoInventario('${row.codigo}')">✏️</button>
                <button class="btn btn-sm btn-danger" onclick="eliminarProductoInventario('${row.codigo}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ========== FUNCIONES PARA GESTIÓN DE EAN ==========

// === EAN: Agregar producto ===
async function agregarProductoEAN() {
    const ean = document.getElementById('nuevoEAN').value.trim();
    const codigo = document.getElementById('nuevoCodigoEAN').value.trim();
    const descripcion = document.getElementById('nuevoDescEAN').value.trim();
    
    if (!ean || !codigo) {
        mostrarMensaje('Completa EAN y Código', 'warning');
        return;
    }
    
    try {
        const res = await fetch('/admin/actualizar_ean', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `accion=agregar&ean=${encodeURIComponent(ean)}&codigo=${encodeURIComponent(codigo)}&descripcion=${encodeURIComponent(descripcion)}`
        });
        
        const data = await res.json();
        
        if (data.error) {
            mostrarMensaje(`❌ ${data.error}`, 'danger');
        } else {
            mostrarMensaje(data.mensaje || '✅ EAN agregado', 'success');
            document.getElementById('nuevoEAN').value = '';
            document.getElementById('nuevoCodigoEAN').value = '';
            document.getElementById('nuevoDescEAN').value = '';
            
            // Recargar tabla
            recargarTablaEAN(data.data || []);
        }
    } catch (err) {
        console.error(err);
        mostrarMensaje('Error al agregar EAN', 'danger');
    }
}

// === EAN: Editar producto ===
async function editarProductoEAN(ean) {
    const nuevoCod = prompt('Nuevo código:');
    if (!nuevoCod) return;
    
    const nuevoDesc = prompt('Nueva descripción (opcional):') || '';
    
    try {
        const res = await fetch('/admin/actualizar_ean', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `accion=editar&ean=${encodeURIComponent(ean)}&codigo=${encodeURIComponent(nuevoCod)}&descripcion=${encodeURIComponent(nuevoDesc)}`
        });
        
        const data = await res.json();
        
        if (data.error) {
            mostrarMensaje(`❌ ${data.error}`, 'danger');
        } else {
            mostrarMensaje(data.mensaje || '✅ EAN actualizado', 'success');
            recargarTablaEAN(data.data || []);
        }
    } catch (err) {
        console.error(err);
        mostrarMensaje('Error al editar EAN', 'danger');
    }
}

// === EAN: Eliminar producto ===
async function eliminarProductoEAN(ean) {
    if (!confirm(`¿Eliminar EAN ${ean}?`)) return;
    
    try {
        const res = await fetch('/admin/actualizar_ean', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `accion=eliminar&ean=${encodeURIComponent(ean)}`
        });
        
        const data = await res.json();
        
        if (data.error) {
            mostrarMensaje(`❌ ${data.error}`, 'danger');
        } else {
            mostrarMensaje(data.mensaje || '✅ EAN eliminado', 'success');
            recargarTablaEAN(data.data || []);
        }
    } catch (err) {
        console.error(err);
        mostrarMensaje('Error al eliminar EAN', 'danger');
    }
}

function recargarTablaEAN(datos) {
    const tbody = document.getElementById('tablaEANBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    datos.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.ean || ''}</td>
            <td>${row.codigo || ''}</td>
            <td>${row.descripcion || ''}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editarProductoEAN('${row.ean}')">✏️</button>
                <button class="btn btn-sm btn-danger" onclick="eliminarProductoEAN('${row.ean}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
