/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */

const SPORTS = {
  running:  { label:'RUNNING',  icon:'assets/icons/running.svg',  color:'#E8633A' },
  cycling:  { label:'CYCLING',  icon:'assets/icons/cycling.svg',  color:'#F59E0B' },
  swimming: { label:'SWIMMING', icon:'assets/icons/swimming.svg', color:'#2D9CDB' },
  gym:      { label:'GYM',      icon:'assets/icons/gym.svg',      color:'#8B5CF6' },
  walking:  { label:'WALKING',  icon:'assets/icons/walking.svg',  color:'#10B981' },
};

const PATTERNS = [
  { id:'push-horizontal', label:'Empuje\nHoriz.' },
  { id:'push-vertical',   label:'Empuje\nVert.'  },
  { id:'pull-horizontal', label:'Tirón\nHoriz.'  },
  { id:'pull-vertical',   label:'Tirón\nVert.'   },
  { id:'knee-dominant',   label:'Dom.\nRodilla'  },
  { id:'hip-hinge',       label:'Bisagra\nCadera'},
  { id:'core',            label:'Core'           },
  { id:'full-body',       label:'Full\nBody'     },
  { id:'unilateral',      label:'Unilat.'        },
];

const STORAGE_KEY = 'ht-sessions-v1';

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */

let sessions       = [];
let currentSport   = null;
let formPattern        = null;  // patrón del bloque que se está armando ahora
let formExercises      = [];    // ejercicios del bloque que se está armando ahora
let formBlocks         = [];    // bloques ya confirmados: [{pattern, exercises:[...]}]
let exCounter      = 0;
let expandedCards  = new Set();
let weekOffset     = 0; // 0 = semana actual, -1 = semana anterior, etc.

/* ═══════════════════════════════════════════
   STORAGE
═══════════════════════════════════════════ */

function loadSessions() {
  try { sessions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { sessions = []; }
}

function saveSessions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

/* ═══════════════════════════════════════════
   NAVIGATION (pantallas)
═══════════════════════════════════════════ */

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const fab = document.getElementById('fab');
  fab.classList.toggle('hidden', ['screen-select-sport','screen-form'].includes(id));
  window.scrollTo(0, 0);
}

function navTo(section) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const navEl = document.getElementById('nav-' + section);
  if (navEl) navEl.classList.add('active');
  if (section === 'home') {
    showScreen('screen-home');
    renderHome();
  } else if (section === 'history') {
    showScreen('screen-history');
    renderHistory();
  }
}

/* ═══════════════════════════════════════════
   WEEK UTILS
═══════════════════════════════════════════ */

function getWeekBounds(date) {
  const d   = new Date(date);
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  mon.setHours(0,0,0,0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23,59,59,999);
  return { mon, sun };
}

function getSelectedWeekBounds() {
  const ref = new Date();
  ref.setDate(ref.getDate() + weekOffset * 7);
  return getWeekBounds(ref);
}

function getSelectedWeekSessions() {
  const { mon, sun } = getSelectedWeekBounds();
  return sessions.filter(s => {
    const d = new Date(s.date + 'T12:00:00');
    return d >= mon && d <= sun;
  });
}

function formatWeekLabel(mon, sun) {
  const opts = { day:'numeric', month:'short' };
  const ms = mon.toLocaleDateString('es-AR', opts).replace('.', '').toUpperCase();
  const ss = sun.toLocaleDateString('es-AR', opts).replace('.', '').toUpperCase();
  return `${ms} — ${ss}`;
}

function weekPrev() { weekOffset -= 1; renderHome(); }
function weekNext() {
  if (weekOffset >= 0) return; // no ir al futuro
  weekOffset += 1;
  renderHome();
}

/* ═══════════════════════════════════════════
   RING — sesiones de la semana seleccionada
═══════════════════════════════════════════ */

