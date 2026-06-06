import { useState, useEffect, useRef, useCallback } from "react";
import { useRegisterSW } from 'virtual:pwa-register/react';

// ─── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { height: 100%; }
  body { background: #0B0B0F; color: #E0E0E8; font-family: 'Syne', sans-serif; -webkit-font-smoothing: antialiased; height: 100%; }
  #root { height: 100%; }

  .app {
    max-width: 400px; margin: 0 auto; min-height: 100vh;
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    background: #0B0B0F;
    transition: padding-top 0.2s;
  }
  .app.has-banner { padding-top: 48px; }

  /* PWA Banners */
  .pwa-banner {
    position: fixed; top: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 400px; padding: 10px 14px;
    display: flex; align-items: center; gap: 10px; z-index: 300;
    border-bottom: 1px solid transparent;
  }
  .pwa-banner.install { background: #13131C; border-color: #E8A34738; }
  .pwa-banner.update  { background: #0A1610; border-color: #5DB07D38; }
  .pwa-banner-ico  { font-size: 16px; flex-shrink: 0; }
  .pwa-banner-text { flex: 1; font-size: 11px; color: #B0B0C4; line-height: 1.35; }
  .pwa-banner-text strong { color: #E0E0E8; font-weight: 700; }
  .pwa-banner-actions { display: flex; gap: 6px; flex-shrink: 0; }
  .pwa-btn { padding: 5px 11px; border-radius: 7px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Syne', sans-serif; transition: all 0.15s; white-space: nowrap; }
  .pwa-btn.amber { background: #E8A347; color: #0B0B0F; border: none; }
  .pwa-btn.amber:hover { background: #F0B458; }
  .pwa-btn.green { background: #5DB07D; color: #0B0B0F; border: none; }
  .pwa-btn.green:hover { background: #6DC48E; }
  .pwa-btn.ghost { background: transparent; color: #48485A; border: 1px solid #1E1E2E; }
  .pwa-btn.ghost:hover { color: #7070A0; border-color: #2E2E4E; }

  /* Header */
  .header { padding: 18px 20px 0; }
  .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .logo { font-size: 21px; font-weight: 800; letter-spacing: -0.5px; }
  .logo em { color: #5DB07D; font-style: normal; }
  .header-right { display: flex; align-items: center; gap: 8px; }
  .date-pill { font-family: 'Space Mono', monospace; font-size: 10px; color: #5A5A70; background: #13131C; padding: 4px 10px; border-radius: 20px; border: 1px solid #1E1E2C; }
  .offline-pill { display: flex; align-items: center; gap: 4px; font-size: 9px; color: #E05C5C; background: #160A0A; padding: 3px 8px; border-radius: 10px; border: 1px solid #E05C5C30; }
  .offline-dot { width: 5px; height: 5px; border-radius: 50%; background: #E05C5C; animation: blink 1.5s ease-in-out infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* Day Bar */
  .day-bar { height: 6px; background: #15151F; border-radius: 3px; overflow: hidden; display: flex; margin-bottom: 8px; }
  .seg { height: 100%; transition: width 0.35s cubic-bezier(.4,0,.2,1); flex-shrink: 0; }
  .legend { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  .leg-item { display: flex; align-items: center; gap: 5px; font-size: 9.5px; color: #5A5A70; letter-spacing: 0.3px; }
  .leg-dot { width: 6px; height: 6px; border-radius: 50%; }

  /* KPIs */
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 10px 20px; border-bottom: 1px solid #18182A; border-top: 1px solid #18182A; }
  .kpi { background: #10101A; border: 1px solid #1A1A28; border-radius: 10px; padding: 9px 6px; text-align: center; }
  .kpi-val { font-family: 'Space Mono', monospace; font-size: 11.5px; font-weight: 700; color: #D0D0DE; }
  .kpi-lab { font-size: 8px; color: #48485A; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 3px; }
  .kpi.good { border-color: #5DB07D44; background: #0A1610; }
  .kpi.good .kpi-val { color: #5DB07D; }
  .kpi.bad  { border-color: #E05C5C44; background: #160A0A; }
  .kpi.bad  .kpi-val { color: #E05C5C; }

  /* Plan view */
  .content { padding: 14px 20px 0; }
  .sec-head { font-size: 10px; font-weight: 700; color: #48485A; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 10px; }
  .tasks { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
  .task { background: #10101A; border: 1px solid #1A1A28; border-radius: 11px; padding: 11px 12px; display: flex; align-items: center; gap: 9px; transition: border-color 0.2s, background 0.2s; }
  .task:hover { border-color: #26263A; }
  @keyframes task-pulse { 0%,100%{border-color:#E8A34750;box-shadow:none} 50%{border-color:#E8A34790;box-shadow:0 0 12px #E8A34718} }
  .task.active   { animation: task-pulse 2s ease-in-out infinite; background: #16120A; }
  .task.done     { opacity: 0.38; }
  .task.deferred { opacity: 0.28; border-style: dashed; }
  .t-dot { width: 7px; height: 7px; border-radius: 50%; background: #E8A347; flex-shrink: 0; transition: box-shadow 0.3s; }
  .t-dot.done     { background: #5DB07D; }
  .t-dot.deferred { background: #3A3A4A; }
  .t-dot.active   { background: #E8A347; box-shadow: 0 0 8px #E8A34780; }
  .t-name { flex: 1; font-size: 13px; font-weight: 500; color: #C0C0D0; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .t-name.struck { text-decoration: line-through; }
  .t-time { font-family: 'Space Mono', monospace; font-size: 10px; color: #48485A; background: #18182A; padding: 3px 7px; border-radius: 5px; white-space: nowrap; flex-shrink: 0; }
  .t-time.over   { color: #E05C5C; background: #18100A; }
  .t-time.active { color: #E8A347; background: #1A1408; }
  .t-action { width: 26px; height: 26px; border-radius: 7px; border: 1px solid #1E1E2E; background: transparent; color: #48485A; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; transition: all 0.15s; flex-shrink: 0; }
  .t-action:hover      { border-color: #E8A347; color: #E8A347; background: #E8A34712; }
  .t-action.del:hover  { border-color: #E05C5C; color: #E05C5C; background: #E05C5C12; }
  .t-action.defer:hover{ border-color: #6868A0; color: #6868A0; background: #6868A012; }

  /* Add row */
  .add-row { background: #10101A; border: 1px dashed #20203A; border-radius: 11px; padding: 10px 12px; display: flex; gap: 8px; align-items: center; }
  .add-inp { flex: 1; background: transparent; border: none; outline: none; color: #D0D0DC; font-family: 'Syne', sans-serif; font-size: 13px; }
  .add-inp::placeholder { color: #303048; }
  .stepper { display: flex; align-items: center; gap: 3px; flex-shrink: 0; }
  .s-btn { width: 18px; height: 18px; border-radius: 5px; border: 1px solid #1E1E2E; background: transparent; color: #48485A; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: all 0.15s; }
  .s-btn:hover { border-color: #E8A347; color: #E8A347; }
  .s-val { font-family: 'Space Mono', monospace; font-size: 10px; color: #E8A347; min-width: 30px; text-align: center; }
  .add-btn { width: 26px; height: 26px; border-radius: 7px; border: none; background: #E8A347; color: #0B0B0F; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; transition: all 0.15s; flex-shrink: 0; }
  .add-btn:hover { background: #F0B458; transform: scale(1.06); }

  /* Timer view */
  .timer-view { padding: 20px; }
  .timer-ctx  { font-size: 10px; color: #48485A; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .timer-task { font-size: 20px; font-weight: 700; color: #E0E0E8; margin-bottom: 22px; line-height: 1.2; }
  .timer-num  { font-family: 'Space Mono', monospace; font-size: 54px; font-weight: 700; letter-spacing: -2px; color: #E8A347; margin-bottom: 6px; }
  .timer-num.over { color: #E05C5C; }
  .timer-bar-meta { display: flex; justify-content: space-between; font-family: 'Space Mono', monospace; font-size: 9px; color: #48485A; margin-bottom: 5px; }
  .timer-bar { height: 3px; background: #1A1A28; border-radius: 2px; overflow: hidden; margin-bottom: 20px; }
  .timer-bar-fill { height: 100%; border-radius: 2px; transition: width 0.5s linear, background 0.3s; }
  .warn-box { background: #160B0B; border: 1px solid #E05C5C44; border-radius: 9px; padding: 9px 12px; font-size: 11px; color: #E05C5C; margin-bottom: 12px; }
  .t-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
  .ta-btn { padding: 13px; border-radius: 11px; border: 1px solid #1A1A28; background: #10101A; color: #D0D0DC; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
  .ta-btn.ok   { background: #5DB07D; border-color: #5DB07D; color: #0B0B0F; }
  .ta-btn.ok:hover   { background: #6DC48E; }
  .ta-btn.xtra:hover { border-color: #E8A347; color: #E8A347; background: #E8A34710; }
  .delta-row { background: #10101A; border: 1px solid #1A1A28; border-radius: 9px; padding: 9px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #48485A; }

  /* Setup view */
  .setup-view { padding: 20px; }
  .view-title { font-size: 17px; font-weight: 700; margin-bottom: 18px; }
  .setup-sec { margin-bottom: 16px; }
  .setup-sec-lab { font-size: 10px; font-weight: 700; color: #48485A; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .time-pair { display: flex; gap: 8px; }
  .time-box { flex: 1; background: #10101A; border: 1px solid #1A1A28; border-radius: 10px; padding: 10px 12px; }
  .time-box-lab { font-size: 9px; color: #48485A; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  input[type="time"] { background: transparent; border: none; outline: none; color: #D8D8E4; font-family: 'Space Mono', monospace; font-size: 17px; font-weight: 700; width: 100%; color-scheme: dark; }
  .setup-field { background: #10101A; border: 1px solid #1A1A28; border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .sf-lab { font-size: 12px; color: #9090A8; }
  .cta { width: 100%; padding: 13px; border-radius: 11px; border: none; background: #E8A347; color: #0B0B0F; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 8px; transition: all 0.15s; }
  .cta:hover { background: #F0B458; }
  .cta-ghost { width: 100%; padding: 11px; border-radius: 11px; border: 1px solid #1E1E2E; background: transparent; color: #48485A; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 6px; transition: all 0.15s; }
  .cta-ghost:hover { border-color: #E05C5C; color: #E05C5C; }
  .notif-status { font-size: 10px; color: #48485A; margin-top: 4px; }

  /* Stats view */
  .stats-view { padding: 20px; }
  .big-card { background: #10101A; border: 1px solid #1A1A28; border-radius: 13px; padding: 14px; margin-bottom: 8px; }
  .bc-lab { font-size: 10px; color: #48485A; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 2px; }
  .bc-val { font-family: 'Space Mono', monospace; font-size: 34px; font-weight: 700; letter-spacing: -1.5px; }
  .bc-sub { font-size: 10px; color: #48485A; margin-top: 2px; }
  .bar-chart { display: flex; gap: 5px; align-items: flex-end; height: 56px; margin-top: 10px; }
  .bc-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; height: 100%; justify-content: flex-end; }
  .bc-bar { width: 100%; border-radius: 3px 3px 0 0; min-height: 3px; }
  .bc-day { font-size: 8px; color: #38384A; font-family: 'Space Mono', monospace; }
  .bc-col.today .bc-day { color: #E8A347; }
  .no-data-hint { font-size: 11px; color: #303048; text-align: center; padding: 16px 0 8px; }

  /* Bottom Nav */
  .bottom-nav {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 400px;
    background: rgba(11,11,15,0.96); backdrop-filter: blur(10px);
    border-top: 1px solid #18182A;
    display: flex;
    padding: 10px 0 calc(14px + env(safe-area-inset-bottom, 0px));
    z-index: 100;
  }
  .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; background: transparent; border: none; cursor: pointer; padding: 3px; transition: all 0.15s; }
  .nav-ico { font-size: 16px; opacity: 0.25; transition: opacity 0.15s; }
  .nav-lab { font-family: 'Syne', sans-serif; font-size: 8px; font-weight: 700; color: #383850; text-transform: uppercase; letter-spacing: 0.7px; transition: color 0.15s; }
  .nav-item.on .nav-ico { opacity: 1; }
  .nav-item.on .nav-lab { color: #E8A347; }
  .nav-item.dim { opacity: 0.4; cursor: not-allowed; }
  .nav-badge { position: relative; display: inline-block; }
  .nav-badge-dot { position: absolute; top: -3px; right: -5px; width: 6px; height: 6px; border-radius: 50%; background: #E8A347; border: 1px solid #0B0B0F; }
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

  const [cfg, setCfg] = useState(() => loadState('spielraum_cfg', DEFAULT_CFG));
  const [tasks, setTasks] = useState(() => {
    const saved = loadState('spielraum_tasks', null);
    if (!saved) return DEFAULT_TASKS;
    return saved.map(t => t.status === 'active' ? { ...t, status: 'planned' } : t);
  });
  const [history, setHistory] = useState(() => loadState('spielraum_history', []));
  const [nTask, setNTask]     = useState({ title: '', est: 30 });
  const [aid, setAid]         = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [isOnline, setIsOnline]           = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall]     = useState(false);

  const iRef       = useRef(null);
  const wakeLockRef= useRef(null);
  const notifSent  = useRef(false);

  // ── SW registration (update prompt) ──
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
    const handler = e => { e.preventDefault(); setInstallPrompt(e); setShowInstall(true); };
    const installed = () => { setShowInstall(false); setInstallPrompt(null); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  // ── App Badge (pending task count) ──
  useEffect(() => {
    const pending = tasks.filter(t => t.status === 'planned').length;
    if ('setAppBadge' in navigator) navigator.setAppBadge(pending).catch(() => {});
  }, [tasks]);

  // ── Timer ──
  useEffect(() => {
    if (running) iRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    else clearInterval(iRef.current);
    return () => clearInterval(iRef.current);
  }, [running]);

  // ── Notification when time runs over (app backgrounded) ──
  const at   = tasks.find(t => t.id === aid);
  const pct  = at ? Math.min(100, (elapsed / 60 / at.est) * 100) : 0;
  const isOver = pct >= 100;
  const isWarn = pct >= 75 && !isOver;

  useEffect(() => {
    if (isOver && !notifSent.current && at) {
      notifSent.current = true;
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        new Notification('⏰ Zeit abgelaufen!', {
          body: `${at.title} – Zeit überschritten`,
          icon: '/icon.svg',
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

  // Re-acquire wake lock after visibility change (iOS Safari releases it on hide)
  useEffect(() => {
    const reacquire = () => { if (!document.hidden && running) acquireWakeLock(); };
    document.addEventListener('visibilitychange', reacquire);
    return () => document.removeEventListener('visibilitychange', reacquire);
  }, [running, acquireWakeLock]);

  // ── Calculations ──
  const dayMin  = (cfg.eH * 60 + cfg.eM) - (cfg.sH * 60 + cfg.sM);
  const breakMin= cfg.breaks.reduce((s, b) => s + b.dur, 0);
  const net     = dayMin - breakMin;
  const live    = tasks.filter(t => t.status !== 'deferred');
  const taskMin = live.reduce((s, t) => s + t.est, 0);
  const bufMin  = live.length * cfg.buf;
  const spielraum = net - taskMin - bufMin;
  const isGood  = spielraum >= cfg.wantFree;
  const freeDelta = at ? at.est - Math.ceil(elapsed / 60) : 0;

  const total = Math.max(dayMin, 1);
  const tPct  = Math.min((taskMin / total) * 100, 100);
  const bPct  = Math.min((bufMin  / total) * 100, 100);
  const brPct = Math.min((breakMin/ total) * 100, 100);
  const sPct  = Math.max(0, Math.min((Math.max(0, spielraum) / total) * 100, 100));

  // ── Weekly stats from real history ──
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const weeklyStats = last7.map(date => {
    const entries = history.filter(h => h.date === date);
    const acc   = entries.length ? Math.round(entries.reduce((s,h) => s + h.acc, 0) / entries.length) : 0;
    const delta = entries.length ? entries.reduce((s, h) => s + h.delta, 0) : 0;
    return { d: dayLabel(date), acc, delta, hasData: entries.length > 0, isToday: date === todayStr() };
  });
  const avgAcc    = Math.round(weeklyStats.filter(d => d.hasData).reduce((s, d) => s + d.acc, 0) / (weeklyStats.filter(d => d.hasData).length || 1));
  const totalDelta= weeklyStats.filter(d => d.hasData).reduce((s, d) => s + d.delta, 0);
  const hasHistory= history.length > 0;

  // ── Display ──
  const today   = new Date().toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
  const tH = Math.floor(elapsed / 3600), tM = Math.floor((elapsed % 3600) / 60), tS = elapsed % 60;
  const timerStr = tH > 0 ? `${pad(tH)}:${pad(tM)}:${pad(tS)}` : `${pad(tM)}:${pad(tS)}`;
  const pendingCount = tasks.filter(t => t.status === 'planned').length;
  const hasBanner = showInstall || needRefresh;

  // ── Actions ──
  const startTimer = useCallback(async id => {
    await acquireWakeLock();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    setAid(id); setElapsed(0); setRunning(true); setView('active');
    setTasks(p => p.map(t => t.id === id ? { ...t, status: 'active' } : t));
  }, [acquireWakeLock]);

  const finishTask = useCallback(() => {
    const actual = Math.ceil(elapsed / 60) || 1;
    const entry  = tasks.find(t => t.id === aid);
    if (entry) {
      const acc   = Math.max(0, Math.min(200, Math.round((entry.est / actual) * 100)));
      const delta = entry.est - actual;
      setHistory(p => [...p, { date: todayStr(), title: entry.title, est: entry.est, actual, acc, delta }]);
    }
    setTasks(p => p.map(t => t.id === aid ? { ...t, status: 'done', actual } : t));
    setRunning(false);
    releaseWakeLock();
    setAid(null);
    setView('plan');
    if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
  }, [elapsed, aid, tasks, releaseWakeLock]);

  const addMore   = () => setTasks(p => p.map(t => t.id === aid ? { ...t, est: t.est + 15 } : t));
  const removeTask= id => setTasks(p => p.filter(t => t.id !== id));
  const toggleDefer = id => setTasks(p => p.map(t =>
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
    setCfg(p => ({ ...p })); // trigger re-render
  };

  const resetDay = () => {
    setTasks(DEFAULT_TASKS);
    setAid(null); setElapsed(0); setRunning(false);
    releaseWakeLock();
  };

  const notifPerm = 'Notification' in window ? Notification.permission : 'unsupported';

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      {/* ── Install Banner ── */}
      {showInstall && (
        <div className="pwa-banner install">
          <span className="pwa-banner-ico">📲</span>
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
            <div className="seg" style={{ width: `${tPct}%`,  background: '#E8A347' }} />
            <div className="seg" style={{ width: `${bPct}%`,  background: '#222236' }} />
            <div className="seg" style={{ width: `${brPct}%`, background: '#3A3A50' }} />
            <div className="seg" style={{ width: `${sPct}%`,  background: '#5DB07D' }} />
          </div>
          <div className="legend">
            {[['#E8A347','Tasks'],['#222236','Puffer'],['#3A3A50','Pausen'],['#5DB07D','Spielraum']].map(([c,l]) => (
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
            <div className="add-row">
              <input
                className="add-inp"
                placeholder="Neue Aufgabe..."
                value={nTask.title}
                onChange={e => setNTask(p => ({ ...p, title: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addTask()}
              />
              <div className="stepper">
                <button className="s-btn" onClick={() => setNTask(p => ({ ...p, est: Math.max(5, p.est - 5) }))}>−</button>
                <div className="s-val">{nTask.est}m</div>
                <button className="s-btn" onClick={() => setNTask(p => ({ ...p, est: p.est + 5 }))}>+</button>
              </div>
              <button className="add-btn" onClick={addTask}>+</button>
            </div>
          </div>
        )}

        {/* ════ ACTIVE TIMER ════ */}
        {view === 'active' && at && (
          <div className="timer-view">
            <div className="timer-ctx">Aktive Aufgabe</div>
            <div className="timer-task">{at.title}</div>
            <div className={`timer-num ${isOver ? 'over' : ''}`}>{timerStr}</div>
            <div className="timer-bar-meta">
              <span>0m</span><span>Geplant: {at.est}m</span>
            </div>
            <div className="timer-bar">
              <div className="timer-bar-fill" style={{
                width: `${Math.min(100, pct)}%`,
                background: isOver ? '#E05C5C' : isWarn ? '#E8C347' : '#E8A347',
              }} />
            </div>
            {isWarn && !isOver && (
              <div className="warn-box" style={{color:'#E8C347',borderColor:'#E8C34744',background:'#15120A'}}>
                ⏱ Noch {Math.ceil(at.est - elapsed / 60)}m verbleibend
              </div>
            )}
            {isOver && (
              <div className="warn-box">⚠ Zeit überschritten — andere Tasks verschieben?</div>
            )}
            <div className="t-actions">
              <button className="ta-btn ok"   onClick={finishTask}>✓ Fertig</button>
              <button className="ta-btn xtra" onClick={addMore}>+ 15 Min</button>
            </div>
            <div className="delta-row">
              <span>Spielraum-Delta</span>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'13px', fontWeight:700, color: freeDelta >= 0 ? '#5DB07D' : '#E05C5C' }}>
                {freeDelta >= 0 ? '+' : ''}{freeDelta}m
              </span>
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
                <div className="stepper">
                  <button className="s-btn" style={{width:22,height:22}} onClick={() => setCfg(p=>({...p,buf:Math.max(0,p.buf-5)}))}>−</button>
                  <div className="s-val">{cfg.buf}m</div>
                  <button className="s-btn" style={{width:22,height:22}} onClick={() => setCfg(p=>({...p,buf:p.buf+5}))}>+</button>
                </div>
              </div>
            </div>
            <div className="setup-sec">
              <div className="setup-sec-lab">Pausen</div>
              {cfg.breaks.map(b => (
                <div className="setup-field" key={b.id}>
                  <span className="sf-lab">{b.lbl}</span>
                  <div className="stepper">
                    <button className="s-btn" style={{width:22,height:22}}
                      onClick={() => setCfg(p=>({...p,breaks:p.breaks.map(br=>br.id===b.id?{...br,dur:Math.max(5,br.dur-5)}:br)}))}>−</button>
                    <div className="s-val">{b.dur}m</div>
                    <button className="s-btn" style={{width:22,height:22}}
                      onClick={() => setCfg(p=>({...p,breaks:p.breaks.map(br=>br.id===b.id?{...br,dur:br.dur+5}:br)}))}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="setup-sec">
              <div className="setup-sec-lab">Mindest-Spielraum</div>
              <div className="setup-field">
                <span className="sf-lab">Gewünschte Freizeit</span>
                <div className="stepper">
                  <button className="s-btn" style={{width:22,height:22}} onClick={() => setCfg(p=>({...p,wantFree:Math.max(0,p.wantFree-15)}))}>−</button>
                  <div className="s-val">{cfg.wantFree}m</div>
                  <button className="s-btn" style={{width:22,height:22}} onClick={() => setCfg(p=>({...p,wantFree:p.wantFree+15}))}>+</button>
                </div>
              </div>
            </div>
            <div className="setup-sec">
              <div className="setup-sec-lab">Benachrichtigungen</div>
              <div className="setup-field">
                <span className="sf-lab">Timer-Alarm</span>
                <span style={{fontSize:'10px',color: notifPerm==='granted'?'#5DB07D': notifPerm==='denied'?'#E05C5C':'#48485A'}}>
                  {notifPerm === 'granted' ? '✓ Erlaubt' : notifPerm === 'denied' ? '✗ Blockiert' : 'Nicht aktiviert'}
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
              <div className="no-data-hint">Noch keine Daten — schließe erste Aufgaben ab, um hier Statistiken zu sehen.</div>
            )}
            <div className="big-card">
              <div className="bc-lab">Schätzgenauigkeit (7-Tage-Ø)</div>
              <div className="bc-val" style={{color:'#E8A347'}}>{hasHistory ? `${avgAcc}%` : '—'}</div>
              <div className="bc-sub">Wie gut du deine Zeit einschätzt</div>
              <div className="bar-chart">
                {weeklyStats.map((d, i) => (
                  <div className={`bc-col${d.isToday?' today':''}`} key={i}>
                    {d.hasData ? (
                      <div className="bc-bar" style={{
                        height: `${d.acc * 0.46}px`,
                        background: d.acc >= 80 ? '#E8A34740' : '#40405040',
                        border: `1px solid ${d.acc >= 80 ? '#E8A347' : '#404050'}`,
                      }} />
                    ) : (
                      <div className="bc-bar" style={{ height: '3px', background: '#1A1A28' }} />
                    )}
                    <div className="bc-day">{d.d}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="big-card">
              <div className="bc-lab">Gewonnener Spielraum (7 Tage)</div>
              <div className="bc-val" style={{color: !hasHistory ? '#48485A' : totalDelta >= 0 ? '#5DB07D' : '#E05C5C'}}>
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
                        background: !d.hasData ? '#1A1A28' : pos ? '#5DB07D40' : '#E05C5C40',
                        border: `1px solid ${!d.hasData ? '#1A1A28' : pos ? '#5DB07D' : '#E05C5C'}`,
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
            ['active','▶', 'Aktiv',  !aid],
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
