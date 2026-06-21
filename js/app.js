/* ═══════════════════════════════════════════
   FIREBASE IMPORTS
═══════════════════════════════════════════ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc, query, orderBy }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIw-zAzluZVYM6ppXh8Vpm-uMPfL3thuw",
  authDomain: "human-training.firebaseapp.com",
  projectId: "human-training",
  storageBucket: "human-training.firebasestorage.app",
  messagingSenderId: "947583439798",
  appId: "1:947583439798:web:d0b9eeba00766aad426717",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth        = getAuth(firebaseApp);
const db          = getFirestore(firebaseApp);

/* ── Firebase helpers ── */
const fbRegister = (email, pw) => createUserWithEmailAndPassword(auth, email, pw);
const fbLogin    = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
const fbLogout   = ()          => signOut(auth);
const fbOnAuthChange = (cb)    => onAuthStateChanged(auth, cb);

async function fbSaveProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}
async function fbLoadProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}
async function fbSaveSession(uid, session) {
  await setDoc(doc(db, 'users', uid, 'sessions', String(session.id)), session);
}
async function fbLoadSessions(uid) {
  const q    = query(collection(db, 'users', uid, 'sessions'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}
async function fbUpdateSession(uid, session) {
  await setDoc(doc(db, 'users', uid, 'sessions', String(session.id)), session);
}
async function fbDeleteSession(uid, sessionId) {
  await deleteDoc(doc(db, 'users', uid, 'sessions', String(sessionId)));
}

let currentUser = null;

/* ═══════════════════════════════════════════
   SPORTS LIBRARY
   Cada deporte tiene: label, color, icon,
   category, metric (qué se muestra en el home),
   sessionTypes (tipos de sesión),
   fields (campos del formulario)
═══════════════════════════════════════════ */

const SPORTS_DB = {

  // ── RESISTENCIA ──────────────────────────
  running: {
    label:'Running', category:'Resistencia', color:'#E8633A',
    icon:'assets/icons/running.svg',
    metric:{ type:'distance', unit:'km' },
    sessionTypes:['Fondo','Tempo','Intervalos','Repeticiones','Regenerativo','Trail','Carrera'],
    fields:['distance_km','duration','pace','cadence','hr_avg','notes'],
  },
  cycling: {
    label:'Ciclismo', category:'Resistencia', color:'#F59E0B',
    icon:'assets/icons/cycling.svg',
    metric:{ type:'distance', unit:'km' },
    sessionTypes:['Fondo','Intervalos','Criterium','MTB','Ruta','Urbano'],
    fields:['distance_km','duration','speed_avg','hr_avg','notes'],
  },
  swimming: {
    label:'Natación', category:'Acuático', color:'#2D9CDB',
    icon:'assets/icons/swimming.svg',
    metric:{ type:'distance', unit:'m' },
    sessionTypes:['Técnica','Aeróbico','Sprints','Series','Resistencia'],
    fields:['distance_m','duration','pace','sets','stroke','hr_avg','notes'],
  },
  walking: {
    label:'Caminata', category:'Resistencia', color:'#10B981',
    icon:'assets/icons/walking.svg',
    metric:{ type:'distance', unit:'km' },
    sessionTypes:['Recreativo','Técnico','Marcha','Senderismo'],
    fields:['distance_km','duration','pace','notes'],
  },
  rowing: {
    label:'Remo', category:'Resistencia', color:'#06B6D4',
    icon:'assets/icons/running.svg',
    metric:{ type:'distance', unit:'km' },
    sessionTypes:['Fondo','Intervalos','Técnica','Competencia'],
    fields:['distance_km','duration','pace','hr_avg','notes'],
  },
  triathlon: {
    label:'Triatlón', category:'Resistencia', color:'#8B5CF6',
    icon:'assets/icons/running.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['Sprint','Olímpico','70.3','Ironman','Ladrillo','Técnica'],
    fields:['triathlon'],
  },

  // ── ACUÁTICO / APNEA ─────────────────────
  apnea: {
    label:'Apnea', category:'Acuático', color:'#0891B2',
    icon:'assets/icons/swimming.svg',
    metric:{ type:'distance', unit:'m' },
    sessionTypes:['Estática','Dinámica','Profundidad','Técnica','CO2','O2'],
    fields:['apnea_max_distance','apnea_best_hold','apnea_sets','apnea_recovery','apnea_depth','notes'],
  },

  // ── FUERZA / GYM ─────────────────────────
  gym: {
    label:'Gym', category:'Fuerza', color:'#8B5CF6',
    icon:'assets/icons/gym.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['Fuerza','Hipertrofia','Potencia','Resistencia muscular','Full body','Técnica'],
    fields:['blocks','duration','rpe','notes'],
  },
  calisthenics: {
    label:'Calistenia', category:'Fuerza', color:'#A78BFA',
    icon:'assets/icons/gym.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['Fuerza','Skill','Resistencia','Técnica','Freestyle'],
    fields:['blocks','duration','rpe','notes'],
  },
  powerlifting: {
    label:'Powerlifting', category:'Fuerza', color:'#7C3AED',
    icon:'assets/icons/gym.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['Fuerza máxima','Técnica','Competencia','Peaking'],
    fields:['blocks','duration','rpe','notes'],
  },
  weightlifting: {
    label:'Halterofilia', category:'Fuerza', color:'#6D28D9',
    icon:'assets/icons/gym.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['Arranque','Dos tiempos','Fuerza','Técnica','Competencia'],
    fields:['blocks','duration','rpe','notes'],
  },

  // ── FUNCIONAL / MIXTO ─────────────────────
  crossfit: {
    label:'CrossFit', category:'Funcional', color:'#EF4444',
    icon:'assets/icons/gym.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['WOD','Fuerza','Gimnástico','Metcon','AMRAP','EMOM'],
    fields:['cf_wod_name','cf_result','duration','rpe','notes'],
  },
  plyometrics: {
    label:'Pliometría', category:'Funcional', color:'#F97316',
    icon:'assets/icons/running.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['Saltos','Lanzamientos','Sprints','Combinado'],
    fields:['duration','rpe','notes'],
  },
  hiit: {
    label:'HIIT', category:'Funcional', color:'#DC2626',
    icon:'assets/icons/running.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['Circuito','Tabata','AMRAP','Fartlek','Combinado'],
    fields:['duration','rpe','notes'],
  },

  // ── DEPORTES DE COMBATE ───────────────────
  boxing: {
    label:'Boxeo', category:'Combate', color:'#B45309',
    icon:'assets/icons/gym.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['Técnica','Sparring','Físico','Sombra','Saco','Combate'],
    fields:['combat_rounds','combat_round_duration','duration','rpe','notes'],
  },
  mma: {
    label:'MMA', category:'Combate', color:'#92400E',
    icon:'assets/icons/gym.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['Técnica','Sparring','Físico','Grappling','Striking','Combate'],
    fields:['combat_rounds','combat_round_duration','duration','rpe','notes'],
  },
  bjj: {
    label:'BJJ', category:'Combate', color:'#1D4ED8',
    icon:'assets/icons/gym.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['Técnica','Sparring','Competencia','Drilling','Posición'],
    fields:['combat_rounds','duration','rpe','notes'],
  },
  judo: {
    label:'Judo', category:'Combate', color:'#1E40AF',
    icon:'assets/icons/gym.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['Técnica','Randori','Físico','Kata','Competencia'],
    fields:['combat_rounds','duration','rpe','notes'],
  },

  // ── DEPORTES DE EQUIPO ────────────────────
  football: {
    label:'Fútbol', category:'Equipo', color:'#15803D',
    icon:'assets/icons/running.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['Partido','Técnica','Físico','Táctica','Entrenamiento'],
    fields:['team_result','team_position','duration','notes'],
  },
  basketball: {
    label:'Basketball', category:'Equipo', color:'#EA580C',
    icon:'assets/icons/running.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['Partido','Técnica','Físico','Tiro','Entrenamiento'],
    fields:['team_result','duration','notes'],
  },
  rugby: {
    label:'Rugby', category:'Equipo', color:'#166534',
    icon:'assets/icons/running.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['Partido','Técnica','Físico','Scrum','Línea','Entrenamiento'],
    fields:['team_result','duration','rpe','notes'],
  },
  volleyball: {
    label:'Vóley', category:'Equipo', color:'#0369A1',
    icon:'assets/icons/running.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['Partido','Técnica','Físico','Sets','Entrenamiento'],
    fields:['team_result','duration','notes'],
  },

  // ── OUTDOOR / AVENTURA ────────────────────
  trail_running: {
    label:'Trail Running', category:'Outdoor', color:'#78350F',
    icon:'assets/icons/running.svg',
    metric:{ type:'distance', unit:'km' },
    sessionTypes:['Fondo','Vertical','Técnica','Carrera','Reconocimiento'],
    fields:['distance_km','duration','elevation','pace','hr_avg','notes'],
  },
  mtb: {
    label:'MTB', category:'Outdoor', color:'#713F12',
    icon:'assets/icons/cycling.svg',
    metric:{ type:'distance', unit:'km' },
    sessionTypes:['Fondo','Descenso','Técnica','XC','Enduro'],
    fields:['distance_km','duration','speed_avg','elevation','notes'],
  },
  climbing: {
    label:'Escalada', category:'Outdoor', color:'#9F1239',
    icon:'assets/icons/gym.svg',
    metric:{ type:'sessions', unit:'ses.' },
    sessionTypes:['Boulder','Vía','Técnica','Fuerza','Competencia'],
    fields:['duration','rpe','notes'],
  },
  kayak: {
    label:'Kayak', category:'Outdoor', color:'#0C4A6E',
    icon:'assets/icons/swimming.svg',
    metric:{ type:'distance', unit:'km' },
    sessionTypes:['Fondo','Técnica','Slalom','Surf','Competencia'],
    fields:['distance_km','duration','speed_avg','notes'],
  },
};

const SPORT_CATEGORIES = ['Resistencia','Acuático','Fuerza','Funcional','Combate','Equipo','Outdoor'];

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

const STORAGE_KEY      = 'ht-sessions-v1';
const STORAGE_PROFILE  = 'ht-profile-v1';

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */

let sessions       = [];
let profile        = null; // { name, role, sports:['running','gym',...] }
let currentSport   = null;
let formPattern    = null;
let formExercises  = [];
let formBlocks     = [];
let exCounter      = 0;
let expandedCards  = new Set();
let weekOffset     = 0;
let editingSessionId = null; // null = nueva sesión, número = editando

/* ═══════════════════════════════════════════
   STORAGE — Firebase Firestore
═══════════════════════════════════════════ */

async function loadSessions() {
  if (!currentUser) { sessions = []; return; }
  sessions = await fbLoadSessions(currentUser.uid);
}

async function saveSessions() {
  // No-op — cada sesión se guarda individualmente
}

async function loadProfile() {
  if (!currentUser) { profile = null; return; }
  profile = await fbLoadProfile(currentUser.uid);
}

async function saveProfile(p) {
  profile = p;
  if (currentUser) await fbSaveProfile(currentUser.uid, p);
}

/* ═══════════════════════════════════════════
   ONBOARDING — paso a paso
═══════════════════════════════════════════ */

let obStep = 0;
const OB_TOTAL = 5;

function obGoTo(step) {
  document.getElementById('ob-slide-' + obStep).classList.add('ob-slide-hidden');
  obStep = step;
  const slide = document.getElementById('ob-slide-' + obStep);
  slide.classList.remove('ob-slide-hidden');
  slide.classList.add('ob-slide-enter');
  setTimeout(() => slide.classList.remove('ob-slide-enter'), 300);

  // Renderizar grid de deportes cuando llega al paso 3
  if (obStep === 3) renderOnboardingSportGrid();

  // Personalizar paso final
  if (obStep === 4) {
    const name = document.getElementById('onboard-name')?.value.trim() || 'Atleta';
    document.getElementById('ob-ready-headline').textContent = `Todo listo, ${name}`;
  }

  document.querySelectorAll('.ob-dot').forEach((d, i) => {
    d.classList.toggle('active', i <= obStep);
  });

  document.getElementById('ob-back').style.visibility = obStep > 0 ? 'visible' : 'hidden';
  document.getElementById('ob-next').textContent = obStep === OB_TOTAL - 1 ? 'EMPEZAR' : 'CONTINUAR';
}

function obNext() {
  if (obStep === OB_TOTAL - 1) {
    confirmOnboarding();
    return;
  }
  // Validación mínima por paso
  if (obStep === 0) {
    const name = document.getElementById('onboard-name')?.value.trim();
    if (!name) {
      const inp = document.getElementById('onboard-name');
      inp.focus();
      inp.style.borderColor = '#EF4444';
      setTimeout(() => inp.style.borderColor = '', 1200);
      return;
    }
  }
  if (obStep === 3) {
    const selected = document.querySelectorAll('.onboard-sport-btn.selected').length;
    if (!selected) return;
  }
  obGoTo(obStep + 1);
}

function obPrev() {
  if (obStep > 0) obGoTo(obStep - 1);
}

function startOnboarding() {
  obStep = 0;
  showScreen('screen-onboarding');
  renderOnboardingSportGrid();
}

function renderOnboardingSportGrid() {
  const grid = document.getElementById('onboarding-sport-grid');
  const byCategory = {};
  Object.entries(SPORTS_DB).forEach(([id, sp]) => {
    if (!byCategory[sp.category]) byCategory[sp.category] = [];
    byCategory[sp.category].push({ id, ...sp });
  });

  let html = '';
  SPORT_CATEGORIES.forEach(cat => {
    if (!byCategory[cat]) return;
    html += `<div class="onboard-category-label">${cat}</div>
    <div class="onboard-sport-row">`;
    byCategory[cat].forEach(sp => {
      html += `<button type="button" class="onboard-sport-btn" data-sport="${sp.id}"
        onclick="toggleOnboardSport(this)"
        style="--sp-color:${sp.color}">
        <span class="onboard-sport-name">${sp.label}</span>
      </button>`;
    });
    html += `</div>`;
  });
  grid.innerHTML = html;
}

function toggleOnboardSport(btn) {
  btn.classList.toggle('selected');
}

function selectRole(btn, role) {
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

async function confirmOnboarding() {
  const name   = document.getElementById('onboard-name')?.value.trim() || 'Atleta';
  const age    = document.getElementById('onboard-age')?.value || null;
  const weight = document.getElementById('onboard-weight')?.value || null;
  const height = document.getElementById('onboard-height')?.value || null;
  const role   = document.querySelector('.role-btn.selected')?.dataset.role || 'athlete';
  const sports = [...document.querySelectorAll('.onboard-sport-btn.selected')].map(b => b.dataset.sport);

  saveProfile({ name, age, weight, height, role, sports: sports.length ? sports : Object.keys(SPORTS_DB) });
  document.getElementById('app-greeting').textContent = name;

  // Sacar onboarding — el CSS lo oculta cuando no tiene .active
  document.getElementById('screen-onboarding').classList.remove('active');
  document.getElementById('bottom-nav').style.display = 'flex';
  document.getElementById('fab').classList.remove('hidden');

  navTo('home');
}

/* ═══════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════ */

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    // Solo limpiar inline style si NO es el onboarding
    if (s.id !== 'screen-onboarding') s.style.display = '';
  });
  document.getElementById(id).classList.add('active');
  const fab = document.getElementById('fab');
  const hideOnScreens = ['screen-select-sport','screen-form','screen-onboarding'];
  fab.classList.toggle('hidden', hideOnScreens.includes(id));
  const nav = document.getElementById('bottom-nav');
  nav.style.display = id === 'screen-onboarding' ? 'none' : 'flex';
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
  const ms = mon.toLocaleDateString('es-AR', opts).replace('.','').toUpperCase();
  const ss = sun.toLocaleDateString('es-AR', opts).replace('.','').toUpperCase();
  return `${ms} — ${ss}`;
}