function drawRing(weekSessions) {
  const count = weekSessions.length;
  document.getElementById('ring-count').textContent = count;

  const arcsEl = document.getElementById('ring-arcs');
  arcsEl.innerHTML = '';
  if (count === 0) return;

  const cx = 60, cy = 60, r = 50, sw = 7;
  const total = count;
  const gap   = 0.06;
  let offset  = 0;

  const groups = {};
  weekSessions.forEach(s => { groups[s.sport] = (groups[s.sport] || 0) + 1; });

  Object.entries(groups).forEach(([sport, cnt]) => {
    const color    = SPORTS[sport]?.color || '#888';
    const fraction = cnt / total;
    const angle    = fraction * Math.PI * 2 - gap;
    const sa       = offset + gap / 2 - Math.PI / 2;
    const ea       = sa + angle;

    const x1 = cx + r * Math.cos(sa);
    const y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea);
    const y2 = cy + r * Math.sin(ea);
    const lg = angle > Math.PI ? 1 : 0;

    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', `M ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2}`);
    path.setAttribute('fill','none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', sw);
    path.setAttribute('stroke-linecap','round');
    arcsEl.appendChild(path);

    offset += fraction * Math.PI * 2;
  });
}

/* ═══════════════════════════════════════════
   HOME — Overview (círculo + volumen + stats)
═══════════════════════════════════════════ */

function renderHome() {
  renderOverview();
  renderSessionPreview();
}

function renderOverview() {
  const { mon, sun } = getSelectedWeekBounds();
  const weekSessions = getSelectedWeekSessions();

  // Label de semana
  document.getElementById('week-label').textContent = formatWeekLabel(mon, sun);

  // Habilitar/deshabilitar flecha "siguiente" si ya estamos en la semana actual
  document.getElementById('week-next').style.opacity = weekOffset >= 0 ? '0.3' : '1';
  document.getElementById('week-next').style.cursor   = weekOffset >= 0 ? 'default' : 'pointer';

  // Ring
  drawRing(weekSessions);

  // Volumen total de la semana (km equivalentes, sumando todo)
  let totalVolumeKm = 0;
  weekSessions.forEach(s => {
    if (!s.distance) return;
    if (s.sport === 'swimming') totalVolumeKm += parseFloat(s.distance) / 1000;
    else totalVolumeKm += parseFloat(s.distance) || 0;
  });
  document.getElementById('overview-volume-value').textContent =
    totalVolumeKm > 0 ? `${totalVolumeKm.toFixed(1)} km` : '0 km';

  // Stat rows por deporte (de la semana seleccionada)
  const statList = document.getElementById('overview-stat-list');
  const sportKeys = ['running','cycling','swimming','gym','walking'];

  statList.innerHTML = sportKeys.map(key => {
    const sp = SPORTS[key];
    const sportSessions = weekSessions.filter(s => s.sport === key);

    let valueStr;
    if (key === 'gym') {
      valueStr = `${sportSessions.length} ses.`;
    } else {
      const total = sportSessions.reduce((a,s) => a + (parseFloat(s.distance) || 0), 0);
      const unit  = key === 'swimming' ? 'm' : 'km';
      valueStr = `${unit === 'km' ? total.toFixed(1) : total.toFixed(0)} ${unit}`;
    }

    return `
    <div class="overview-stat-row">
      <div class="overview-stat-icon" style="background:${sp.color}1f">
        <img src="${sp.icon}" alt="${sp.label}">
      </div>
      <div class="overview-stat-text">
        <span class="overview-stat-name" style="color:${sp.color}">${sp.label}</span>
        <span class="overview-stat-value">${valueStr}</span>
      </div>
    </div>`;
  }).join('');
}

/* ─── Session preview (últimas 3, globales) ─── */

function renderSessionPreview() {
  const container = document.getElementById('session-preview');
  const recent    = [...sessions].reverse().slice(0, 3);

  if (recent.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-state-title">SIN SESIONES AÚN</div>
      <div class="empty-state-sub">Tocá + para registrar tu primera actividad.</div>
    </div>`;
    return;
  }
  container.innerHTML = recent.map(s => sessionCardHTML(s)).join('');
}

/* ═══════════════════════════════════════════
   HISTORY
═══════════════════════════════════════════ */

function renderHistory() {
  const container = document.getElementById('session-list');

  if (sessions.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding-top:60px">
      <div class="empty-state-title">SIN SESIONES</div>
      <div class="empty-state-sub">Empezá a registrar tus actividades.</div>
    </div>`;
    return;
  }

  const sorted = [...sessions].reverse();
  container.innerHTML = sorted.map(s => sessionCardHTML(s)).join('');
}

/* ═══════════════════════════════════════════
   SESSION CARD
═══════════════════════════════════════════ */

