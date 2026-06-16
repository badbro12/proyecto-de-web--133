/* ═══════════════════════════════════════════════
   InvestigaHub — app.js
   Conecta el frontend con el backend Flask en
   http://localhost:5000
════════════════════════════════════════════════ */

const API = 'http://localhost:5000';

/* ── ESTADO GLOBAL ──────────────────────────── */
let proyectosCache = [];      // Para filtro de búsqueda
let editProyectoId = null;    // null → crear; número → editar
let editParticipanteId = null;
let editActividadId = null;

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = 'login.html'; return; }

  // Mostrar datos del usuario en sidebar
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const nombreEl = document.getElementById('nombreUsuario');
  const rolEl    = document.getElementById('rolUsuario');
  const avatarEl = document.querySelector('.user-avatar');
  if (nombreEl) nombreEl.textContent = usuario.nombre || 'Usuario';
  if (rolEl)    rolEl.textContent    = usuario.rol    || '';
  if (avatarEl && usuario.nombre) avatarEl.textContent = usuario.nombre.charAt(0).toUpperCase();

  // Logout
  document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
  });

  // Sidebar toggle (mobile)
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Form proyecto
  document.getElementById('btnNuevoProyecto').addEventListener('click', () => {
    abrirFormProyecto();
  });
  document.getElementById('formProyecto').addEventListener('submit', guardarProyecto);

  // Form participante
  document.getElementById('btnNuevoParticipante').addEventListener('click', () => {
    abrirFormParticipante();
  });
  document.getElementById('formParticipante').addEventListener('submit', guardarParticipante);

  // Form actividad
  document.getElementById('btnNuevaActividad').addEventListener('click', () => {
    abrirFormActividad();
  });
  document.getElementById('formActividad').addEventListener('submit', guardarActividad);

  // Form usuario
  document.getElementById('formUsuario').addEventListener('submit', crearUsuario);

  // Conexión con el servidor
  checkConexion();

  // Cargar todo
  cargarDashboard();
  cargarProyectos();
  cargarParticipantes();
  cargarActividades();
});

/* ══════════════════════════════════════════════
   NAVEGACIÓN
══════════════════════════════════════════════ */
const SECTION_TITLES = {
  dashboard:    'Dashboard',
  proyectos:    'Proyectos',
  participantes:'Participantes',
  actividades:  'Actividades',
  usuarios:     'Usuarios',
  consultas:    'Consultas',
};

function showSection(name, el) {
  // Ocultar todas
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  // Mostrar la seleccionada
  const sec = document.getElementById('sec-' + name);
  if (sec) sec.classList.add('active');
  // Marcar nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  else {
    const navEl = document.querySelector(`.nav-item[data-section="${name}"]`);
    if (navEl) navEl.classList.add('active');
  }
  // Topbar title
  const tb = document.getElementById('topbarTitle');
  if (tb) tb.textContent = SECTION_TITLES[name] || name;
  // Cerrar sidebar en móvil
  document.getElementById('sidebar').classList.remove('open');
}

/* ══════════════════════════════════════════════
   UTILIDADES
══════════════════════════════════════════════ */
function getToken() {
  return localStorage.getItem('token') || '';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken(),
  };
}

function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + type;
  el.style.display = 'block';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.display = 'none'; }, 3200);
}

function confirmar(titulo, desc, callback) {
  const modal = document.getElementById('modal');
  document.getElementById('modalTitle').textContent = titulo;
  document.getElementById('modalDesc').textContent  = desc;
  modal.style.display = 'flex';
  const confirmBtn = document.getElementById('modalConfirm');
  const newBtn = confirmBtn.cloneNode(true); // clona para eliminar listeners anteriores
  confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
  newBtn.addEventListener('click', () => {
    cerrarModal();
    callback();
  });
}

function cerrarModal() {
  document.getElementById('modal').style.display = 'none';
}