function weekPrev() { weekOffset -= 1; renderHome(); }
function weekNext() {
  if (weekOffset >= 0) return;
  weekOffset += 1;
  renderHome();
}

/* ═══════════════════════════════════════════
   RING
═══════════════════════════════════════════ */

function drawRing(weekSessions) {
  document.getElementById('ring-count').textContent = weekSessions.length;
  const arcsEl = document.getElementById('ring-arcs');
  arcsEl.innerHTML = '';
  if (!weekSessions.length) return;

  const cx = 60, cy = 60, r = 50, sw = 7;
  const total = weekSessions.length;
  const gap   = 0.06;
  let offset  = 0;

  const groups = {};
  weekSessions.forEach(s => { groups[s.sport] = (groups[s.sport] || 0) + 1; });

  Object.entries(groups).forEach(([sport, cnt]) => {
    const color    = SPORTS_DB[sport]?.color || '#888';
    const fraction = cnt / total;
    const angle    = fraction * Math.PI * 2 - gap;
    const sa       = offset + gap / 2 - Math.PI / 2;
    const ea       = sa + angle;
    const x1 = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea), y2 = cy + r * Math.sin(ea);
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
   HOME
═══════════════════════════════════════════ */

function renderHome() {
  const { mon, sun }  = getSelectedWeekBounds();
  const weekSessions  = getSelectedWeekSessions();
  const mySports      = profile?.sports || Object.keys(SPORTS_DB);

  document.getElementById('week-label').textContent = formatWeekLabel(mon, sun);
  document.getElementById('week-next').style.opacity = weekOffset >= 0 ? '0.3' : '1';
  document.getElementById('week-next').style.cursor  = weekOffset >= 0 ? 'default' : 'pointer';

  drawRing(weekSessions);

  // Volumen total semana — solo deportes con distancia, cada uno en su unidad
  let totalKmEquiv = 0;
  weekSessions.forEach(s => {
    const sp = SPORTS_DB[s.sport];
    if (!sp) return;
    if (sp.metric.type === 'distance') {
      const dist = parseFloat(s.distance_km || s.distance_m || 0);
      totalKmEquiv += sp.metric.unit === 'm' ? dist / 1000 : dist;
    }
  });
  document.getElementById('overview-volume-value').textContent =
    totalKmEquiv > 0 ? `${totalKmEquiv.toFixed(1)} km` : weekSessions.length > 0 ? `${weekSessions.length} ses.` : '—';

  // Stat rows — solo deportes del perfil que tengan sesiones esta semana
  const statList = document.getElementById('overview-stat-list');
  const activeSports = mySports.filter(key =>
    weekSessions.some(s => s.sport === key)
  );

  if (!activeSports.length) {
    statList.innerHTML = `<div class="stat-empty">Sin actividad esta semana</div>`;
  } else {
    statList.innerHTML = activeSports.map(key => {
      const sp   = SPORTS_DB[key]; if (!sp) return '';
      const wSes = weekSessions.filter(s => s.sport === key);
      let valueStr;
      if (sp.metric.type === 'distance') {
        const total = wSes.reduce((a,s) => a + (parseFloat(s.distance_km || s.distance_m || 0)), 0);
        valueStr = `${sp.metric.unit === 'km' ? total.toFixed(1) : total.toFixed(0)} ${sp.metric.unit}`;
      } else {
        valueStr = `${wSes.length} ses.`;
      }
      return `<div class="overview-stat-row">
        <div class="overview-stat-icon" style="background:${sp.color}22">
          <img src="${sp.icon}" alt="${sp.label}">
        </div>
        <div class="overview-stat-text">
          <span class="overview-stat-name" style="color:${sp.color}">${sp.label.toUpperCase()}</span>
          <span class="overview-stat-value">${valueStr}</span>
        </div>
      </div>`;
    }).join('');
  }

  renderSessionPreview();
}

function renderSessionPreview() {
  const container = document.getElementById('session-preview');
  const recent    = [...sessions].reverse().slice(0, 3);
  if (!recent.length) {
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
  if (!sessions.length) {
    container.innerHTML = `<div class="empty-state" style="padding-top:60px">
      <div class="empty-state-title">SIN SESIONES</div>
      <div class="empty-state-sub">Empezá a registrar tus actividades.</div>
    </div>`;
    return;
  }
  container.innerHTML = [...sessions].reverse().map(s => sessionCardHTML(s)).join('');
}

/* ═══════════════════════════════════════════
   SESSION CARD
═══════════════════════════════════════════ */

function sessionCardHTML(session) {
  const sp = SPORTS_DB[session.sport];
  if (!sp) return '';
  const isOpen = expandedCards.has(session.id);

  // Main value
  let mainValue = '—', detail = '';
  const durDisplay = session.duration_secs ? formatDurationDisplay(session.duration_secs) : (session.duration || '');
  if (sp.metric.type === 'distance') {
    const dist = parseFloat(session.distance_km || session.distance_m || 0);
    mainValue = dist > 0 ? `${sp.metric.unit === 'km' ? dist.toFixed(1) : dist.toFixed(0)} ${sp.metric.unit}` : '—';
    detail    = session.pace ? session.pace + ' /km' : (durDisplay ? durDisplay : '');
  } else if (session.sport === 'gym' || session.sport === 'calisthenics' || session.sport === 'powerlifting' || session.sport === 'weightlifting') {
    if (session.blocks?.length) {
      mainValue = session.blocks.map(b => PATTERNS.find(p => p.id === b.pattern)?.label.replace('\n',' ') || b.pattern).join(' + ');
      const totalEx = session.blocks.reduce((a, b) => a + (b.exercises?.length || 0), 0);
      detail = totalEx ? totalEx + ' ejercicios' : '';
    } else { mainValue = sp.label.toUpperCase(); }
  } else {
    mainValue = session.sessionType || sp.label.toUpperCase();
    detail    = durDisplay;
  }

  // Date
  const d         = new Date(session.date + 'T12:00:00');
  const today     = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
  const sd        = new Date(d); sd.setHours(0,0,0,0);
  let dateLabel   = sd.getTime() === today.getTime() ? 'Hoy'
                  : sd.getTime() === yesterday.getTime() ? 'Ayer'
                  : d.toLocaleDateString('es-AR', { day:'numeric', month:'short' });

  // Expanded body
  let bodyHTML = '';
  if (isOpen) {
    const basicFields = [
      ['distance_km','Distancia (km)'],['distance_m','Distancia (m)'],
      ['duration','Duración'],['pace','Pace'],['cadence','Cadencia'],
      ['hr_avg','FC avg'],['speed_avg','Vel. media'],['sets','Series'],
      ['stroke','Estilo'],['rpe','RPE'],['elevation','Desnivel'],
      ['combat_rounds','Rounds'],['combat_round_duration','Duración round'],
      ['team_result','Resultado'],['team_position','Posición'],
      ['cf_wod_name','WOD'],['cf_result','Resultado'],
      ['apnea_max_distance','Máx. sub. (m)'],['apnea_best_hold','Mejor apnea (s)'],
      ['apnea_sets','Series'],['apnea_recovery','Recuperación (s)'],['apnea_depth','Profundidad (m)'],
    ].filter(([k]) => session[k]);

    const fieldsHTML = basicFields.length
      ? `<div class="session-fields">${basicFields.map(([k,l]) =>
          `<div class="session-field"><div class="session-field-label">${l}</div><div class="session-field-value">${session[k]}</div></div>`
        ).join('')}</div>` : '';

    let exHTML = '';
    if (session.blocks?.length) {
      exHTML = session.blocks.map(block => {
        const patLabel = PATTERNS.find(p => p.id === block.pattern)?.label.replace('\n',' ') || block.pattern;
        return `<div class="exercises-block">
          <div class="exercises-block-title">${patLabel}</div>
          ${block.exercises.map(ex => `
          <div class="exercise-item">
            <div>
              <div class="exercise-item-name">${ex.name || 'Sin nombre'}</div>
              <div class="exercise-item-meta">${ex.sets||'?'} × ${ex.reps||'?'}${ex.weight ? ' · '+ex.weight+' kg':''}</div>
            </div>
            <div class="exercise-item-rest">${ex.rest ? ex.rest+'s':''}</div>
          </div>`).join('')}
        </div>`;
      }).join('');
    }

    const notesHTML = session.notes
      ? `<div class="session-notes"><div class="session-field-label">Notas</div><div class="session-notes-text">${session.notes}</div></div>` : '';

    // Triatlón — mostrar los tres segmentos
    let triathlonHTML = '';
    if (session.triathlon) {
      const t = session.triathlon;
      triathlonHTML = `
      <div class="exercises-block">
        <div class="exercises-block-title" style="color:#2D9CDB">NATACIÓN</div>
        <div class="session-fields">
          ${t.swim.distance_m ? `<div class="session-field"><div class="session-field-label">Distancia</div><div class="session-field-value">${t.swim.distance_m} m</div></div>` : ''}
          ${t.swim.time ? `<div class="session-field"><div class="session-field-label">Tiempo</div><div class="session-field-value">${t.swim.time}</div></div>` : ''}
        </div>
      </div>
      <div class="exercises-block">
        <div class="exercises-block-title" style="color:#F59E0B">CICLISMO</div>
        <div class="session-fields">
          ${t.bike.distance_km ? `<div class="session-field"><div class="session-field-label">Distancia</div><div class="session-field-value">${t.bike.distance_km} km</div></div>` : ''}
          ${t.bike.time ? `<div class="session-field"><div class="session-field-label">Tiempo</div><div class="session-field-value">${t.bike.time}</div></div>` : ''}
          ${t.bike.speed ? `<div class="session-field"><div class="session-field-label">Vel. media</div><div class="session-field-value">${t.bike.speed} km/h</div></div>` : ''}
        </div>
      </div>
      <div class="exercises-block">
        <div class="exercises-block-title" style="color:#E8633A">RUNNING</div>
        <div class="session-fields">
          ${t.run.distance_km ? `<div class="session-field"><div class="session-field-label">Distancia</div><div class="session-field-value">${t.run.distance_km} km</div></div>` : ''}
          ${t.run.time ? `<div class="session-field"><div class="session-field-label">Tiempo</div><div class="session-field-value">${t.run.time}</div></div>` : ''}
          ${t.run.pace ? `<div class="session-field"><div class="session-field-label">Pace</div><div class="session-field-value">${t.run.pace} /km</div></div>` : ''}
        </div>
      </div>`;
    }

    bodyHTML = `<div class="session-card-body open">
      ${fieldsHTML}${triathlonHTML}${exHTML}${notesHTML}
      <div class="session-card-actions">
        <button class="btn-edit-session" onclick="editSession(${session.id})">Editar</button>
        <button class="btn-delete-session" onclick="deleteSession(${session.id})">Eliminar</button>
      </div>
    </div>`;
  }

  return `<div class="session-card" id="card-${session.id}">
    <div class="session-card-header" onclick="toggleCard(${session.id})">
      <div class="session-icon-wrap" style="background:${sp.color}18">
        <img src="${sp.icon}" alt="${sp.label}">
      </div>
      <div class="session-meta">
        <div class="session-sport-name" style="color:${sp.color}">${sp.label.toUpperCase()}</div>
        <div class="session-main-value">${mainValue}</div>
        ${detail ? `<div class="session-detail">${detail}</div>` : ''}
      </div>
      <div class="session-date">${dateLabel}</div>
    </div>
    ${bodyHTML}
  </div>`;
}

function toggleCard(id) {
  if (expandedCards.has(id)) expandedCards.delete(id);
  else expandedCards.add(id);
  const card    = document.getElementById('card-' + id);
  const session = sessions.find(s => s.id === id);
  if (card && session) card.outerHTML = sessionCardHTML(session);
}

async function deleteSession(id) {
  if (!confirm('¿Eliminás esta sesión?')) return;
  sessions = sessions.filter(s => s.id !== id);
  if (currentUser) await fbDeleteSession(currentUser.uid, id);
  expandedCards.delete(id);
  renderHome();
  renderHistory();
}

function editSession(id) {
  const session = sessions.find(s => s.id === id);
  if (!session) return;

  editingSessionId = id;
  currentSport     = session.sport;
  formPattern      = null;
  formExercises    = [];
  formBlocks       = session.blocks || [];
  exCounter        = 0;

  const sp = SPORTS_DB[session.sport];
  document.getElementById('form-sport-icon').src          = sp.icon;
  document.getElementById('form-sport-title').textContent = sp.label.toUpperCase();

  renderFormBody();

  // Pre-llenar campos con los datos de la sesión
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
  };

  setVal('f-date',           session.date);
  setVal('f-sessionType',    session.sessionType);
  setVal('f-distance_km',    session.distance_km);
  setVal('f-distance_m',     session.distance_m);
  setVal('f-duration',       session.duration);
  setVal('f-pace',           session.pace);
  setVal('f-cadence',        session.cadence);
  setVal('f-hr_avg',         session.hr_avg);
  setVal('f-speed_avg',      session.speed_avg);
  setVal('f-elevation',      session.elevation);
  setVal('f-sets',           session.sets);
  setVal('f-stroke',         session.stroke);
  setVal('f-rpe',            session.rpe);
  setVal('f-combat_rounds',  session.combat_rounds);
  setVal('f-combat_round_duration', session.combat_round_duration);
  setVal('f-team_result',    session.team_result);
  setVal('f-team_position',  session.team_position);
  setVal('f-cf_wod_name',    session.cf_wod_name);
  setVal('f-cf_result',      session.cf_result);
  setVal('f-apnea_max_distance', session.apnea_max_distance);
  setVal('f-apnea_best_hold',    session.apnea_best_hold);
  setVal('f-apnea_sets',         session.apnea_sets);
  setVal('f-apnea_recovery',     session.apnea_recovery);
  setVal('f-apnea_depth',        session.apnea_depth);
  setVal('f-notes',          session.notes);

  // Triatlón
  if (session.triathlon) {
    setVal('f-tri_swim_dist',  session.triathlon.swim?.distance_m);
    setVal('f-tri_swim_time',  session.triathlon.swim?.time);
    setVal('f-tri_bike_dist',  session.triathlon.bike?.distance_km);
    setVal('f-tri_bike_time',  session.triathlon.bike?.time);
    setVal('f-tri_bike_speed', session.triathlon.bike?.speed);
    setVal('f-tri_run_dist',   session.triathlon.run?.distance_km);
    setVal('f-tri_run_time',   session.triathlon.run?.time);
    setVal('f-tri_run_pace',   session.triathlon.run?.pace);
  }

  // Mostrar badge "Editando"
  const header = document.querySelector('.form-header-sport');
  if (header && !header.querySelector('.edit-badge')) {
    const badge = document.createElement('span');
    badge.className = 'edit-badge';
    badge.textContent = 'EDITANDO';
    header.appendChild(badge);
  }

  // Cambiar texto del botón guardar
  document.querySelector('.btn-save').textContent = 'GUARDAR CAMBIOS';

  showScreen('screen-form');
}

/* ═══════════════════════════════════════════
   SPORT SELECTION (pantalla + )
═══════════════════════════════════════════ */

function renderSportSelectScreen() {
  const mySports = profile?.sports || Object.keys(SPORTS_DB);
  const list = document.getElementById('sport-list');

  const byCategory = {};
  mySports.forEach(id => {
    const sp = SPORTS_DB[id]; if (!sp) return;
    if (!byCategory[sp.category]) byCategory[sp.category] = [];
    byCategory[sp.category].push({ id, ...sp });
  });

  let html = '';
  SPORT_CATEGORIES.forEach(cat => {
    if (!byCategory[cat]) return;
    html += `<div class="sport-list-category">${cat}</div>`;
    byCategory[cat].forEach(sp => {
      html += `<button class="sport-row-btn" onclick="openSportForm('${sp.id}')">
        <span class="sport-row-icon" style="background:${sp.color}18">
          <img src="${sp.icon}" alt="${sp.label}">
        </span>
        <span class="sport-row-name">${sp.label.toUpperCase()}</span>
        <svg class="sport-row-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>`;
    });
  });
  list.innerHTML = html;
}

/* ═══════════════════════════════════════════
   SPORT FORM
═══════════════════════════════════════════ */

function openSportForm(sport) {
  currentSport     = sport;
  formPattern      = null;
  formExercises    = [];
  formBlocks       = [];
  exCounter        = 0;
  editingSessionId = null;

  const sp = SPORTS_DB[sport];
  document.getElementById('form-sport-icon').src          = sp.icon;
  document.getElementById('form-sport-title').textContent = sp.label.toUpperCase();

  renderFormBody();
  showScreen('screen-form');
}

function renderFormBody() {
  const sp    = SPORTS_DB[currentSport];
  const body  = document.getElementById('form-body');
  const today = new Date().toISOString().slice(0,10);

  const sessionTypeHTML = sp.sessionTypes?.length ? `
  <div class="form-section">
    <div class="form-section-title">Tipo de sesión</div>
    <select class="form-input" id="f-sessionType">
      <option value="">— elegir —</option>
      ${sp.sessionTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
    </select>
  </div>` : '';

  const specificHTML = buildSpecificFields(sp.fields || []);

  body.innerHTML = `
  <div class="form-section">
    <div class="form-section-title">Fecha</div>
    <input type="date" class="form-input" id="f-date" value="${today}">
  </div>
  ${sessionTypeHTML}
  ${specificHTML}`;

  if (sp.fields?.includes('blocks')) {
    renderExercisesDOM();
    updatePatternButtons();
    updateAddBlockBtn();
  }
  attachAutocalc();
}

function buildSpecificFields(fields) {
  let html = '';

  const sections = {
    distance_km: () => `<div class="form-field"><label class="form-label">Distancia (km)</label><input type="number" step="0.1" class="form-input" id="f-distance_km" placeholder="10.0"></div>`,
    distance_m:  () => `<div class="form-field"><label class="form-label">Distancia (m)</label><input type="number" step="50" class="form-input" id="f-distance_m" placeholder="2000"></div>`,
    duration:    () => `<div class="form-field"><label class="form-label">Duración</label><input type="text" class="form-input" id="f-duration" placeholder="00:00:00" maxlength="8" oninput="formatTimeInput(this)"></div>`,
    pace:        () => `<div class="form-field"><label class="form-label">Pace <span class="form-label-auto">(auto)</span></label><input type="text" class="form-input form-input-auto" id="f-pace" placeholder="5:30" readonly></div>`,
    cadence:     () => `<div class="form-field"><label class="form-label">Cadencia (spm)</label><input type="number" class="form-input" id="f-cadence" placeholder="175"></div>`,
    hr_avg:      () => `<div class="form-field"><label class="form-label">FC promedio (bpm)</label><input type="number" class="form-input" id="f-hr_avg" placeholder="150"></div>`,
    speed_avg:   () => `<div class="form-field"><label class="form-label">Vel. media (km/h)</label><input type="number" step="0.1" class="form-input" id="f-speed_avg" placeholder="26.5"></div>`,
    elevation:   () => `<div class="form-field"><label class="form-label">Desnivel (m)</label><input type="number" class="form-input" id="f-elevation" placeholder="450"></div>`,
    sets:        () => `<div class="form-field"><label class="form-label">Series</label><input type="number" class="form-input" id="f-sets" placeholder="8"></div>`,
    stroke:      () => `<div class="form-field"><label class="form-label">Estilo</label><select class="form-input" id="f-stroke"><option value="">— elegir —</option>${['Libre','Pecho','Espalda','Mariposa','Mixto'].map(o=>`<option>${o}</option>`).join('')}</select></div>`,
    rpe:         () => `<div class="form-field"><label class="form-label">RPE (1–10)</label><input type="number" step="0.5" min="1" max="10" class="form-input" id="f-rpe" placeholder="7"></div>`,
    combat_rounds: () => `<div class="form-field"><label class="form-label">Rounds</label><input type="number" class="form-input" id="f-combat_rounds" placeholder="6"></div>`,
    combat_round_duration: () => `<div class="form-field"><label class="form-label">Duración de round (min)</label><input type="number" class="form-input" id="f-combat_round_duration" placeholder="3"></div>`,
    team_result: () => `<div class="form-field"><label class="form-label">Resultado</label><input type="text" class="form-input" id="f-team_result" placeholder="Victoria / Derrota / Empate"></div>`,
    team_position: () => `<div class="form-field"><label class="form-label">Posición / Rol</label><input type="text" class="form-input" id="f-team_position" placeholder="Delantero, Base..."></div>`,
    cf_wod_name: () => `<div class="form-field"><label class="form-label">Nombre del WOD</label><input type="text" class="form-input" id="f-cf_wod_name" placeholder="Fran, Cindy..."></div>`,
    cf_result:   () => `<div class="form-field"><label class="form-label">Resultado / Tiempo</label><input type="text" class="form-input" id="f-cf_result" placeholder="12:34 / 15 rondas"></div>`,
    apnea_max_distance: () => `<div class="form-field"><label class="form-label">Máx. distancia sub. (m)</label><input type="number" class="form-input" id="f-apnea_max_distance" placeholder="35"></div>`,
    apnea_best_hold:    () => `<div class="form-field"><label class="form-label">Mejor apnea estática (seg)</label><input type="number" class="form-input" id="f-apnea_best_hold" placeholder="120"></div>`,
    apnea_sets:         () => `<div class="form-field"><label class="form-label">Series / Repeticiones</label><input type="number" class="form-input" id="f-apnea_sets" placeholder="6"></div>`,
    apnea_recovery:     () => `<div class="form-field"><label class="form-label">Recuperación (seg)</label><input type="number" class="form-input" id="f-apnea_recovery" placeholder="120"></div>`,
    apnea_depth:        () => `<div class="form-field"><label class="form-label">Profundidad (m)</label><input type="number" class="form-input" id="f-apnea_depth" placeholder="10"></div>`,
  };

  // Group distance + duration in a row, others in rows of 2
  const distanceFields   = fields.filter(f => ['distance_km','distance_m'].includes(f));
  const physiologyFields = fields.filter(f => ['hr_avg','cadence','speed_avg','elevation'].includes(f));
  const blockFields      = fields.filter(f => f === 'blocks');
  const combatFields     = fields.filter(f => f.startsWith('combat_'));
  const teamFields       = fields.filter(f => f.startsWith('team_'));
  const cfFields         = fields.filter(f => f.startsWith('cf_'));
  const apneaFields      = fields.filter(f => f.startsWith('apnea_'));
  const hasDuration      = fields.includes('duration');
  const hasPace          = fields.includes('pace');
  const hasRpe           = fields.includes('rpe');
  const hasSets          = fields.includes('sets');
  const hasStroke        = fields.includes('stroke');

  // Volume section
  if (distanceFields.length || hasDuration) {
    html += `<div class="form-section"><div class="form-section-title">Volumen</div>`;
    const volFields = [...distanceFields, hasDuration ? 'duration' : null].filter(Boolean);
    html += `<div class="form-row">${volFields.map(f => sections[f]?.() || '').join('')}</div>`;
    if (hasPace || hasSets) {
      html += `<div class="form-row" style="margin-top:10px">`;
      if (hasPace) html += sections.pace();
      if (hasSets) html += sections.sets();
      if (hasStroke) html += sections.stroke();
      html += `</div>`;
    }
    html += `</div>`;
  }

  // Physiology
  if (physiologyFields.length) {
    html += `<div class="form-section"><div class="form-section-title">Fisiología</div><div class="form-row">`;
    html += physiologyFields.map(f => sections[f]?.() || '').join('');
    html += `</div></div>`;
  }

  // Blocks (gym)
  if (blockFields.length) {
    html += `<div class="form-section">
      <div class="form-section-title">Bloques de la sesión</div>
      <div id="blocks-confirmed">${renderConfirmedBlocksHTML()}</div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Patrón de movimiento</div>
      <div class="pattern-grid" id="pattern-grid">
        ${PATTERNS.map(p => `<button type="button" class="pattern-btn" data-pattern="${p.id}" onclick="selectPattern('${p.id}')">${p.label}</button>`).join('')}
      </div>
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
    </div>`;
    if (hasRpe || hasDuration) {
      html += `<div class="form-section"><div class="form-section-title">General</div><div class="form-row">`;
      if (hasDuration) html += sections.duration();
      if (hasRpe) html += sections.rpe();
      html += `</div></div>`;
    }
  }

  // Combat
  if (combatFields.length) {
    html += `<div class="form-section"><div class="form-section-title">Combate</div><div class="form-row">`;
    html += combatFields.map(f => sections[f]?.() || '').join('');
    if (hasDuration) html += sections.duration();
    if (hasRpe) html += sections.rpe();
    html += `</div></div>`;
  }

  // Team sports
  if (teamFields.length) {
    html += `<div class="form-section"><div class="form-section-title">Partido</div>`;
    html += teamFields.map(f => sections[f]?.() || '').join('');
    if (hasDuration) html += sections.duration();
    html += `</div>`;
  }

  // CrossFit
  if (cfFields.length) {
    html += `<div class="form-section"><div class="form-section-title">WOD</div>`;
    html += cfFields.map(f => sections[f]?.() || '').join('');
    if (hasDuration) html += sections.duration();
    if (hasRpe) html += sections.rpe();
    html += `</div>`;
  }

  // Apnea
  if (apneaFields.length) {
    html += `<div class="form-section"><div class="form-section-title">Apnea</div><div class="form-row">`;
    html += apneaFields.slice(0,2).map(f => sections[f]?.() || '').join('');
    html += `</div><div class="form-row" style="margin-top:10px">`;
    html += apneaFields.slice(2).map(f => sections[f]?.() || '').join('');
    html += `</div></div>`;
    if (hasDuration) {
      html += `<div class="form-section"><div class="form-section-title">General</div>${sections.duration()}</div>`;
    }
  }

  // Triatlón — tres secciones separadas
  if (fields.includes('triathlon')) {
    html += `
    <div class="form-section">
      <div class="form-section-title">Natación</div>
      <div class="form-row">
        <div class="form-field"><label class="form-label">Distancia (m)</label><input type="number" step="50" class="form-input" id="f-tri_swim_dist" placeholder="1500"></div>
        <div class="form-field"><label class="form-label">Tiempo</label><input type="text" class="form-input" id="f-tri_swim_time" placeholder="00:25:00" maxlength="8" oninput="formatTimeInput(this)"></div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Ciclismo</div>
      <div class="form-row">
        <div class="form-field"><label class="form-label">Distancia (km)</label><input type="number" step="0.1" class="form-input" id="f-tri_bike_dist" placeholder="40.0"></div>
        <div class="form-field"><label class="form-label">Tiempo</label><input type="text" class="form-input" id="f-tri_bike_time" placeholder="01:00:00" maxlength="8" oninput="formatTimeInput(this)"></div>
      </div>
      <div class="form-field" style="margin-top:8px"><label class="form-label">Vel. media (km/h) <span class="form-label-auto">(auto)</span></label><input type="text" class="form-input form-input-auto" id="f-tri_bike_speed" placeholder="—" readonly></div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Running</div>
      <div class="form-row">
        <div class="form-field"><label class="form-label">Distancia (km)</label><input type="number" step="0.1" class="form-input" id="f-tri_run_dist" placeholder="10.0"></div>
        <div class="form-field"><label class="form-label">Tiempo</label><input type="text" class="form-input" id="f-tri_run_time" placeholder="00:50:00" maxlength="8" oninput="formatTimeInput(this)"></div>
      </div>
      <div class="form-field" style="margin-top:8px"><label class="form-label">Pace <span class="form-label-auto">(auto)</span></label><input type="text" class="form-input form-input-auto" id="f-tri_run_pace" placeholder="—" readonly></div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Tiempo total</div>
      <div class="form-field"><label class="form-label">Tiempo total (incluyendo transiciones)</label><input type="text" class="form-input" id="f-duration" placeholder="02:30:00" maxlength="8" oninput="formatTimeInput(this)"></div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Fisiología</div>
      <div class="form-field"><label class="form-label">FC promedio (bpm)</label><input type="number" class="form-input" id="f-hr_avg" placeholder="155"></div>
    </div>`;
  }

  // Notes always last
  html += `<div class="form-section"><div class="form-section-title">Notas</div>
    <textarea class="form-input" id="f-notes" placeholder="Sensaciones, observaciones..." rows="3"></textarea>
  </div>`;

  return html;
}

/* ─── Time input hh:mm:ss ───────────────── */

function formatTimeInput(input) {
  // Solo deja números y agrega los : automáticamente
  let v = input.value.replace(/[^\d]/g, '');
  if (v.length > 6) v = v.slice(0, 6);
  let formatted = '';
  if (v.length <= 2) {
    formatted = v;
  } else if (v.length <= 4) {
    formatted = v.slice(0,2) + ':' + v.slice(2);
  } else {
    formatted = v.slice(0,2) + ':' + v.slice(2,4) + ':' + v.slice(4);
  }
  input.value = formatted;
}

// Convierte "01:30:00" → 5400 segundos
function parseDurationToSeconds(str) {
  if (!str) return null;
  const parts = str.split(':').map(Number);
  if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
  if (parts.length === 2) return parts[0]*60 + parts[1];
  return Number(str) * 60 || null; // fallback: si es número solo, asume minutos
}

// Convierte 5400 segundos → "01:30:00"
function formatSecondsToTime(secs) {
  if (!secs) return '';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// Para mostrar en cards: "1h 30min" o "45min"
function formatDurationDisplay(secs) {
  if (!secs) return '';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m > 0 ? m + 'min' : ''}`.trim();
  return `${m}min`;
}
function attachAutocalc() {
  const distKmEl  = document.getElementById('f-distance_km');
  const distMEl   = document.getElementById('f-distance_m');
  const durEl     = document.getElementById('f-duration');
  const paceEl    = document.getElementById('f-pace');
  const speedEl   = document.getElementById('f-speed_avg');

  if (!durEl) return;

  function calc() {
    const secs  = parseDurationToSeconds(durEl.value);
    const hours = secs / 3600;

    // Running, Trail Running, Caminata, Triatlón → pace min/km
    if (distKmEl && paceEl) {
      const dist = parseFloat(distKmEl.value);
      if (dist > 0 && secs > 0) {
        const secPerKm = secs / dist;
        paceEl.value = `${Math.floor(secPerKm/60)}:${String(Math.round(secPerKm%60)).padStart(2,'0')}`;
      }
    }

    // Ciclismo, Kayak → velocidad media km/h
    if (distKmEl && speedEl) {
      const dist = parseFloat(distKmEl.value);
      if (dist > 0 && hours > 0) {
        speedEl.value = (dist / hours).toFixed(1);
      }
    }

    // Natación → pace cada 100m (mm:ss /100m)
    if (distMEl && paceEl) {
      const distM = parseFloat(distMEl.value);
      if (distM > 0 && secs > 0) {
        const secPer100 = (secs / distM) * 100;
        paceEl.value = `${Math.floor(secPer100/60)}:${String(Math.round(secPer100%60)).padStart(2,'0')}`;
      }
    }
  }

  if (distKmEl) distKmEl.addEventListener('input', calc);
  if (distMEl)  distMEl.addEventListener('input',  calc);
  durEl.addEventListener('input', calc);

  // Triatlón — velocidad bici y pace run
  const triBikeDist  = document.getElementById('f-tri_bike_dist');
  const triBikeTime  = document.getElementById('f-tri_bike_time');
  const triBikeSpeed = document.getElementById('f-tri_bike_speed');
  const triRunDist   = document.getElementById('f-tri_run_dist');
  const triRunTime   = document.getElementById('f-tri_run_time');
  const triRunPace   = document.getElementById('f-tri_run_pace');

  if (triBikeDist && triBikeTime && triBikeSpeed) {
    function calcBike() {
      const dist = parseFloat(triBikeDist.value);
      const secs = parseDurationToSeconds(triBikeTime.value);
      if (dist > 0 && secs > 0) triBikeSpeed.value = (dist / (secs/3600)).toFixed(1);
    }
    triBikeDist.addEventListener('input', calcBike);
    triBikeTime.addEventListener('input', calcBike);
  }

  if (triRunDist && triRunTime && triRunPace) {
    function calcRun() {
      const dist = parseFloat(triRunDist.value);
      const secs = parseDurationToSeconds(triRunTime.value);
      if (dist > 0 && secs > 0) {
        const secPerKm = secs / dist;
        triRunPace.value = `${Math.floor(secPerKm/60)}:${String(Math.round(secPerKm%60)).padStart(2,'0')}`;
      }
    }
    triRunDist.addEventListener('input', calcRun);
    triRunTime.addEventListener('input', calcRun);
  }
}

/* ─── Pattern / Blocks ─── */
function selectPattern(id) {
  formPattern = id;
  updatePatternButtons();
  updateAddBlockBtn();
}
function updatePatternButtons() {
  document.querySelectorAll('.pattern-btn').forEach(b => b.classList.toggle('selected', b.dataset.pattern === formPattern));
}
function updateAddBlockBtn() {
  const btn = document.getElementById('btn-add-block');
  if (!btn) return;
  btn.disabled = !(formPattern && formExercises.some(e => e.name || e.sets || e.reps));
}
function confirmBlock() {
  if (!formPattern) return;
  const valid = formExercises.filter(e => e.name || e.sets || e.reps);
  if (!valid.length) return;
  formBlocks.push({ pattern: formPattern, exercises: valid });
  formPattern = null; formExercises = [];
  document.getElementById('blocks-confirmed').innerHTML = renderConfirmedBlocksHTML();
  updatePatternButtons(); renderExercisesDOM(); updateAddBlockBtn();
}
function removeBlock(i) {
  formBlocks.splice(i, 1);
  document.getElementById('blocks-confirmed').innerHTML = renderConfirmedBlocksHTML();
}
function renderConfirmedBlocksHTML() {
  if (!formBlocks.length) return `<div class="blocks-empty">Seleccioná un patrón, agregá ejercicios y tocá "Agregar patrón a la sesión".</div>`;
  return formBlocks.map((b, i) => {
    const label = PATTERNS.find(p => p.id === b.pattern)?.label.replace('\n',' ') || b.pattern;
    return `<div class="block-confirmed-card">
      <div class="block-confirmed-header">
        <span class="block-confirmed-label">${label}</span>
        <button type="button" class="btn-remove-block" onclick="removeBlock(${i})">×</button>
      </div>
      <div class="block-confirmed-exercises">
        ${b.exercises.map(ex => `<span class="block-ex-chip">${ex.name || 'Ejercicio'} · ${ex.sets||'?'}×${ex.reps||'?'}</span>`).join('')}
      </div>
    </div>`;
  }).join('');
}

/* ─── Exercise builder ─── */
function addExercise() {
  formExercises.push({ _id:'ex'+(++exCounter), name:'', sets:'', reps:'', weight:'', rest:'' });
  renderExercisesDOM(); updateAddBlockBtn();
}
function removeExercise(id) {
  formExercises = formExercises.filter(e => e._id !== id);
  renderExercisesDOM(); updateAddBlockBtn();
}
function updateExField(id, field, val) {
  const ex = formExercises.find(e => e._id === id);
  if (ex) ex[field] = val;
  updateAddBlockBtn();
}
function renderExercisesDOM() {
  const c = document.getElementById('exercises-dom'); if (!c) return;
  if (!formExercises.length) { c.innerHTML = ''; return; }
  c.innerHTML = formExercises.map(ex => `
  <div class="exercise-entry" id="entry-${ex._id}">
    <button type="button" class="btn-remove-ex" onclick="removeExercise('${ex._id}')">×</button>
    <input class="ex-name-input" type="text" placeholder="Nombre del ejercicio" value="${ex.name}"
      oninput="updateExField('${ex._id}','name',this.value)">
    <div class="ex-row">
      <div class="ex-field-wrap"><span class="ex-field-label">Series</span>
        <input class="ex-mini-input" type="number" min="1" value="${ex.sets}" placeholder="4" oninput="updateExField('${ex._id}','sets',this.value)"></div>
      <div class="ex-field-wrap"><span class="ex-field-label">Reps</span>
        <input class="ex-mini-input" type="text" value="${ex.reps}" placeholder="8–12" oninput="updateExField('${ex._id}','reps',this.value)"></div>
      <div class="ex-field-wrap"><span class="ex-field-label">Carga (kg)</span>
        <input class="ex-mini-input" type="number" step="0.5" value="${ex.weight}" placeholder="—" oninput="updateExField('${ex._id}','weight',this.value)"></div>
      <div class="ex-field-wrap"><span class="ex-field-label">Desc. (s)</span>
        <input class="ex-mini-input" type="number" value="${ex.rest}" placeholder="90" oninput="updateExField('${ex._id}','rest',this.value)"></div>
    </div>
  </div>`).join('');
}

/* ─── Save session ─── */
async function saveSession() {
  if (!currentSport) return;
  const sp = SPORTS_DB[currentSport];

  const session = {
    id: Date.now(), sport: currentSport,
    date: document.getElementById('f-date')?.value || new Date().toISOString().slice(0,10),
    createdAt: new Date().toISOString(),
  };

  // sessionType
  const stEl = document.getElementById('f-sessionType');
  if (stEl?.value) session.sessionType = stEl.value;

  // Todos los campos menos duration (que tiene tratamiento especial)
  const allFields = [
    'distance_km','distance_m','pace','cadence','hr_avg','speed_avg',
    'elevation','sets','stroke','rpe','combat_rounds','combat_round_duration',
    'team_result','team_position','cf_wod_name','cf_result',
    'apnea_max_distance','apnea_best_hold','apnea_sets','apnea_recovery','apnea_depth',
    'notes'
  ];
  allFields.forEach(f => {
    const el = document.getElementById('f-' + f);
    if (el?.value) session[f] = el.value;
  });

  // Duración — guardar en segundos
  const durEl = document.getElementById('f-duration');
  if (durEl?.value) {
    session.duration_secs = parseDurationToSeconds(durEl.value);
    session.duration = durEl.value; // guardar el string también para mostrar
  }

  // Gym blocks
  if (sp.fields?.includes('blocks')) {
    const inProgress = formExercises.filter(e => e.name || e.sets || e.reps);
    if (formPattern && inProgress.length) formBlocks.push({ pattern: formPattern, exercises: inProgress });
    session.blocks = formBlocks;
  }

  // Triatlón — guardar los tres segmentos
  if (sp.fields?.includes('triathlon')) {
    const swimDist = document.getElementById('f-tri_swim_dist')?.value;
    const swimTime = document.getElementById('f-tri_swim_time')?.value;
    const bikeDist = document.getElementById('f-tri_bike_dist')?.value;
    const bikeTime = document.getElementById('f-tri_bike_time')?.value;
    const bikeSpeed = document.getElementById('f-tri_bike_speed')?.value;
    const runDist  = document.getElementById('f-tri_run_dist')?.value;
    const runTime  = document.getElementById('f-tri_run_time')?.value;
    const runPace  = document.getElementById('f-tri_run_pace')?.value;

    session.triathlon = {
      swim: { distance_m: swimDist, time: swimTime, secs: parseDurationToSeconds(swimTime) },
      bike: { distance_km: bikeDist, time: bikeTime, secs: parseDurationToSeconds(bikeTime), speed: bikeSpeed },
      run:  { distance_km: runDist,  time: runTime,  secs: parseDurationToSeconds(runTime),  pace: runPace  },
    };
  }

  // Si estamos editando, reemplazamos — si es nueva, agregamos
  if (editingSessionId !== null) {
    const idx = sessions.findIndex(s => s.id === editingSessionId);
    if (idx !== -1) {
      session.id = editingSessionId;
      session.createdAt = sessions[idx].createdAt;
      sessions[idx] = session;
    }
    if (currentUser) await fbUpdateSession(currentUser.uid, session);
    editingSessionId = null;
  } else {
    sessions.push(session);
    if (currentUser) await fbSaveSession(currentUser.uid, session);
  }

  expandedCards.clear();
  weekOffset = 0;
  renderHome();
  renderHistory();
  navTo('home');
}

/* ═══════════════════════════════════════════
   AUTH HANDLERS
═══════════════════════════════════════════ */

function switchAuthTab(tab) {
  document.getElementById('auth-form-login').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('auth-form-register').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active',    tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}

async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  errEl.textContent = '';
  try {
    await fbLogin(email, password);
  } catch (e) {
    errEl.textContent = authErrorMessage(e.code);
  }
}

async function handleRegister() {
  const email    = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const errEl    = document.getElementById('register-error');
  errEl.textContent = '';
  try {
    await fbRegister(email, password);
  } catch (e) {
    errEl.textContent = authErrorMessage(e.code);
  }
}

function authErrorMessage(code) {
  const msgs = {
    'auth/invalid-email':          'Email inválido.',
    'auth/user-not-found':         'No existe una cuenta con ese email.',
    'auth/wrong-password':         'Contraseña incorrecta.',
    'auth/email-already-in-use':   'Ya existe una cuenta con ese email.',
    'auth/weak-password':          'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests':      'Demasiados intentos. Esperá un momento.',
    'auth/invalid-credential':     'Email o contraseña incorrectos.',
  };
  return msgs[code] || 'Ocurrió un error. Intentá de nuevo.';
}

async function handleLogout() {
  await fbLogout();
}

/* ═══════════════════════════════════════════
   INIT — Firebase Auth Observer
═══════════════════════════════════════════ */

// Hacer funciones globales para los onclick del HTML
window.switchAuthTab  = switchAuthTab;
window.handleLogin    = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout   = handleLogout;
window.navTo          = navTo;
window.showScreen     = showScreen;
window.openSportForm  = openSportForm;
window.saveSession    = saveSession;
window.toggleCard     = toggleCard;
window.deleteSession  = deleteSession;
window.editSession    = editSession;
window.obNext         = obNext;
window.obPrev         = obPrev;
window.selectRole     = selectRole;
window.toggleOnboardSport  = toggleOnboardSport;
window.confirmOnboarding   = confirmOnboarding;
window.selectPattern       = selectPattern;
window.addExercise         = addExercise;
window.removeExercise      = removeExercise;
window.updateExField       = updateExField;
window.confirmBlock        = confirmBlock;
window.removeBlock         = removeBlock;
window.formatTimeInput     = formatTimeInput;
window.renderSportSelectScreen = renderSportSelectScreen;
window.weekPrev            = weekPrev;
window.weekNext            = weekNext;

fbOnAuthChange(async (user) => {
  currentUser = user;

  if (!user) {
    // No logueado — mostrar pantalla de auth
    document.getElementById('screen-auth').style.display = 'flex';
    document.getElementById('bottom-nav').style.display  = 'none';
    document.getElementById('fab').classList.add('hidden');
    document.querySelectorAll('.screen:not(#screen-auth)').forEach(s => {
      s.classList.remove('active');
      s.style.display = '';
    });
    document.getElementById('screen-auth').classList.add('active');
    return;
  }

  // Logueado — cargar datos y mostrar app
  document.getElementById('screen-auth').style.display = 'none';
  document.getElementById('screen-auth').classList.remove('active');

  await loadProfile();
  await loadSessions();

  if (!profile) {
    showScreen('screen-onboarding');
  } else {
    document.getElementById('app-greeting').textContent = profile.name || '';
    navTo('home');
  }

  // Event listeners
  document.getElementById('btn-ver-todo').addEventListener('click', () => navTo('history'));
  document.getElementById('week-prev').addEventListener('click', weekPrev);
  document.getElementById('week-next').addEventListener('click', weekNext);
  document.getElementById('fab').addEventListener('click', () => {
    renderSportSelectScreen();
    showScreen('screen-select-sport');
  });
});