function sessionCardHTML(session) {
  const sp = SPORTS[session.sport];
  if (!sp) return '';
  const isOpen = expandedCards.has(session.id);

  let mainValue = '—';
  let detail    = '';

  if (session.sport === 'running' && session.distance) {
    mainValue = session.distance + ' km';
    detail    = session.pace ? session.pace + ' /km' : (session.duration ? session.duration + ' min' : '');
  } else if (session.sport === 'cycling' && session.distance) {
    mainValue = session.distance + ' km';
    detail    = session.duration ? session.duration + ' min' : '';
  } else if (session.sport === 'swimming' && session.distance) {
    mainValue = session.distance + ' m';
    detail    = session.duration ? session.duration + ' min' : '';
  } else if (session.sport === 'gym') {
    if (session.blocks?.length) {
      mainValue = session.blocks.map(b =>
        PATTERNS.find(p => p.id === b.pattern)?.label.replace('\n',' ') || b.pattern
      ).join(' + ');
      const totalEx = session.blocks.reduce((a, b) => a + (b.exercises?.length || 0), 0);
      detail = totalEx ? totalEx + ' ejercicios' : '';
    } else {
      mainValue = session.pattern ? (PATTERNS.find(p => p.id === session.pattern)?.label.replace('\n',' ') || 'GYM') : 'GYM';
      detail    = session.exercises?.length ? session.exercises.length + ' ejercicios' : '';
    }
  } else if (session.sport === 'walking' && session.distance) {
    mainValue = session.distance + ' km';
    detail    = session.duration ? session.duration + ' min' : '';
  }

  // Date label
  const d          = new Date(session.date + 'T12:00:00');
  const today       = new Date(); today.setHours(0,0,0,0);
  const yesterday   = new Date(today); yesterday.setDate(today.getDate()-1);
  const sessionDay  = new Date(d); sessionDay.setHours(0,0,0,0);

  let dateLabel;
  if (sessionDay.getTime() === today.getTime()) {
    dateLabel = 'Hoy';
  } else if (sessionDay.getTime() === yesterday.getTime()) {
    dateLabel = 'Ayer';
  } else {
    dateLabel = d.toLocaleDateString('es-AR', { day:'numeric', month:'short' });
  }

  let fieldsHTML = '', exercisesHTML = '';

  if (isOpen) {
    const fieldMap = {
      running:  [['distance','Distancia'],['duration','Duración'],['pace','Pace'],['hr_avg','FC avg'],['cadence','Cadencia']],
      cycling:  [['distance','Distancia'],['duration','Duración'],['speed_avg','Vel. media'],['hr_avg','FC avg']],
      swimming: [['distance','Distancia'],['duration','Duración'],['sets','Series'],['stroke','Estilo']],
      gym:      [['duration','Duración'],['rpe','RPE']],
      walking:  [['distance','Distancia'],['duration','Duración']],
    };
    const fields = (fieldMap[session.sport] || []).filter(([k]) => session[k]);
    if (fields.length) {
      fieldsHTML = `<div class="session-fields">${fields.map(([k,l]) =>
        `<div class="session-field"><div class="session-field-label">${l}</div><div class="session-field-value">${session[k]}</div></div>`
      ).join('')}</div>`;
    }
    if (session.sport === 'gym' && session.blocks?.length) {
      exercisesHTML = session.blocks.map(block => {
        const patLabel = PATTERNS.find(p => p.id === block.pattern)?.label.replace('\n',' ') || block.pattern;
        return `<div class="exercises-block">
          <div class="exercises-block-title">${patLabel}</div>
          ${block.exercises.map(ex => `
          <div class="exercise-item">
            <div>
              <div class="exercise-item-name">${ex.name || 'Sin nombre'}</div>
              <div class="exercise-item-meta">${ex.sets||'?'} series × ${ex.reps||'?'} reps${ex.weight ? ' · '+ex.weight+' kg':''}</div>
            </div>
            <div class="exercise-item-rest">${ex.rest ? ex.rest+'s desc.':''}</div>
          </div>`).join('')}
        </div>`;
      }).join('');
    } else if (session.exercises?.length) {
      exercisesHTML = `<div class="exercises-block">
        <div class="exercises-block-title">EJERCICIOS</div>
        ${session.exercises.map(ex => `
        <div class="exercise-item">
          <div>
            <div class="exercise-item-name">${ex.name || 'Sin nombre'}</div>
            <div class="exercise-item-meta">${ex.sets||'?'} series × ${ex.reps||'?'} reps${ex.weight ? ' · '+ex.weight+' kg':''}</div>
          </div>
          <div class="exercise-item-rest">${ex.rest ? ex.rest+'s desc.':''}</div>
        </div>`).join('')}
      </div>`;
    }
  }

  return `<div class="session-card" id="card-${session.id}">
    <div class="session-card-header" onclick="toggleCard(${session.id})">
      <div class="session-icon-wrap" style="background:${sp.color}18">
        <img src="${sp.icon}" alt="${sp.label}">
      </div>
      <div class="session-meta">
        <div class="session-sport-name" style="color:${sp.color}">${sp.label}</div>
        <div class="session-main-value">${mainValue}</div>
        ${detail ? `<div class="session-detail">${detail}</div>` : ''}
      </div>
      <div class="session-date">${dateLabel}</div>
    </div>
    ${isOpen ? `<div class="session-card-body open">
      ${fieldsHTML}${exercisesHTML}
      <button class="btn-delete-session" onclick="deleteSession(${session.id})">Eliminar sesión</button>
    </div>` : ''}
  </div>`;
}