function badgeEstado(estado) {
  const map = {
    'activo':      'badge-green',
    'en pausa':    'badge-yellow',
    'finalizado':  'badge-blue',
    'pendiente':   'badge-yellow',
    'en progreso': 'badge-blue',
    'completado':  'badge-green',
  };
  return `<span class="badge ${map[estado] || 'badge-gray'}">${estado}</span>`;
}

function progressBar(pct) {
  const p = Math.max(0, Math.min(100, parseInt(pct) || 0));
  return `
    <div class="progress-wrap">
      <div class="progress-bar"><div class="progress-fill" style="width:${p}%"></div></div>
      <span class="progress-pct">${p}%</span>
    </div>`;
}

async function checkConexion() {
  const dot = document.getElementById('connDot');
  try {
    const r = await fetch(API + '/api/health');
    if (r.ok) { dot.className = 'connection-dot ok'; dot.title = 'Servidor conectado'; }
    else       { dot.className = 'connection-dot err'; dot.title = 'Error en servidor'; }
  } catch {
    dot.className = 'connection-dot err';
    dot.title = 'Sin conexión al servidor';
  }
}

/* ══════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════ */
let chartInstance = null;

async function cargarDashboard() {
  try {
    const r = await fetch(API + '/api/dashboard');
    if (!r.ok) return;
    const d = await r.json();

    setText('totalProyectos',    d.total_proyectos    ?? '—');
    setText('proyectosActivos',  d.proyectos_activos  ?? '—');
    setText('totalParticipantes',d.total_participantes ?? '—');
    setText('totalActividades',  d.total_actividades  ?? '—');

    // Chart
    renderChart(d.proyectos_por_estado || {});
  } catch (err) {
    console.warn('Dashboard no disponible:', err);
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderChart(data) {
  const canvas = document.getElementById('chartEstados');
  if (!canvas) return;
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  const labels = Object.keys(data);
  const values = Object.values(data);
  const colors = ['rgba(16,185,129,.75)', 'rgba(245,158,11,.75)', 'rgba(59,130,246,.75)'];
  const borders = ['#10b981', '#f59e0b', '#3b82f6'];

  chartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: borders.slice(0, labels.length),
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16, font: { family: 'Inter', size: 12 } } },
      },
      cutout: '65%',
    }
  });
}

/* ══════════════════════════════════════════════
   PROYECTOS
══════════════════════════════════════════════ */
async function cargarProyectos() {
  try {
    const r = await fetch(API + '/api/proyectos');
    proyectosCache = r.ok ? await r.json() : [];
    renderTablaProyectos(proyectosCache);
    renderRecentProyectos(proyectosCache);
    poblarSelectProyectos();
  } catch (err) {
    console.error('Error cargando proyectos:', err);
  }
}

