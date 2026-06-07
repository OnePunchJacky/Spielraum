import { useState, useEffect, useRef, useCallback } from "react";
import { useRegisterSW } from 'virtual:pwa-register/react';

// ─── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Lora:ital,wght@0,400;0,500;1,400&family=Courier+Prime:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { height: 100%; }
  body {
    background: #EAE4D8;
    color: #1E1916;
    font-family: 'Lora', Georgia, serif;
    -webkit-font-smoothing: antialiased;
    height: 100%;
  }
  #root { height: 100%; }

  .app {
    max-width: 400px; margin: 0 auto; min-height: 100vh;
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    background: #F5F0E6;
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent 27px,
      rgba(170,155,130,0.16) 27px,
      rgba(170,155,130,0.16) 28px
    );
    transition: padding-top 0.2s;
    box-shadow: 0 0 60px rgba(80,55,20,0.1);
  }
  .app.has-banner { padding-top: calc(env(safe-area-inset-top, 0px) + 48px); }

  /* PWA Banners */
  .pwa-banner {
    position: fixed; top: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 400px;
    padding: calc(env(safe-area-inset-top, 0px) + 10px) 14px 10px;
    display: flex; align-items: center; gap: 10px; z-index: 300;
  }
  .pwa-banner.install { background: #F5F0E6; border-bottom: 1px solid #D4C8B4; }
  .pwa-banner.update  { background: #EDF3EE; border-bottom: 1px solid #3A724830; }
  .pwa-banner-ico  { font-size: 16px; flex-shrink: 0; }
  .pwa-banner-text { flex: 1; font-size: 11px; color: #7A6A58; line-height: 1.4; font-family: 'Lora', serif; }
  .pwa-banner-text strong { color: #1E1916; }
  .pwa-banner-actions { display: flex; gap: 6px; flex-shrink: 0; }
  .pwa-btn { padding: 5px 12px; border-radius: 5px; font-family: 'Caveat', cursive; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .pwa-btn.amber { background: #A8721A; color: #FDFCF8; border: none; }
  .pwa-btn.amber:hover { background: #BA8220; }
  .pwa-btn.green { background: #3A7248; color: #FDFCF8; border: none; }
  .pwa-btn.green:hover { background: #44845A; }
  .pwa-btn.ghost { background: transparent; color: #9A8B78; border: 1px solid #D0C4B0; }
  .pwa-btn.ghost:hover { color: #5A4E3C; }

  /* Header */
  .header { padding: calc(env(safe-area-inset-top, 20px) + 20px) 20px 0; }
  .header-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; }
  .logo { font-family: 'Caveat', cursive; font-size: 30px; font-weight: 700; color: #1E1916; letter-spacing: 0; }
  .logo em { color: #3A7248; font-style: italic; }
  .header-right { display: flex; align-items: center; gap: 8px; }
  .date-pill { font-family: 'Courier Prime', monospace; font-size: 10px; color: #9A8B78; background: #EDE7DC; padding: 3px 10px; border-radius: 4px; border: 1px solid #D4C8B4; letter-spacing: 0.5px; }
  .offline-pill { display: flex; align-items: center; gap: 4px; font-family: 'Courier Prime', monospace; font-size: 9px; color: #B83C2C; background: #F5EBE8; padding: 3px 8px; border-radius: 4px; border: 1px solid #B83C2C28; }
  .offline-dot { width: 5px; height: 5px; border-radius: 50%; background: #B83C2C; animation: blink 1.5s ease-in-out infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* Day Bar */
  .day-bar { height: 7px; background: #E4DDD0; border-radius: 4px; overflow: hidden; display: flex; margin-bottom: 9px; }
  .seg { height: 100%; transition: width 0.35s cubic-bezier(.4,0,.2,1); flex-shrink: 0; }
  .legend { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  .leg-item { display: flex; align-items: center; gap: 5px; font-family: 'Caveat', cursive; font-size: 12px; color: #9A8B78; }
  .leg-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

  /* KPIs */
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 10px 20px; border-bottom: 1px solid #DDD5C4; border-top: 1px solid #DDD5C4; }
  .kpi { background: #FDFCF8; border: 1px solid #DDD5C4; border-radius: 8px; padding: 9px 6px; text-align: center; box-shadow: 0 1px 3px rgba(90,60,20,0.08); }
  .kpi-val { font-family: 'Courier Prime', monospace; font-size: 11.5px; font-weight: 700; color: #3C3428; }
  .kpi-lab { font-family: 'Caveat', cursive; font-size: 11px; color: #9A8B78; margin-top: 2px; }
  .kpi.good { border-color: #3A724850; background: #EDF3EE; }
  .kpi.good .kpi-val { color: #3A7248; }
  .kpi.bad  { border-color: #B83C2C44; background: #F5ECEC; }
  .kpi.bad  .kpi-val { color: #B83C2C; }

  /* Plan view */
  .content { padding: 14px 20px 0; }
  .sec-head { font-family: 'Caveat', cursive; font-size: 14px; font-weight: 600; color: #9A8B78; letter-spacing: 0.3px; margin-bottom: 10px; }
  .tasks { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
  .task {
    background: #FDFCF8;
    border: 1px solid #DDD5C4;
    border-radius: 8px;
    padding: 11px 12px;
    display: flex; align-items: center; gap: 9px;
    transition: box-shadow 0.2s, border-color 0.2s;
    box-shadow: 0 1px 3px rgba(90,60,20,0.08);
  }
  .task:hover { border-color: #C4B8A4; box-shadow: 0 2px 6px rgba(90,60,20,0.13); }
  @keyframes task-pulse {
    0%,100% { border-color: #A8721A44; box-shadow: 0 1px 3px rgba(90,60,20,0.08); }
    50% { border-color: #A8721A; box-shadow: 0 2px 10px rgba(168,114,26,0.2); }
  }
  .task.active   { animation: task-pulse 2s ease-in-out infinite; background: #FBF4E4; }
  .task.done     { opacity: 0.42; box-shadow: none; }
  .task.deferred { opacity: 0.34; border-style: dashed; box-shadow: none; background: #F8F5EE; }
  .t-dot { width: 9px; height: 9px; border-radius: 50%; background: #A8721A; flex-shrink: 0; border: 1.5px solid transparent; transition: box-shadow 0.3s; }
  .t-dot.done     { background: #3A7248; }
  .t-dot.deferred { background: transparent; border-color: #C4B8A4; }
  .t-dot.active   { background: #A8721A; box-shadow: 0 0 7px #A8721A88; }
  .t-name { flex: 1; font-family: 'Lora', serif; font-size: 13.5px; font-weight: 400; color: #2C2418; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .t-name.struck { text-decoration: line-through; text-decoration-color: #A8A090; color: #9A8B78; }
  .t-time { font-family: 'Courier Prime', monospace; font-size: 10px; color: #9A8B78; background: #EDE7DC; padding: 3px 7px; border-radius: 4px; white-space: nowrap; flex-shrink: 0; border: 1px solid #D4C8B4; }
  .t-time.over   { color: #B83C2C; background: #F5ECEC; border-color: #B83C2C30; }
  .t-time.active { color: #A8721A; background: #F5EDD8; border-color: #A8721A30; }
  .t-action { width: 26px; height: 26px; border-radius: 6px; border: 1px solid #D4C8B4; background: transparent; color: #C0B4A4; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; transition: all 0.15s; flex-shrink: 0; }
  .t-action:hover       { border-color: #A8721A; color: #A8721A; background: #F5EDD8; }
  .t-action.del:hover   { border-color: #B83C2C; color: #B83C2C; background: #F5ECEC; }
  .t-action.defer:hover { border-color: #7A9878; color: #7A9878; background: #EDF3EE; }

  /* Add row — title input + Std:Min duration field */
  .add-row { background: #FDFCF8; border: 1.5px dashed #C4B8A4; border-radius: 8px; padding: 10px 12px; display: flex; gap: 8px; align-items: center; }
  .add-inp { flex: 1; background: transparent; border: none; outline: none; color: #2C2418; font-family: 'Lora', serif; font-size: 16px; }
  .add-inp::placeholder { color: #C4B8A4; font-style: italic; }
  .add-btn { width: 26px; height: 26px; border-radius: 6px; border: none; background: #A8721A; color: #FDFCF8; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; transition: all 0.15s; flex-shrink: 0; }
  .add-btn:hover { background: #BA8220; transform: scale(1.06); }
  /* Std:Min duration field */
  .dur-field { display: inline-flex; align-items: center; gap: 1px; border: 1px solid #D4C8B4; border-radius: 6px; background: transparent; transition: border-color 0.15s; flex-shrink: 0; overflow: hidden; }
  .dur-field:focus-within { border-color: #A8721A; }
  .dur-inp { width: 34px; background: transparent; border: none; outline: none; font-family: 'Courier Prime', monospace; font-size: 15px; color: #A8721A; text-align: center; padding: 5px 2px; -webkit-appearance: none; }
  .dur-colon { font-family: 'Courier Prime', monospace; font-size: 15px; color: #C4B8A4; padding: 0 1px; user-select: none; line-height: 1; }
  .dur-labels { display: flex; justify-content: space-between; width: 70px; padding: 0 6px; }
  .dur-lbl { font-family: 'Caveat', cursive; font-size: 9px; color: #C4B8A4; letter-spacing: 0.3px; }

  /* Spielraum-start button (plan view) */
  .sr-start-btn { width: 100%; padding: 13px; border-radius: 8px; border: 1px dashed #3A724850; background: #EDF3EE; color: #3A7248; font-family: 'Lora', serif; font-size: 13px; cursor: pointer; margin-top: 6px; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .sr-start-btn:hover { background: #E0EDE5; border-style: solid; }

  /* Timer view */
  .timer-view { padding: 20px; }
  .timer-ctx  { font-family: 'Caveat', cursive; font-size: 14px; color: #9A8B78; margin-bottom: 4px; }
  .timer-task { font-family: 'Lora', serif; font-size: 21px; font-weight: 400; font-style: italic; color: #1E1916; margin-bottom: 18px; line-height: 1.3; }
  .timer-num  { font-family: 'Courier Prime', monospace; font-size: 60px; font-weight: 700; letter-spacing: -1px; color: #A8721A; margin-bottom: 6px; line-height: 1; }
  .timer-num.over  { color: #B83C2C; }
  .timer-num.green { color: #3A7248; }
  .timer-num.sr-done { color: #B83C2C; }
  .timer-paused { display: inline-flex; align-items: center; gap: 5px; font-family: 'Caveat', cursive; font-size: 14px; color: #9A8B78; background: #EDE7DC; border: 1px solid #D4C8B4; border-radius: 6px; padding: 3px 10px; margin-bottom: 10px; }
  .timer-bar-meta { display: flex; justify-content: space-between; font-family: 'Courier Prime', monospace; font-size: 9px; color: #9A8B78; margin-bottom: 5px; }
  .timer-bar { height: 4px; background: #E4DDD0; border-radius: 2px; overflow: hidden; margin-bottom: 20px; }
  .timer-bar-fill { height: 100%; border-radius: 2px; transition: width 0.5s linear, background 0.3s; }
  .warn-box { background: #F5ECEC; border: 1px solid #B83C2C30; border-radius: 8px; padding: 9px 12px; font-family: 'Lora', serif; font-size: 11px; color: #B83C2C; margin-bottom: 12px; }
  .warn-box.warn { background: #F8F2DF; border-color: #9A780030; color: #7A5A00; }
  .t-actions { display: grid; gap: 8px; margin-bottom: 10px; }
  .t-actions.two   { grid-template-columns: 1fr 1fr; }
  .t-actions.three { grid-template-columns: 1fr 1fr 1fr; }
  .ta-btn { padding: 13px; border-radius: 8px; border: 1px solid #DDD5C4; background: #FDFCF8; color: #3C3428; font-family: 'Lora', serif; font-size: 13px; cursor: pointer; transition: all 0.15s; box-shadow: 0 1px 3px rgba(90,60,20,0.08); }
  .ta-btn.ok    { background: #3A7248; border-color: #3A7248; color: #FDFCF8; }
  .ta-btn.ok:hover  { background: #44845A; }
  .ta-btn.pause { color: #9A8B78; }
  .ta-btn.pause:hover { border-color: #A8721A; color: #A8721A; background: #F5EDD8; }
  .ta-btn.xtra:hover  { border-color: #A8721A; color: #A8721A; background: #F5EDD8; }
  .delta-row { background: #FDFCF8; border: 1px solid #DDD5C4; border-radius: 8px; padding: 9px 12px; display: flex; justify-content: space-between; align-items: center; font-family: 'Lora', serif; font-size: 11px; color: #9A8B78; }

  /* Setup view */
  .setup-view { padding: 20px; }
  .view-title { font-family: 'Caveat', cursive; font-size: 30px; font-weight: 700; margin-bottom: 18px; color: #1E1916; }
  .setup-sec { margin-bottom: 16px; }
  .setup-sec-lab { font-family: 'Caveat', cursive; font-size: 15px; font-weight: 600; color: #9A8B78; letter-spacing: 0.3px; margin-bottom: 8px; }
  .time-pair { display: flex; gap: 8px; }
  .time-box { flex: 1; background: #FDFCF8; border: 1px solid #DDD5C4; border-radius: 8px; padding: 10px 12px; box-shadow: 0 1px 2px rgba(90,60,20,0.07); }
  .time-box-lab { font-family: 'Caveat', cursive; font-size: 12px; color: #9A8B78; margin-bottom: 3px; }
  input[type="time"] { background: transparent; border: none; outline: none; color: #1E1916; font-family: 'Courier Prime', monospace; font-size: 18px; font-weight: 700; width: 100%; color-scheme: light; }
  .setup-field { background: #FDFCF8; border: 1px solid #DDD5C4; border-radius: 8px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; box-shadow: 0 1px 2px rgba(90,60,20,0.07); }
  .sf-lab { font-family: 'Lora', serif; font-size: 13px; color: #5A4E3C; }
  /* Number input for setup fields (replaces + / - steppers) */
  .num-inp { background: transparent; border: 1px solid #D4C8B4; border-radius: 6px; padding: 6px 10px; font-family: 'Courier Prime', monospace; font-size: 16px; color: #A8721A; text-align: center; outline: none; width: 70px; -webkit-appearance: none; }
  .num-inp:focus { border-color: #A8721A; }
  .num-inp-unit { font-family: 'Caveat', cursive; font-size: 13px; color: #9A8B78; margin-left: 4px; }
  .cta { width: 100%; padding: 13px; border-radius: 8px; border: none; background: #A8721A; color: #FDFCF8; font-family: 'Caveat', cursive; font-size: 18px; font-weight: 700; cursor: pointer; margin-top: 8px; transition: all 0.15s; letter-spacing: 0.3px; }
  .cta:hover { background: #BA8220; }
  .cta-ghost { width: 100%; padding: 11px; border-radius: 8px; border: 1px solid #D4C8B4; background: transparent; color: #9A8B78; font-family: 'Lora', serif; font-size: 13px; cursor: pointer; margin-top: 6px; transition: all 0.15s; }
  .cta-ghost:hover { border-color: #B83C2C; color: #B83C2C; }

  /* Stats view */
  .stats-view { padding: 20px; }
  .big-card { background: #FDFCF8; border: 1px solid #DDD5C4; border-radius: 10px; padding: 14px; margin-bottom: 8px; box-shadow: 0 1px 4px rgba(90,60,20,0.08); }
  .bc-lab { font-family: 'Caveat', cursive; font-size: 13px; color: #9A8B78; margin-bottom: 2px; }
  .bc-val { font-family: 'Courier Prime', monospace; font-size: 38px; font-weight: 700; letter-spacing: -1px; }
  .bc-sub { font-family: 'Lora', serif; font-style: italic; font-size: 11px; color: #9A8B78; margin-top: 3px; }
  .bar-chart { display: flex; gap: 5px; align-items: flex-end; height: 56px; margin-top: 10px; }
  .bc-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; height: 100%; justify-content: flex-end; }
  .bc-bar { width: 100%; border-radius: 2px 2px 0 0; min-height: 3px; }
  .bc-day { font-family: 'Caveat', cursive; font-size: 11px; color: #C0B4A4; }
  .bc-col.today .bc-day { color: #A8721A; font-weight: 700; }
  .no-data-hint { font-family: 'Lora', serif; font-style: italic; font-size: 12px; color: #C0B4A4; text-align: center; padding: 20px 0 8px; }

  /* Bottom Nav */
  .bottom-nav {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 400px;
    background: rgba(245,240,230,0.97);
    backdrop-filter: blur(8px);
    border-top: 1.5px solid #D4C8B4;
    display: flex;
    padding: 10px 0 calc(14px + env(safe-area-inset-bottom, 0px));
    z-index: 100;
  }
  .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; background: transparent; border: none; cursor: pointer; padding: 3px; transition: all 0.15s; }
  .nav-ico { font-size: 16px; opacity: 0.2; transition: opacity 0.15s; }
  .nav-lab { font-family: 'Caveat', cursive; font-size: 12px; font-weight: 600; color: #C0B4A4; letter-spacing: 0.3px; transition: color 0.15s; }
  .nav-item.on .nav-ico { opacity: 1; }
  .nav-item.on .nav-lab { color: #A8721A; }
  .nav-item.dim { opacity: 0.25; cursor: not-allowed; }
  .nav-badge { position: relative; display: inline-block; }
  .nav-badge-dot { position: absolute; top: -3px; right: -5px; width: 6px; height: 6px; border-radius: 50%; background: #A8721A; border: 1.5px solid #F5F0E6; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad = n => String(n).padStart(2, '0');
const fmtMin = m => {
  if (m < 0) return `−${fmtMin(-m)}`;
  const h = Math.floor(m / 60), min = m % 60;
  return h === 0 ? `${min}m` : min === 0 ? `${h}h` : `${h}h ${min}m`;
};
const todayStr = () => new Date().toISOString().split('T')[0];
const dayLabel = dateStr => {
  const names = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  return names[new Date(dateStr + 'T12:00:00').getDay()];
};
const clampNum = (v, min, max) => Math.max(min, Math.min(max, Number(v) || min));

const loadState = (key, def) => {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; }
  catch { return def; }
};

const DEFAULT_TASKS = [
  { id: 1, title: 'E-Mails & Nachrichten', est: 30, actual: null, status: 'planned' },
  { id: 2, title: 'Kundenreport schreiben', est: 90, actual: null, status: 'planned' },
  { id: 3, title: 'Team-Meeting',            est: 60, actual: null, status: 'planned' },
  { id: 4, title: 'Code Review',             est: 45, actual: null, status: 'planned' },
];

const DEFAULT_CFG = { sH: 8, sM: 0, eH: 20, eM: 0, buf: 10, breaks: [{ id: 1, lbl: 'Mittagspause', dur: 45 }], wantFree: 60 };

// ─── Component ────────────────────────────────────────────────────────────────
export default function Spielraum() {
  // ── State ──
  const [view, setView] = useState(() => {
    const p = new URLSearchParams(window.location.search).get('view');
    return ['plan', 'setup', 'stats'].includes(p) ? p : 'plan';
  });

  const [cfg, setCfg]         = useState(() => loadState('spielraum_cfg', DEFAULT_CFG));
  const [tasks, setTasks]     = useState(() => {
    const saved = loadState('spielraum_tasks', null);
    if (!saved) return DEFAULT_TASKS;
    return saved.map(t => t.status === 'active' ? { ...t, status: 'planned' } : t);
  });
  const [history, setHistory] = useState(() => loadState('spielraum_history', []));
  const [nTask, setNTask]     = useState({ title: '', est: 30 });
  const [aid, setAid]         = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused]   = useState(false);
  // 'task' = task timer counting up | 'spielraum' = free-time countdown
  const [timerMode, setTimerMode] = useState('task');
  const [srStart, setSrStart]     = useState(0); // spielraum minutes when SR timer started
  const [isOnline, setIsOnline]           = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall]     = useState(false);

  const iRef        = useRef(null);
  const startRef    = useRef(null);
  const pauseBaseRef= useRef(0);   // elapsed seconds captured at pause
  const wakeLockRef = useRef(null);
  const notifSent   = useRef(false);

  // ── SW registration ──
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegistered() {},
    onRegisterError(e) { console.error('SW registration failed', e); },
  });

  // ── Persist state ──
  useEffect(() => { localStorage.setItem('spielraum_cfg',     JSON.stringify(cfg));     }, [cfg]);
  useEffect(() => { localStorage.setItem('spielraum_tasks',   JSON.stringify(tasks));   }, [tasks]);
  useEffect(() => { localStorage.setItem('spielraum_history', JSON.stringify(history)); }, [history]);

  // ── Online / offline ──
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── Install prompt ──
  useEffect(() => {
    const handler   = e => { e.preventDefault(); setInstallPrompt(e); setShowInstall(true); };
    const installed = () => { setShowInstall(false); setInstallPrompt(null); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  // ── App Badge ──
  useEffect(() => {
    const pending = tasks.filter(t => t.status === 'planned').length;
    if ('setAppBadge' in navigator) navigator.setAppBadge(pending).catch(() => {});
  }, [tasks]);

  // ── Timer — wall-clock, supports pause ──
  useEffect(() => {
    if (running && !paused) {
      // startRef is set to anchor the correct wall-clock origin
      startRef.current = Date.now() - pauseBaseRef.current * 1000;
      iRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 500);
    } else {
      clearInterval(iRef.current);
    }
    return () => clearInterval(iRef.current);
  }, [running, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived timer values ──
  const at     = tasks.find(t => t.id === aid);
  const pct    = at ? Math.min(100, (elapsed / 60 / at.est) * 100) : 0;
  const isOver = pct >= 100;
  const isWarn = pct >= 75 && !isOver;

  // SR countdown
  const srRemaining  = Math.max(0, srStart * 60 - elapsed);
  const srOver       = timerMode === 'spielraum' && srRemaining === 0 && running;
  const srPct        = srStart > 0 ? (srRemaining / (srStart * 60)) * 100 : 100;
  const srH = Math.floor(srRemaining / 3600);
  const srM = Math.floor((srRemaining % 3600) / 60);
  const srS = srRemaining % 60;
  const srStr = srH > 0 ? `${pad(srH)}:${pad(srM)}:${pad(srS)}` : `${pad(srM)}:${pad(srS)}`;

  // ── Timer-over notification (foreground fallback; SW handles background) ──
  useEffect(() => {
    if (isOver && !notifSent.current && at) {
      notifSent.current = true;
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        new Notification('⏰ Zeit abgelaufen!', {
          body: `${at.title} – Zeit überschritten`,
          icon: '/Spielraum/icon.svg',
          tag: 'spielraum-timer',
          requireInteraction: true,
        });
      }
    }
    if (!isOver) notifSent.current = false;
  }, [isOver, at]);

  // ── Wake Lock ──
  const acquireWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try { wakeLockRef.current = await navigator.wakeLock.request('screen'); }
      catch {}
    }
  }, []);
  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  useEffect(() => {
    const reacquire = () => { if (!document.hidden && running && !paused) acquireWakeLock(); };
    document.addEventListener('visibilitychange', reacquire);
    return () => document.removeEventListener('visibilitychange', reacquire);
  }, [running, paused, acquireWakeLock]);

  // ── Calculations ──
  const dayMin    = (cfg.eH * 60 + cfg.eM) - (cfg.sH * 60 + cfg.sM);
  const breakMin  = cfg.breaks.reduce((s, b) => s + b.dur, 0);
  const net       = dayMin - breakMin;
  const live      = tasks.filter(t => t.status !== 'deferred');
  const taskMin   = live.reduce((s, t) => s + t.est, 0);
  const bufMin    = live.length * cfg.buf;
  const spielraum = net - taskMin - bufMin;
  const isGood    = spielraum >= cfg.wantFree;
  const freeDelta = at ? at.est - Math.ceil(elapsed / 60) : 0;

  const total = Math.max(dayMin, 1);
  const tPct  = Math.min((taskMin  / total) * 100, 100);
  const bPct  = Math.min((bufMin   / total) * 100, 100);
  const brPct = Math.min((breakMin / total) * 100, 100);
  const sPct  = Math.max(0, Math.min((Math.max(0, spielraum) / total) * 100, 100));

  // ── Weekly stats ──
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const weeklyStats = last7.map(date => {
    const entries = history.filter(h => h.date === date);
    const acc   = entries.length ? Math.round(entries.reduce((s, h) => s + h.acc, 0) / entries.length) : 0;
    const delta = entries.length ? entries.reduce((s, h) => s + h.delta, 0) : 0;
    return { d: dayLabel(date), acc, delta, hasData: entries.length > 0, isToday: date === todayStr() };
  });
  const avgAcc     = Math.round(weeklyStats.filter(d => d.hasData).reduce((s, d) => s + d.acc, 0) / (weeklyStats.filter(d => d.hasData).length || 1));
  const totalDelta = weeklyStats.filter(d => d.hasData).reduce((s, d) => s + d.delta, 0);
  const hasHistory = history.length > 0;

  // ── Display ──
  const today        = new Date().toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
  const tH           = Math.floor(elapsed / 3600), tM = Math.floor((elapsed % 3600) / 60), tS = elapsed % 60;
  const timerStr     = tH > 0 ? `${pad(tH)}:${pad(tM)}:${pad(tS)}` : `${pad(tM)}:${pad(tS)}`;
  const pendingCount = tasks.filter(t => t.status === 'planned').length;
  const hasBanner    = showInstall || needRefresh;

  // ── SW alarm helpers ──
  // Stores alarm info in sessionStorage so the visibility-change check (Layer 3)
  // can fire a notification when the user returns to the app after the timer expired.
  const scheduleSwAlarm = useCallback((delayMs, title, body) => {
    const fireAt = Date.now() + delayMs;
    sessionStorage.setItem('sr_alarm_at',    String(fireAt));
    sessionStorage.setItem('sr_alarm_title', title);
    sessionStorage.setItem('sr_alarm_body',  body);

    const send = sw => sw?.postMessage({ type: 'SCHEDULE_ALARM', delay: delayMs, fireAt, title, body });
    if (navigator.serviceWorker?.controller) {
      send(navigator.serviceWorker.controller);
    } else if (navigator.serviceWorker) {
      navigator.serviceWorker.ready.then(reg => send(reg.active)).catch(() => {});
    }
  }, []);

  const cancelSwAlarm = useCallback(() => {
    sessionStorage.removeItem('sr_alarm_at');
    sessionStorage.removeItem('sr_alarm_title');
    sessionStorage.removeItem('sr_alarm_body');
    if (!navigator.serviceWorker?.controller) return;
    navigator.serviceWorker.controller.postMessage({ type: 'CANCEL_ALARM' });
  }, []);

  // Layer 3 — visibility-change check: fires a notification the moment the user
  // returns to the app if the alarm time has already passed (covers iOS where the
  // SW is suspended when the screen locks).
  useEffect(() => {
    const check = () => {
      if (document.hidden) return;
      const fireAt = Number(sessionStorage.getItem('sr_alarm_at'));
      if (!fireAt || Date.now() < fireAt) return;
      const title = sessionStorage.getItem('sr_alarm_title') || '⏰ Zeit abgelaufen!';
      const body  = sessionStorage.getItem('sr_alarm_body')  || 'Dein Timer ist abgelaufen.';
      sessionStorage.removeItem('sr_alarm_at');
      sessionStorage.removeItem('sr_alarm_title');
      sessionStorage.removeItem('sr_alarm_body');
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/Spielraum/icon.svg',
          tag: 'spielraum-alarm',
          requireInteraction: true,
        });
      }
    };
    document.addEventListener('visibilitychange', check);
    return () => document.removeEventListener('visibilitychange', check);
  }, []);

  // ── Actions ──
  const startTimer = useCallback(async id => {
    await acquireWakeLock();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    const task = tasks.find(t => t.id === id);
    pauseBaseRef.current = 0;
    setAid(id); setElapsed(0); setRunning(true); setPaused(false);
    setTimerMode('task'); setView('active');
    setTasks(p => p.map(t => t.id === id ? { ...t, status: 'active' } : t));
    if (task) scheduleSwAlarm(task.est * 60 * 1000, '⏰ Zeit abgelaufen!', `${task.title} – geschätzte Zeit überschritten`);
  }, [acquireWakeLock, tasks, scheduleSwAlarm]);

  const pauseTimer = useCallback(() => {
    cancelSwAlarm();
    pauseBaseRef.current = elapsed;
    setPaused(true);
    releaseWakeLock();
  }, [elapsed, cancelSwAlarm, releaseWakeLock]);

  const resumeTimer = useCallback(async () => {
    await acquireWakeLock();
    setPaused(false);
    // Re-schedule alarm with remaining time
    if (timerMode === 'task' && at) {
      const remainMs = Math.max(0, at.est * 60 - elapsed) * 1000;
      if (remainMs > 0) scheduleSwAlarm(remainMs, '⏰ Zeit abgelaufen!', `${at.title} – geschätzte Zeit überschritten`);
    } else if (timerMode === 'spielraum') {
      const remainMs = Math.max(0, srStart * 60 - elapsed) * 1000;
      if (remainMs > 0) scheduleSwAlarm(remainMs, '🌿 Spielraum aufgebraucht!', 'Deine freie Zeit ist abgelaufen.');
    }
  }, [acquireWakeLock, timerMode, at, elapsed, srStart, scheduleSwAlarm]);

  const finishTask = useCallback(() => {
    cancelSwAlarm();
    const actual = Math.ceil(elapsed / 60) || 1;
    const entry  = tasks.find(t => t.id === aid);
    if (entry) {
      const acc   = Math.max(0, Math.min(200, Math.round((entry.est / actual) * 100)));
      const delta = entry.est - actual;
      setHistory(p => [...p, { date: todayStr(), title: entry.title, est: entry.est, actual, acc, delta }]);
    }
    setTasks(p => p.map(t => t.id === aid ? { ...t, status: 'done', actual } : t));
    setRunning(false); setPaused(false);
    pauseBaseRef.current = 0;
    releaseWakeLock();
    setAid(null);
    setView('plan');
    if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
  }, [elapsed, aid, tasks, releaseWakeLock, cancelSwAlarm]);

  const startSpielraumTimer = useCallback(async () => {
    if (spielraum <= 0) return;
    await acquireWakeLock();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    pauseBaseRef.current = 0;
    setSrStart(spielraum);
    setElapsed(0); setRunning(true); setPaused(false);
    setTimerMode('spielraum'); setView('active');
    scheduleSwAlarm(spielraum * 60 * 1000, '🌿 Spielraum aufgebraucht!', 'Deine freie Zeit ist abgelaufen.');
  }, [acquireWakeLock, spielraum, scheduleSwAlarm]);

  const finishSpielraumTimer = useCallback(() => {
    cancelSwAlarm();
    setRunning(false); setPaused(false);
    pauseBaseRef.current = 0;
    setTimerMode('task');
    releaseWakeLock();
    setView('plan');
  }, [releaseWakeLock, cancelSwAlarm]);

  const addMore      = () => setTasks(p => p.map(t => t.id === aid ? { ...t, est: t.est + 15 } : t));
  const removeTask   = id => setTasks(p => p.filter(t => t.id !== id));
  const toggleDefer  = id => setTasks(p => p.map(t =>
    t.id === id ? { ...t, status: t.status === 'deferred' ? 'planned' : 'deferred' } : t
  ));
  const addTask = () => {
    if (!nTask.title.trim()) return;
    setTasks(p => [...p, { id: Date.now(), title: nTask.title.trim(), est: nTask.est, actual: null, status: 'planned' }]);
    setNTask({ title: '', est: 30 });
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
    setInstallPrompt(null);
  };

  const requestNotifPerm = async () => {
    if ('Notification' in window) await Notification.requestPermission();
    setCfg(p => ({ ...p }));
  };

  const resetDay = () => {
    cancelSwAlarm();
    setTasks(DEFAULT_TASKS);
    setAid(null); setElapsed(0); setRunning(false); setPaused(false);
    pauseBaseRef.current = 0;
    setTimerMode('task');
    releaseWakeLock();
  };

  const notifPerm = 'Notification' in window ? Notification.permission : 'unsupported';

  return (
    <>
      <style>{CSS}</style>

      {/* ── Install Banner ── */}
      {showInstall && (
        <div className="pwa-banner install">
          <span className="pwa-banner-ico">📖</span>
          <span className="pwa-banner-text"><strong>Spielraum installieren</strong><br />Schnell-Zugriff vom Home-Screen</span>
          <div className="pwa-banner-actions">
            <button className="pwa-btn amber" onClick={handleInstall}>Installieren</button>
            <button className="pwa-btn ghost" onClick={() => setShowInstall(false)}>×</button>
          </div>
        </div>
      )}

      {/* ── Update Banner ── */}
      {needRefresh && !showInstall && (
        <div className="pwa-banner update">
          <span className="pwa-banner-ico">✦</span>
          <span className="pwa-banner-text"><strong>Update verfügbar</strong><br />Neue Version bereit</span>
          <div className="pwa-banner-actions">
            <button className="pwa-btn green" onClick={() => updateServiceWorker(true)}>Aktualisieren</button>
            <button className="pwa-btn ghost" onClick={() => setNeedRefresh(false)}>×</button>
          </div>
        </div>
      )}

      <div className={`app${hasBanner ? ' has-banner' : ''}`}>

        {/* ── Header ── */}
        <div className="header">
          <div className="header-top">
            <div className="logo">spiel<em>raum</em></div>
            <div className="header-right">
              {!isOnline && (
                <div className="offline-pill"><div className="offline-dot" />Offline</div>
              )}
              <div className="date-pill">{today}</div>
            </div>
          </div>
          <div className="day-bar">
            <div className="seg" style={{ width: `${tPct}%`,  background: '#A8721A' }} />
            <div className="seg" style={{ width: `${bPct}%`,  background: '#C8BEAC' }} />
            <div className="seg" style={{ width: `${brPct}%`, background: '#B4AC9C' }} />
            <div className="seg" style={{ width: `${sPct}%`,  background: '#3A7248' }} />
          </div>
          <div className="legend">
            {[['#A8721A','Tasks'],['#C8BEAC','Puffer'],['#B4AC9C','Pausen'],['#3A7248','Spielraum']].map(([c,l]) => (
              <div className="leg-item" key={l}><div className="leg-dot" style={{background:c}}/>{l}</div>
            ))}
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="kpis">
          <div className="kpi">
            <div className="kpi-val">{fmtMin(net)}</div>
            <div className="kpi-lab">Verfügbar</div>
          </div>
          <div className="kpi">
            <div className="kpi-val">{fmtMin(taskMin)}</div>
            <div className="kpi-lab">Aufgaben</div>
          </div>
          <div className="kpi">
            <div className="kpi-val">{fmtMin(bufMin)}</div>
            <div className="kpi-lab">Puffer</div>
          </div>
          <div className={`kpi ${isGood ? 'good' : 'bad'}`}>
            <div className="kpi-val">{fmtMin(spielraum)}</div>
            <div className="kpi-lab">Spielraum</div>
          </div>
        </div>

        {/* ════ PLAN VIEW ════ */}
        {view === 'plan' && (
          <div className="content">
            <div className="sec-head">Aufgaben · {pendingCount} offen</div>
            <div className="tasks">
              {tasks.map(t => {
                const isActiveCurrent = t.status === 'active' && t.id === aid;
                const elapsedMin = isActiveCurrent ? Math.floor(elapsed / 60) : null;
                const showOver   = t.actual != null && t.actual > t.est;
                return (
                  <div key={t.id} className={`task ${t.status}`}>
                    <div className={`t-dot ${t.status}`} />
                    <div className={`t-name ${t.status === 'done' ? 'struck' : ''}`}>{t.title}</div>
                    <div className={`t-time ${showOver ? 'over' : ''} ${isActiveCurrent ? 'active' : ''}`}>
                      {isActiveCurrent ? `${elapsedMin}m` : t.actual != null ? `${t.actual}m` : `${t.est}m`}
                    </div>
                    {t.status === 'planned' && (
                      <button className="t-action" onClick={() => startTimer(t.id)} title="Timer starten">▶</button>
                    )}
                    {(t.status === 'planned' || t.status === 'deferred') && (
                      <button className="t-action defer" title={t.status === 'deferred' ? 'Wiederherstellen' : 'Verschieben'}
                        onClick={() => toggleDefer(t.id)}>
                        {t.status === 'deferred' ? '↩' : '~'}
                      </button>
                    )}
                    {t.status !== 'done' && t.status !== 'active' && (
                      <button className="t-action del" onClick={() => removeTask(t.id)} title="Entfernen">×</button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add task */}
            <div className="add-row">
              <input
                className="add-inp"
                placeholder="Neue Aufgabe..."
                value={nTask.title}
                onChange={e => setNTask(p => ({ ...p, title: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addTask()}
              />
              <div>
                <div className="dur-field">
                  <input
                    type="number"
                    inputMode="numeric"
                    className="dur-inp"
                    min="0" max="12"
                    value={Math.floor(nTask.est / 60)}
                    onChange={e => setNTask(p => ({ ...p, est: clampNum(e.target.value, 0, 12) * 60 + (p.est % 60) }))}
                  />
                  <span className="dur-colon">:</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="dur-inp"
                    min="0" max="59" step="5"
                    value={nTask.est % 60}
                    onChange={e => setNTask(p => ({ ...p, est: Math.floor(p.est / 60) * 60 + clampNum(e.target.value, 0, 59) }))}
                  />
                </div>
                <div className="dur-labels">
                  <span className="dur-lbl">Std</span>
                  <span className="dur-lbl">Min</span>
                </div>
              </div>
              <button className="add-btn" onClick={addTask}>+</button>
            </div>

            {/* Spielraum-Timer start */}
            {spielraum > 0 && !running && (
              <button className="sr-start-btn" onClick={startSpielraumTimer}>
                🌿 Spielraum nutzen — {fmtMin(spielraum)} Countdown starten
              </button>
            )}
          </div>
        )}

        {/* ════ ACTIVE TIMER — TASK MODE ════ */}
        {view === 'active' && timerMode === 'task' && at && (
          <div className="timer-view">
            <div className="timer-ctx">Aktive Aufgabe</div>
            <div className="timer-task">{at.title}</div>
            {paused && <div className="timer-paused">⏸ Pausiert</div>}
            <div className={`timer-num ${isOver ? 'over' : ''}`}>{timerStr}</div>
            <div className="timer-bar-meta">
              <span>0m</span><span>Geplant: {at.est}m</span>
            </div>
            <div className="timer-bar">
              <div className="timer-bar-fill" style={{
                width: `${Math.min(100, pct)}%`,
                background: isOver ? '#B83C2C' : isWarn ? '#A07820' : '#A8721A',
              }} />
            </div>
            {isWarn && !isOver && (
              <div className="warn-box warn">⏱ Noch {Math.ceil(at.est - elapsed / 60)}m verbleibend</div>
            )}
            {isOver && (
              <div className="warn-box">⚠ Zeit überschritten — andere Tasks verschieben?</div>
            )}
            <div className={`t-actions ${paused ? 'two' : 'three'}`}>
              <button className="ta-btn ok" onClick={finishTask}>✓ Fertig</button>
              {paused
                ? <button className="ta-btn pause" onClick={resumeTimer}>▶ Weiter</button>
                : <>
                    <button className="ta-btn pause" onClick={pauseTimer}>⏸ Pause</button>
                    <button className="ta-btn xtra"  onClick={addMore}>+15 Min</button>
                  </>
              }
            </div>
            <div className="delta-row">
              <span>Spielraum-Delta</span>
              <span style={{ fontFamily:"'Courier Prime',monospace", fontSize:'14px', fontWeight:700, color: freeDelta >= 0 ? '#3A7248' : '#B83C2C' }}>
                {freeDelta >= 0 ? '+' : ''}{freeDelta}m
              </span>
            </div>
          </div>
        )}

        {/* ════ ACTIVE TIMER — SPIELRAUM COUNTDOWN ════ */}
        {view === 'active' && timerMode === 'spielraum' && (
          <div className="timer-view">
            <div className="timer-ctx">Freie Zeit</div>
            <div className="timer-task" style={{color:'#3A7248'}}>Spielraum-Countdown</div>
            {paused && <div className="timer-paused">⏸ Pausiert</div>}
            <div className={`timer-num ${srOver ? 'sr-done' : 'green'}`}>{srStr}</div>
            <div className="timer-bar-meta">
              <span>verbleibend</span><span>von {fmtMin(srStart)}</span>
            </div>
            <div className="timer-bar">
              <div className="timer-bar-fill" style={{
                width: `${srPct}%`,
                background: srOver ? '#B83C2C' : srPct < 25 ? '#A07820' : '#3A7248',
              }} />
            </div>
            {srOver && (
              <div className="warn-box">🌿 Spielraum aufgebraucht — Zeit zurück zur Arbeit!</div>
            )}
            {!srOver && srPct < 25 && (
              <div className="warn-box warn">⏱ Weniger als ¼ deiner freien Zeit übrig</div>
            )}
            <div className={`t-actions two`}>
              <button className="ta-btn ok" onClick={finishSpielraumTimer}>✓ Beenden</button>
              {paused
                ? <button className="ta-btn pause" onClick={resumeTimer}>▶ Weiter</button>
                : <button className="ta-btn pause" onClick={pauseTimer}>⏸ Pause</button>
              }
            </div>
          </div>
        )}

        {/* ════ SETUP VIEW ════ */}
        {view === 'setup' && (
          <div className="setup-view">
            <div className="view-title">Tages-Setup</div>
            <div className="setup-sec">
              <div className="setup-sec-lab">Zeitfenster</div>
              <div className="time-pair">
                <div className="time-box">
                  <div className="time-box-lab">Start</div>
                  <input type="time" value={`${pad(cfg.sH)}:${pad(cfg.sM)}`}
                    onChange={e => { const [h,m]=e.target.value.split(':').map(Number); setCfg(p=>({...p,sH:h,sM:m})); }} />
                </div>
                <div className="time-box">
                  <div className="time-box-lab">Ende</div>
                  <input type="time" value={`${pad(cfg.eH)}:${pad(cfg.eM)}`}
                    onChange={e => { const [h,m]=e.target.value.split(':').map(Number); setCfg(p=>({...p,eH:h,eM:m})); }} />
                </div>
              </div>
            </div>
            <div className="setup-sec">
              <div className="setup-sec-lab">Standard-Puffer</div>
              <div className="setup-field">
                <span className="sf-lab">Zwischen Tasks</span>
                <div style={{display:'flex',alignItems:'center'}}>
                  <input type="number" inputMode="numeric" className="num-inp" min="0" max="60" step="5"
                    value={cfg.buf}
                    onChange={e => setCfg(p => ({...p, buf: clampNum(e.target.value, 0, 60)}))} />
                  <span className="num-inp-unit">min</span>
                </div>
              </div>
            </div>
            <div className="setup-sec">
              <div className="setup-sec-lab">Pausen</div>
              {cfg.breaks.map(b => (
                <div className="setup-field" key={b.id}>
                  <span className="sf-lab">{b.lbl}</span>
                  <div style={{display:'flex',alignItems:'center'}}>
                    <input type="number" inputMode="numeric" className="num-inp" min="5" max="240" step="5"
                      value={b.dur}
                      onChange={e => setCfg(p => ({...p, breaks: p.breaks.map(br => br.id===b.id ? {...br, dur: clampNum(e.target.value, 5, 240)} : br)}))} />
                    <span className="num-inp-unit">min</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="setup-sec">
              <div className="setup-sec-lab">Mindest-Spielraum</div>
              <div className="setup-field">
                <span className="sf-lab">Gewünschte Freizeit</span>
                <div style={{display:'flex',alignItems:'center'}}>
                  <input type="number" inputMode="numeric" className="num-inp" min="0" max="480" step="15"
                    value={cfg.wantFree}
                    onChange={e => setCfg(p => ({...p, wantFree: clampNum(e.target.value, 0, 480)}))} />
                  <span className="num-inp-unit">min</span>
                </div>
              </div>
            </div>
            <div className="setup-sec">
              <div className="setup-sec-lab">Benachrichtigungen</div>
              <div className="setup-field">
                <span className="sf-lab">Timer-Alarm</span>
                <span style={{fontFamily:"'Courier Prime',monospace", fontSize:'11px', color: notifPerm==='granted'?'#3A7248': notifPerm==='denied'?'#B83C2C':'#9A8B78'}}>
                  {notifPerm === 'granted' ? '✓ Erlaubt' : notifPerm === 'denied' ? '✗ Blockiert' : 'Nicht aktiv'}
                </span>
              </div>
              {notifPerm === 'default' && (
                <button className="cta-ghost" style={{marginTop:0}} onClick={requestNotifPerm}>Benachrichtigungen erlauben</button>
              )}
            </div>
            <button className="cta" onClick={() => setView('plan')}>Tag beginnen →</button>
            <button className="cta-ghost" onClick={resetDay}>Tag zurücksetzen</button>
          </div>
        )}

        {/* ════ STATS VIEW ════ */}
        {view === 'stats' && (
          <div className="stats-view">
            <div className="view-title">Auswertung</div>
            {!hasHistory && (
              <div className="no-data-hint">Noch keine Einträge — schließe erste Aufgaben ab.</div>
            )}
            <div className="big-card">
              <div className="bc-lab">Schätzgenauigkeit (7-Tage-Ø)</div>
              <div className="bc-val" style={{color:'#A8721A'}}>{hasHistory ? `${avgAcc}%` : '—'}</div>
              <div className="bc-sub">Wie gut du deine Zeit einschätzt</div>
              <div className="bar-chart">
                {weeklyStats.map((d, i) => (
                  <div className={`bc-col${d.isToday?' today':''}`} key={i}>
                    {d.hasData ? (
                      <div className="bc-bar" style={{
                        height: `${d.acc * 0.46}px`,
                        background: d.acc >= 80 ? '#A8721A28' : '#C4B8A430',
                        border: `1px solid ${d.acc >= 80 ? '#A8721A' : '#C4B8A4'}`,
                      }} />
                    ) : (
                      <div className="bc-bar" style={{ height: '3px', background: '#E4DDD0' }} />
                    )}
                    <div className="bc-day">{d.d}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="big-card">
              <div className="bc-lab">Gewonnener Spielraum (7 Tage)</div>
              <div className="bc-val" style={{color: !hasHistory ? '#C0B4A4' : totalDelta >= 0 ? '#3A7248' : '#B83C2C'}}>
                {hasHistory ? `${totalDelta >= 0 ? '+' : ''}${totalDelta}m` : '—'}
              </div>
              <div className="bc-sub">Zeitersparnis durch schnellere Erledigung</div>
              <div className="bar-chart">
                {weeklyStats.map((d, i) => {
                  const h = d.hasData ? Math.max(3, (Math.abs(d.delta) / 50) * 44) : 3;
                  const pos = d.delta >= 0;
                  return (
                    <div className={`bc-col${d.isToday?' today':''}`} key={i}>
                      <div className="bc-bar" style={{
                        height: `${h}px`,
                        background: !d.hasData ? '#E4DDD0' : pos ? '#3A724830' : '#B83C2C28',
                        border: `1px solid ${!d.hasData ? '#E4DDD0' : pos ? '#3A7248' : '#B83C2C'}`,
                      }} />
                      <div className="bc-day">{d.d}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom Nav ── */}
        <div className="bottom-nav">
          {[
            ['setup', '⚙', 'Setup',  false],
            ['plan',  '▤', 'Plan',   false],
            ['active','▶', 'Aktiv',  !aid && timerMode !== 'spielraum'],
            ['stats', '◈', 'Stats',  false],
          ].map(([v, ico, lbl, disabled]) => (
            <button
              key={v}
              className={`nav-item ${view === v ? 'on' : ''} ${disabled ? 'dim' : ''}`}
              onClick={() => !disabled && setView(v)}
            >
              <div className="nav-badge">
                <div className="nav-ico">{ico}</div>
                {v === 'plan' && pendingCount > 0 && view !== 'plan' && (
                  <div className="nav-badge-dot" />
                )}
              </div>
              <div className="nav-lab">{lbl}</div>
            </button>
          ))}
        </div>

      </div>
    </>
  );
}