function toggleCard(id) {
  if (expandedCards.has(id)) expandedCards.delete(id);
  else expandedCards.add(id);
  const card    = document.getElementById('card-' + id);
  const session = sessions.find(s => s.id === id);
  if (card && session) card.outerHTML = sessionCardHTML(session);
}

function deleteSession(id) {
  if (!confirm('¿Eliminás esta sesión?')) return;
  sessions = sessions.filter(s => s.id !== id);
  saveSessions();
  expandedCards.delete(id);
  renderHome();
  renderHistory();
}

/* ═══════════════════════════════════════════
   SPORT FORM
═══════════════════════════════════════════ */

function openSportForm(sport) {
  currentSport  = sport;
  formPattern   = null;
  formExercises = [];
  formBlocks    = [];
  exCounter     = 0;

  const sp = SPORTS[sport];
  document.getElementById('form-sport-icon').src          = sp.icon;
  document.getElementById('form-sport-title').textContent = sp.label;

  renderFormBody();
  showScreen('screen-form');
}

function renderFormBody() {
  const body  = document.getElementById('form-body');
  const today = new Date().toISOString().slice(0,10);

  let specificHTML = '';
  if      (currentSport === 'running')  specificHTML = formRunning();
  else if (currentSport === 'cycling')  specificHTML = formCycling();
  else if (currentSport === 'swimming') specificHTML = formSwimming();
  else if (currentSport === 'gym')      specificHTML = formGym();
  else if (currentSport === 'walking')  specificHTML = formWalking();

  body.innerHTML = `
  <div class="form-section">
    <div class="form-section-title">Fecha</div>
    <div class="form-field">
      <input type="date" class="form-input" id="f-date" value="${today}">
    </div>
  </div>
  ${specificHTML}`;

  if (currentSport === 'gym') {
    renderExercisesDOM();
    updatePatternButtons();
    updateAddBlockBtn();
  }

  attachAutocalc();
}

/* ─── Auto-cálculo de pace (distancia ÷ tiempo) ─── */

function attachAutocalc() {
  const distEl = document.getElementById('f-distance');
  const durEl  = document.getElementById('f-duration');
  const paceEl = document.getElementById('f-pace');

  if (!distEl || !durEl || !paceEl) return;

  function calcPace() {
    const dist = parseFloat(distEl.value);
    const dur  = parseFloat(durEl.value);
    if (dist > 0 && dur > 0) {
      const totalSec = dur * 60;
      const secPerKm = totalSec / dist;
      const min = Math.floor(secPerKm / 60);
      const sec = Math.round(secPerKm % 60);
      paceEl.value = `${min}:${sec.toString().padStart(2,'0')}`;
    }
  }

  distEl.addEventListener('input', calcPace);
  durEl.addEventListener('input',  calcPace);
}

/* ─── Formularios por deporte ─────────────── */