function renderTablaProyectos(lista) {
  const tbody  = document.getElementById('tablaProyectos');
  const empty  = document.getElementById('emptyProyectos');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  lista.forEach(p => {
    const fecha = p.fecha_inicio || '—';
    const responsable = p.investigador_responsable || '—';
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td><span style="font-size:.75rem;color:var(--muted)">#${p.id}</span></td>
        <td>
          <strong>${escHtml(p.nombre)}</strong>
          ${p.descripcion ? `<div style="font-size:.75rem;color:var(--muted);margin-top:2px">${escHtml(p.descripcion.substring(0,60))}${p.descripcion.length>60?'…':''}</div>` : ''}
        </td>
        <td>${badgeEstado(p.estado)}</td>
        <td style="font-size:.82rem;color:var(--muted)">${fecha}</td>
        <td style="font-size:.85rem">${escHtml(responsable)}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-warning btn-sm" onclick="abrirEdicionProyecto(${p.id})">✏️ Editar</button>
            <button class="btn btn-danger btn-sm"  onclick="pedirEliminarProyecto(${p.id}, '${escAttr(p.nombre)}')">🗑️</button>
          </div>
        </td>
      </tr>
    `);
  });
}

function renderRecentProyectos(lista) {
  const el = document.getElementById('recentProyectos');
  if (!el) return;
  const top = lista.slice(-5).reverse();
  if (top.length === 0) {
    el.innerHTML = '<div class="query-empty">No hay proyectos aún</div>';
    return;
  }
  el.innerHTML = top.map(p => `
    <div class="recent-item">
      <div>
        <div class="recent-name">${escHtml(p.nombre)}</div>
        <div class="recent-sub">${p.investigador_responsable || '—'}</div>
      </div>
      ${badgeEstado(p.estado)}
    </div>
  `).join('');
}

function filtrarProyectos() {
  const q = document.getElementById('searchProyecto').value.toLowerCase();
  const filtrados = proyectosCache.filter(p =>
    p.nombre.toLowerCase().includes(q) ||
    (p.investigador_responsable || '').toLowerCase().includes(q) ||
    (p.estado || '').toLowerCase().includes(q)
  );
  renderTablaProyectos(filtrados);
}

/* Form proyectos */
function abrirFormProyecto() {
  editProyectoId = null;
  document.getElementById('formProyecto').reset();
  document.getElementById('formPanelTitle').textContent   = 'Nuevo Proyecto';
  document.getElementById('btnGuardarProyecto').textContent = 'Crear Proyecto';
  document.getElementById('formPanel').style.display = 'block';
  document.getElementById('formPanel').scrollIntoView({ behavior: 'smooth' });
}

function abrirEdicionProyecto(id) {
  const p = proyectosCache.find(x => x.id === id);
  if (!p) return;
  editProyectoId = id;
  document.getElementById('nombreProyecto').value      = p.nombre || '';
  document.getElementById('estadoProyecto').value      = p.estado || 'activo';
  document.getElementById('fechaInicio').value         = p.fecha_inicio || '';
  document.getElementById('fechaFin').value            = p.fecha_fin || '';
  document.getElementById('responsableProyecto').value = p.investigador_responsable || '';
  document.getElementById('descripcionProyecto').value = p.descripcion || '';
  document.getElementById('formPanelTitle').textContent   = 'Editar Proyecto';
  document.getElementById('btnGuardarProyecto').textContent = 'Actualizar Proyecto';
  document.getElementById('formPanel').style.display = 'block';
  document.getElementById('formPanel').scrollIntoView({ behavior: 'smooth' });
}

function cerrarFormProyecto() {
  document.getElementById('formPanel').style.display = 'none';
  document.getElementById('formProyecto').reset();
  editProyectoId = null;
}

async function guardarProyecto(e) {
  e.preventDefault();
  const btn = document.getElementById('btnGuardarProyecto');
  btn.disabled = true;

  const data = {
    nombre:                   document.getElementById('nombreProyecto').value.trim(),
    estado:                   document.getElementById('estadoProyecto').value,
    fecha_inicio:             document.getElementById('fechaInicio').value,
    fecha_fin:                document.getElementById('fechaFin').value || null,
    investigador_responsable: document.getElementById('responsableProyecto').value.trim(),
    descripcion:              document.getElementById('descripcionProyecto').value.trim(),
  };
  if (!data.fecha_fin) delete data.fecha_fin;

  const url    = editProyectoId ? `${API}/api/proyectos/${editProyectoId}` : `${API}/api/proyectos`;
  const method = editProyectoId ? 'PUT' : 'POST';

  try {
    const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(data) });
    const res = await r.json();
    if (r.ok) {
      toast(editProyectoId ? '✅ Proyecto actualizado' : '✅ Proyecto creado');
      cerrarFormProyecto();
      await cargarProyectos();
      await cargarDashboard();
    } else {
      toast('❌ ' + (res.error || 'Error al guardar'), 'error');
    }
  } catch {
    toast('❌ Sin conexión con el servidor', 'error');
  } finally {
    btn.disabled = false;
  }
}

function pedirEliminarProyecto(id, nombre) {
  confirmar(
    '¿Eliminar proyecto?',
    `"${nombre}" y todos sus participantes y actividades serán eliminados.`,
    () => eliminarProyecto(id)
  );
}

async function eliminarProyecto(id) {
  try {
    const r = await fetch(`${API}/api/proyectos/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (r.ok) {
      toast('🗑️ Proyecto eliminado');
      await cargarProyectos();
      await cargarDashboard();
      await cargarParticipantes();
      await cargarActividades();
    } else {
      const res = await r.json();
      toast('❌ ' + (res.error || 'Error al eliminar'), 'error');
    }
  } catch {
    toast('❌ Sin conexión con el servidor', 'error');
  }
}

/* ══════════════════════════════════════════════
   PARTICIPANTES
══════════════════════════════════════════════ */
async function cargarParticipantes() {
  try {
    const r = await fetch(API + '/api/participantes');
    const lista = r.ok ? await r.json() : [];
    renderTablaParticipantes(lista);
  } catch (err) {
    console.error('Error cargando participantes:', err);
  }
}

function renderTablaParticipantes(lista) {
  const tbody = document.getElementById('tablaParticipantes');
  const empty = document.getElementById('emptyParticipantes');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  lista.forEach(p => {
    const proyecto = proyectosCache.find(x => x.id === p.proyecto_id);
    const nombreProy = proyecto ? proyecto.nombre : `Proyecto #${p.proyecto_id}`;
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td><strong>${escHtml(p.nombre)}</strong></td>
        <td style="font-size:.82rem;color:var(--muted)">${escHtml(p.email || '—')}</td>
        <td>${badgeEstado(p.rol || 'investigador')}</td>
        <td style="font-size:.82rem">${escHtml(p.institucion || '—')}</td>
        <td style="font-size:.8rem;color:var(--muted)">${escHtml(nombreProy)}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-warning btn-sm" onclick="abrirEdicionParticipante(${p.id})">✏️</button>
            <button class="btn btn-danger btn-sm"  onclick="pedirEliminarParticipante(${p.id}, '${escAttr(p.nombre)}')">🗑️</button>
          </div>
        </td>
      </tr>
    `);
  });
}

function poblarSelectProyectos() {
  ['pProyectoId', 'aProyectoId'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const actual = sel.value;
    sel.innerHTML = '<option value="">— Selecciona proyecto —</option>';
    proyectosCache.forEach(p => {
      sel.insertAdjacentHTML('beforeend',
        `<option value="${p.id}" ${p.id == actual ? 'selected' : ''}>${escHtml(p.nombre)}</option>`
      );
    });
  });
}

function abrirFormParticipante() {
  editParticipanteId = null;
  document.getElementById('formParticipante').reset();
  poblarSelectProyectos();
  document.getElementById('formPanelTitleP').textContent   = 'Nuevo Participante';
  document.getElementById('btnGuardarParticipante').textContent = 'Crear Participante';
  document.getElementById('formPanelParticipante').style.display = 'block';
  document.getElementById('formPanelParticipante').scrollIntoView({ behavior: 'smooth' });
}

async function abrirEdicionParticipante(id) {
  try {
    const r = await fetch(`${API}/api/participantes/${id}`);
    if (!r.ok) return;
    const p = await r.json();
    editParticipanteId = id;
    poblarSelectProyectos();
    document.getElementById('pNombre').value     = p.nombre || '';
    document.getElementById('pEmail').value      = p.email  || '';
    document.getElementById('pRol').value        = p.rol    || 'investigador';
    document.getElementById('pInstitucion').value= p.institucion || '';
    document.getElementById('pProyectoId').value = p.proyecto_id || '';
    document.getElementById('formPanelTitleP').textContent   = 'Editar Participante';
    document.getElementById('btnGuardarParticipante').textContent = 'Actualizar';
    document.getElementById('formPanelParticipante').style.display = 'block';
    document.getElementById('formPanelParticipante').scrollIntoView({ behavior: 'smooth' });
  } catch { toast('❌ Error al cargar participante', 'error'); }
}

function cerrarFormParticipante() {
  document.getElementById('formPanelParticipante').style.display = 'none';
  document.getElementById('formParticipante').reset();
  editParticipanteId = null;
}

async function guardarParticipante(e) {
  e.preventDefault();
  const btn = document.getElementById('btnGuardarParticipante');
  btn.disabled = true;

  const data = {
    nombre:     document.getElementById('pNombre').value.trim(),
    email:      document.getElementById('pEmail').value.trim(),
    rol:        document.getElementById('pRol').value,
    institucion:document.getElementById('pInstitucion').value.trim(),
    proyecto_id:parseInt(document.getElementById('pProyectoId').value),
  };

  const url    = editParticipanteId ? `${API}/api/participantes/${editParticipanteId}` : `${API}/api/participantes`;
  const method = editParticipanteId ? 'PUT' : 'POST';

  try {
    const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(data) });
    const res = await r.json();
    if (r.ok) {
      toast(editParticipanteId ? '✅ Participante actualizado' : '✅ Participante creado');
      cerrarFormParticipante();
      await cargarParticipantes();
      await cargarDashboard();
    } else {
      toast('❌ ' + (res.error || 'Error al guardar'), 'error');
    }
  } catch {
    toast('❌ Sin conexión con el servidor', 'error');
  } finally {
    btn.disabled = false;
  }
}

function pedirEliminarParticipante(id, nombre) {
  confirmar('¿Eliminar participante?', `"${nombre}" será eliminado del sistema.`, () => eliminarParticipante(id));
}

async function eliminarParticipante(id) {
  try {
    const r = await fetch(`${API}/api/participantes/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (r.ok) {
      toast('🗑️ Participante eliminado');
      await cargarParticipantes();
      await cargarDashboard();
    } else {
      const res = await r.json();
      toast('❌ ' + (res.error || 'Error'), 'error');
    }
  } catch { toast('❌ Sin conexión', 'error'); }
}

/* ══════════════════════════════════════════════
   ACTIVIDADES
══════════════════════════════════════════════ */
async function cargarActividades() {
  try {
    const r = await fetch(API + '/api/actividades');
    const lista = r.ok ? await r.json() : [];
    renderTablaActividades(lista);
  } catch (err) {
    console.error('Error cargando actividades:', err);
  }
}

function renderTablaActividades(lista) {
  const tbody = document.getElementById('tablaActividades');
  const empty = document.getElementById('emptyActividades');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  lista.forEach(a => {
    const proyecto = proyectosCache.find(x => x.id === a.proyecto_id);
    const nombreProy = proyecto ? proyecto.nombre : `#${a.proyecto_id}`;
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td style="max-width:220px">
          <div style="font-size:.85rem">${escHtml(a.descripcion.substring(0,80))}${a.descripcion.length>80?'…':''}</div>
        </td>
        <td style="font-size:.8rem;color:var(--muted)">${escHtml(nombreProy)}</td>
        <td style="font-size:.82rem;color:var(--muted)">${a.fecha_actividad || '—'}</td>
        <td>${badgeEstado(a.estado)}</td>
        <td style="min-width:120px">${progressBar(a.porcentaje_avance)}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-warning btn-sm" onclick="abrirEdicionActividad(${a.id})">✏️</button>
            <button class="btn btn-danger btn-sm"  onclick="pedirEliminarActividad(${a.id})">🗑️</button>
          </div>
        </td>
      </tr>
    `);
  });
}

function abrirFormActividad() {
  editActividadId = null;
  document.getElementById('formActividad').reset();
  poblarSelectProyectos();
  document.getElementById('formPanelTitleA').textContent  = 'Nueva Actividad';
  document.getElementById('btnGuardarActividad').textContent = 'Crear Actividad';
  document.getElementById('formPanelActividad').style.display = 'block';
  document.getElementById('formPanelActividad').scrollIntoView({ behavior: 'smooth' });
}

async function abrirEdicionActividad(id) {
  try {
    const r = await fetch(`${API}/api/actividades/${id}`);
    if (!r.ok) return;
    const a = await r.json();
    editActividadId = id;
    poblarSelectProyectos();
    document.getElementById('aProyectoId').value = a.proyecto_id || '';
    document.getElementById('aFecha').value       = a.fecha_actividad || '';
    document.getElementById('aEstado').value      = a.estado || 'pendiente';
    document.getElementById('aPorcentaje').value  = a.porcentaje_avance ?? 0;
    document.getElementById('aDescripcion').value = a.descripcion || '';
    document.getElementById('formPanelTitleA').textContent   = 'Editar Actividad';
    document.getElementById('btnGuardarActividad').textContent = 'Actualizar';
    document.getElementById('formPanelActividad').style.display = 'block';
    document.getElementById('formPanelActividad').scrollIntoView({ behavior: 'smooth' });
  } catch { toast('❌ Error al cargar actividad', 'error'); }
}

function cerrarFormActividad() {
  document.getElementById('formPanelActividad').style.display = 'none';
  document.getElementById('formActividad').reset();
  editActividadId = null;
}

async function guardarActividad(e) {
  e.preventDefault();
  const btn = document.getElementById('btnGuardarActividad');
  btn.disabled = true;

  const data = {
    descripcion:      document.getElementById('aDescripcion').value.trim(),
    fecha_actividad:  document.getElementById('aFecha').value,
    estado:           document.getElementById('aEstado').value,
    porcentaje_avance:parseInt(document.getElementById('aPorcentaje').value) || 0,
    proyecto_id:      parseInt(document.getElementById('aProyectoId').value),
  };

  const url    = editActividadId ? `${API}/api/actividades/${editActividadId}` : `${API}/api/actividades`;
  const method = editActividadId ? 'PUT' : 'POST';

  try {
    const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(data) });
    const res = await r.json();
    if (r.ok) {
      toast(editActividadId ? '✅ Actividad actualizada' : '✅ Actividad creada');
      cerrarFormActividad();
      await cargarActividades();
      await cargarDashboard();
    } else {
      toast('❌ ' + (res.error || 'Error al guardar'), 'error');
    }
  } catch {
    toast('❌ Sin conexión con el servidor', 'error');
  } finally {
    btn.disabled = false;
  }
}

function pedirEliminarActividad(id) {
  confirmar('¿Eliminar actividad?', 'Esta acción no se puede deshacer.', () => eliminarActividad(id));
}

async function eliminarActividad(id) {
  try {
    const r = await fetch(`${API}/api/actividades/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (r.ok) {
      toast('🗑️ Actividad eliminada');
      await cargarActividades();
      await cargarDashboard();
    } else {
      const res = await r.json();
      toast('❌ ' + (res.error || 'Error'), 'error');
    }
  } catch { toast('❌ Sin conexión', 'error'); }
}

/* ══════════════════════════════════════════════
   USUARIOS
══════════════════════════════════════════════ */
async function crearUsuario(e) {
  e.preventDefault();
  const data = {
    nombre:   document.getElementById('nuevoNombre').value.trim(),
    email:    document.getElementById('nuevoEmail').value.trim(),
    password: document.getElementById('nuevoPassword').value,
    rol:      document.getElementById('nuevoRol').value,
  };

  try {
    const r = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const res = await r.json();
    if (r.ok) {
      toast('✅ Usuario creado correctamente');
      document.getElementById('formUsuario').reset();
    } else {
      toast('❌ ' + (res.error || 'Error al crear usuario'), 'error');
    }
  } catch {
    toast('❌ Sin conexión con el servidor', 'error');
  }
}

/* ══════════════════════════════════════════════
   CONSULTAS
══════════════════════════════════════════════ */
async function consultarPorEstado() {
  const estado = document.getElementById('filtroEstado').value;
  if (!estado) { toast('Selecciona un estado primero', 'info'); return; }
  try {
    const r = await fetch(`${API}/api/consultas/por-estado?estado=${encodeURIComponent(estado)}`);
    const res = await r.json();
    mostrarResultadoConsulta('resultadoEstado', r.ok ? res.proyectos : [], res);
  } catch { toast('❌ Sin conexión', 'error'); }
}

async function consultarPorInvestigador() {
  const nombre = document.getElementById('filtroInvestigador').value.trim();
  if (nombre.length < 2) { toast('Escribe al menos 2 caracteres', 'info'); return; }
  try {
    const r = await fetch(`${API}/api/consultas/por-investigador?nombre=${encodeURIComponent(nombre)}`);
    const res = await r.json();
    mostrarResultadoConsulta('resultadoInvestigador', r.ok ? res.proyectos : [], res);
  } catch { toast('❌ Sin conexión', 'error'); }
}

async function consultarPorFecha() {
  const inicio = document.getElementById('filtroFechaInicio').value;
  const fin    = document.getElementById('filtroFechaFin').value;
  if (!inicio || !fin) { toast('Selecciona ambas fechas', 'info'); return; }
  try {
    const r = await fetch(`${API}/api/consultas/por-fecha?inicio=${inicio}&fin=${fin}`);
    const res = await r.json();
    mostrarResultadoConsulta('resultadoFecha', r.ok ? res.proyectos : [], res);
  } catch { toast('❌ Sin conexión', 'error'); }
}

async function busquedaGlobal() {
  const q = document.getElementById('busquedaGlobal').value.trim();
  if (q.length < 2) { toast('Escribe al menos 2 caracteres', 'info'); return; }
  const el = document.getElementById('resultadoGlobal');
  try {
    const r = await fetch(`${API}/api/consultas/buscar?q=${encodeURIComponent(q)}`);
    const res = await r.json();
    if (!r.ok) { el.innerHTML = `<div class="query-empty">${res.error || 'Error'}</div>`; return; }

    let html = '';
    if (res.proyectos.total > 0) {
      html += `<p style="font-size:.78rem;font-weight:700;color:var(--muted);margin:10px 0 6px;text-transform:uppercase">📁 Proyectos (${res.proyectos.total})</p>`;
      res.proyectos.items.forEach(p => {
        html += `<div class="query-item"><span>${escHtml(p.nombre)}</span>${badgeEstado(p.estado)}</div>`;
      });
    }
    if (res.participantes.total > 0) {
      html += `<p style="font-size:.78rem;font-weight:700;color:var(--muted);margin:10px 0 6px;text-transform:uppercase">👥 Participantes (${res.participantes.total})</p>`;
      res.participantes.items.forEach(p => {
        html += `<div class="query-item"><span>${escHtml(p.nombre)}</span><span style="font-size:.78rem;color:var(--muted)">${escHtml(p.email || '')}</span></div>`;
      });
    }
    if (res.instituciones.total > 0) {
      html += `<p style="font-size:.78rem;font-weight:700;color:var(--muted);margin:10px 0 6px;text-transform:uppercase">🏛️ Instituciones (${res.instituciones.total})</p>`;
      res.instituciones.items.forEach(i => {
        html += `<div class="query-item"><span>${escHtml(i.nombre)}</span></div>`;
      });
    }
    if (!html) html = `<div class="query-empty">Sin resultados para "${escHtml(q)}"</div>`;
    el.innerHTML = html;
  } catch { toast('❌ Sin conexión', 'error'); }
}

function mostrarResultadoConsulta(elId, proyectos, res) {
  const el = document.getElementById(elId);
  if (!proyectos || proyectos.length === 0) {
    el.innerHTML = `<div class="query-empty">${res.error || 'Sin resultados'}</div>`;
    return;
  }
  el.innerHTML = proyectos.map(p => `
    <div class="query-item">
      <div>
        <div style="font-weight:600;font-size:.85rem">${escHtml(p.nombre)}</div>
        <div style="font-size:.75rem;color:var(--muted)">${p.investigador_responsable || '—'} · ${p.fecha_inicio || ''}</div>
      </div>
      ${badgeEstado(p.estado)}
    </div>
  `).join('');
}

/* ══════════════════════════════════════════════
   ESCAPE HELPERS (seguridad XSS)
══════════════════════════════════════════════ */
function escHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}