function formRunning() {
  return `
  <div class="form-section">
    <div class="form-section-title">Volumen</div>
    <div class="form-row">
      <div class="form-field">
        <label class="form-label">Distancia (km)</label>
        <input type="number" step="0.1" class="form-input" id="f-distance" placeholder="10.0">
      </div>
      <div class="form-field">
        <label class="form-label">Duración (min)</label>
        <input type="number" class="form-input" id="f-duration" placeholder="55">
      </div>
    </div>
    <div class="form-row">
      <div class="form-field">
        <label class="form-label">Pace <span class="form-label-auto">(auto)</span></label>
        <input type="text" class="form-input form-input-auto" id="f-pace" placeholder="5:30" readonly>
      </div>
      <div class="form-field">
        <label class="form-label">Cadencia (spm)</label>
        <input type="number" class="form-input" id="f-cadence" placeholder="175">
      </div>
    </div>
  </div>
  <div class="form-section">
    <div class="form-section-title">Fisiología</div>
    <div class="form-field">
      <label class="form-label">FC promedio (bpm)</label>
      <input type="number" class="form-input" id="f-hr_avg" placeholder="150">
    </div>
  </div>
  <div class="form-section">
    <div class="form-section-title">Notas</div>
    <div class="form-field">
      <textarea class="form-input" id="f-notes" placeholder="Terreno, sensaciones, objetivos..."></textarea>
    </div>
  </div>`;
}

function formCycling() {
  return `
  <div class="form-section">
    <div class="form-section-title">Volumen</div>
    <div class="form-row">
      <div class="form-field">
        <label class="form-label">Distancia (km)</label>
        <input type="number" step="0.1" class="form-input" id="f-distance" placeholder="40.0">
      </div>
      <div class="form-field">
        <label class="form-label">Duración (min)</label>
        <input type="number" class="form-input" id="f-duration" placeholder="90">
      </div>
    </div>
    <div class="form-row">
      <div class="form-field">
        <label class="form-label">Vel. media (km/h)</label>
        <input type="number" step="0.1" class="form-input" id="f-speed_avg" placeholder="26.5">
      </div>
      <div class="form-field">
        <label class="form-label">FC promedio (bpm)</label>
        <input type="number" class="form-input" id="f-hr_avg" placeholder="145">
      </div>
    </div>
  </div>
  <div class="form-section">
    <div class="form-section-title">Notas</div>
    <div class="form-field">
      <textarea class="form-input" id="f-notes" placeholder="Recorrido, sensaciones..."></textarea>
    </div>
  </div>`;
}

function formSwimming() {
  return `
  <div class="form-section">
    <div class="form-section-title">Volumen</div>
    <div class="form-row">
      <div class="form-field">
        <label class="form-label">Distancia (m)</label>
        <input type="number" step="50" class="form-input" id="f-distance" placeholder="2000">
      </div>
      <div class="form-field">
        <label class="form-label">Duración (min)</label>
        <input type="number" class="form-input" id="f-duration" placeholder="45">
      </div>
    </div>
    <div class="form-row">
      <div class="form-field">
        <label class="form-label">Series</label>
        <input type="number" class="form-input" id="f-sets" placeholder="8">
      </div>
      <div class="form-field">
        <label class="form-label">Estilo</label>
        <select class="form-input" id="f-stroke">
          <option value="">— elegir —</option>
          <option value="Libre">Libre</option>
          <option value="Pecho">Pecho</option>
          <option value="Espalda">Espalda</option>
          <option value="Mariposa">Mariposa</option>
          <option value="Mixto">Mixto</option>
        </select>
      </div>
    </div>
  </div>
  <div class="form-section">
    <div class="form-section-title">Notas</div>
    <div class="form-field">
      <textarea class="form-input" id="f-notes" placeholder="Estructura de la sesión..."></textarea>
    </div>
  </div>`;
}

function formGym() {
  const patternBtns = PATTERNS.map(p =>
    `<button type="button" class="pattern-btn" data-pattern="${p.id}" onclick="selectPattern('${p.id}')">${p.label}</button>`
  ).join('');

  return `
  <div class="form-section">
    <div class="form-section-title">Bloques de la sesión</div>
    <div id="blocks-confirmed">${renderConfirmedBlocksHTML()}</div>
  </div>

  <div class="form-section">
    <div class="form-section-title">Patrón de movimiento</div>
    <div class="pattern-grid" id="pattern-grid">${patternBtns}</div>
  </div>

  <div class="form-section">
    <div class="form-section-title">Ejercicios de este patrón</div>
    <div class="exercise-builder" id="exercise-builder">
      <div id="exercises-dom"></div>
      <button type="button" class="btn-add-ex" onclick="addExercise()">+ AGREGAR EJERCICIO</button>
    </div>
    <button type="button" class="btn-add-block" id="btn-add-block" onclick="confirmBlock()" disabled>
      AGREGAR PATRÓN A LA SESIÓN
    </button>
  </div>

  <div class="form-section">
    <div class="form-section-title">General</div>
    <div class="form-row">
      <div class="form-field">
        <label class="form-label">Duración (min)</label>
        <input type="number" class="form-input" id="f-duration" placeholder="60">
      </div>
      <div class="form-field">
        <label class="form-label">RPE (1–10)</label>
        <input type="number" step="0.5" min="1" max="10" class="form-input" id="f-rpe" placeholder="7">
      </div>
    </div>
  </div>
  <div class="form-section">
    <div class="form-section-title">Notas</div>
    <div class="form-field">
      <textarea class="form-input" id="f-notes" placeholder="Sensaciones, PRs, observaciones..."></textarea>
    </div>
  </div>`;
}

/* ─── Bloques confirmados (lista resumen) ─── */

function renderConfirmedBlocksHTML() {
  if (!formBlocks.length) {
    return `<div class="blocks-empty">Todavía no agregaste ningún patrón. Seleccioná uno abajo, sumá sus ejercicios y tocá "Agregar patrón a la sesión".</div>`;
  }
  return formBlocks.map((block, i) => {
    const label = PATTERNS.find(p => p.id === block.pattern)?.label.replace('\n',' ') || block.pattern;
    return `
    <div class="block-confirmed-card">
      <div class="block-confirmed-header">
        <span class="block-confirmed-label">${label}</span>
        <button type="button" class="btn-remove-block" onclick="removeBlock(${i})">×</button>
      </div>
      <div class="block-confirmed-exercises">
        ${block.exercises.map(ex => `<span class="block-ex-chip">${ex.name || 'Ejercicio'} · ${ex.sets || '?'}×${ex.reps || '?'}</span>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function formWalking() {
  return `
  <div class="form-section">
    <div class="form-section-title">Volumen</div>
    <div class="form-row">
      <div class="form-field">
        <label class="form-label">Distancia (km)</label>
        <input type="number" step="0.1" class="form-input" id="f-distance" placeholder="5.0">
      </div>
      <div class="form-field">
        <label class="form-label">Duración (min)</label>
        <input type="number" class="form-input" id="f-duration" placeholder="60">
      </div>
    </div>
  </div>
  <div class="form-section">
    <div class="form-section-title">Notas</div>
    <div class="form-field">
      <textarea class="form-input" id="f-notes" placeholder="Recorrido, sensaciones..."></textarea>
    </div>
  </div>`;
}

/* ─── Patrón de movimiento ─────────────────── */

function selectPattern(id) {
  formPattern = id;
  updatePatternButtons();
  updateAddBlockBtn();
}

function updatePatternButtons() {
  document.querySelectorAll('.pattern-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.pattern === formPattern);
  });
}

function updateAddBlockBtn() {
  const btn = document.getElementById('btn-add-block');
  if (!btn) return;
  const hasValidExercise = formExercises.some(e => e.name || e.sets || e.reps);
  btn.disabled = !(formPattern && hasValidExercise);
}

/* ─── Confirmar / quitar bloque ────────────── */

function confirmBlock() {
  if (!formPattern) return;
  const validExercises = formExercises.filter(e => e.name || e.sets || e.reps);
  if (!validExercises.length) return;

  formBlocks.push({ pattern: formPattern, exercises: validExercises });

  // Reset del bloque en construcción para empezar uno nuevo
  formPattern   = null;
  formExercises = [];

  document.getElementById('blocks-confirmed').innerHTML = renderConfirmedBlocksHTML();
  updatePatternButtons();
  renderExercisesDOM();
  updateAddBlockBtn();
}

function removeBlock(index) {
  formBlocks.splice(index, 1);
  document.getElementById('blocks-confirmed').innerHTML = renderConfirmedBlocksHTML();
}

/* ─── Constructor de ejercicios ────────────── */

function addExercise() {
  const id = 'ex' + (++exCounter);
  formExercises.push({ _id:id, name:'', sets:'', reps:'', weight:'', rest:'' });
  renderExercisesDOM();
  updateAddBlockBtn();
}

function removeExercise(id) {
  formExercises = formExercises.filter(e => e._id !== id);
  renderExercisesDOM();
  updateAddBlockBtn();
}

function updateExField(id, field, val) {
  const ex = formExercises.find(e => e._id === id);
  if (ex) ex[field] = val;
  updateAddBlockBtn();
}

function renderExercisesDOM() {
  const container = document.getElementById('exercises-dom');
  if (!container) return;
  if (!formExercises.length) { container.innerHTML = ''; return; }

  container.innerHTML = formExercises.map(ex => `
  <div class="exercise-entry" id="entry-${ex._id}">
    <button type="button" class="btn-remove-ex" onclick="removeExercise('${ex._id}')">×</button>
    <input class="ex-name-input" type="text" placeholder="Nombre del ejercicio"
      value="${ex.name}" oninput="updateExField('${ex._id}','name',this.value)">
    <div class="ex-row">
      <div class="ex-field-wrap">
        <span class="ex-field-label">Series</span>
        <input class="ex-mini-input" type="number" min="1" value="${ex.sets}" placeholder="4"
          oninput="updateExField('${ex._id}','sets',this.value)">
      </div>
      <div class="ex-field-wrap">
        <span class="ex-field-label">Reps</span>
        <input class="ex-mini-input" type="text" value="${ex.reps}" placeholder="8–12"
          oninput="updateExField('${ex._id}','reps',this.value)">
      </div>
      <div class="ex-field-wrap">
        <span class="ex-field-label">Carga (kg)</span>
        <input class="ex-mini-input" type="number" step="0.5" value="${ex.weight}" placeholder="—"
          oninput="updateExField('${ex._id}','weight',this.value)">
      </div>
      <div class="ex-field-wrap">
        <span class="ex-field-label">Desc. (seg)</span>
        <input class="ex-mini-input" type="number" value="${ex.rest}" placeholder="90"
          oninput="updateExField('${ex._id}','rest',this.value)">
      </div>
    </div>
  </div>`).join('');
}

/* ─── Guardar sesión ───────────────────────── */

function saveSession() {
  if (!currentSport) return;

  const session = {
    id:        Date.now(),
    sport:     currentSport,
    date:      document.getElementById('f-date')?.value || new Date().toISOString().slice(0,10),
    createdAt: new Date().toISOString(),
  };

  const fields = ['distance','duration','pace','cadence','hr_avg','speed_avg','sets','stroke','rpe','notes'];
  fields.forEach(f => {
    const el = document.getElementById('f-' + f);
    if (el && el.value) session[f] = el.value;
  });

  if (currentSport === 'gym') {
    // Auto-confirmar bloque en progreso si tiene contenido válido
    const inProgressExercises = formExercises.filter(e => e.name || e.sets || e.reps);
    if (formPattern && inProgressExercises.length) {
      formBlocks.push({ pattern: formPattern, exercises: inProgressExercises });
    }
    session.blocks = formBlocks;
    // Para compatibilidad con la card: resumen del primer bloque
    if (formBlocks.length) {
      session.pattern   = formBlocks[0].pattern;
      session.exercises = formBlocks.flatMap(b => b.exercises);
    }
  }

  sessions.push(session);
  saveSessions();
  expandedCards.clear();

  // Si la sesión guardada cae en la semana actualmente mostrada, refresca el ring también.
  weekOffset = 0; // volver a semana actual para ver el impacto inmediato
  renderHome();
  renderHistory();

  navTo('home');
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */

document.querySelectorAll('.sport-row-btn').forEach(btn => {
  const m = btn.getAttribute('onclick')?.match(/openSportForm\('(\w+)'\)/);
  if (m) btn.dataset.sport = m[1];
});

document.getElementById('btn-ver-todo').addEventListener('click', () => navTo('history'));
document.getElementById('week-prev').addEventListener('click', weekPrev);
document.getElementById('week-next').addEventListener('click', weekNext);

loadSessions();
renderHome();
