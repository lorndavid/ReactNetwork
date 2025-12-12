import React, { useState, useEffect, useContext, useRef } from "react";
import { createRoot } from "react-dom/client";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  remove,
  push,
} from "firebase/database";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyATNBHU58oq6TIFZ3V4VrtaN0z9MfnWJwQ",
  authDomain: "internet-manegement-di.firebaseapp.com",
  projectId: "internet-manegement-di",
  storageBucket: "internet-manegement-di.firebasestorage.app",
  messagingSenderId: "811368710372",
  appId: "1:811368710372:web:cea6c0f90facb83a702cf1",
  measurementId: "G-R5J0V7N6VD",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- ADVANCED STYLING & ANIMATIONS ---
const styles = document.createElement("style");
styles.innerHTML = `
  @import url('https://fonts.googleapis.com/css2?family=Battambang:wght@300;400;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  
  :root {
    --primary: #6366f1;
    --primary-dark: #4f46e5;
    --bg-light: #f8fafc;
    /* Deeper dark background for better contrast */
    --bg-dark: #020617; 
    --card-light: rgba(255, 255, 255, 0.85);
    --card-dark: rgba(30, 41, 59, 0.6);
    --glass-border-light: 1px solid rgba(255, 255, 255, 0.5);
    --glass-border-dark: 1px solid rgba(255, 255, 255, 0.08);
    --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05);
  }

  body { font-family: 'Plus Jakarta Sans', sans-serif; transition: background-color 0.3s ease; }
  .font-battambang { font-family: 'Battambang', cursive; }
  
  /* Themes */
  .theme-light { background-color: var(--bg-light); color: #1e293b; }
  .theme-dark { background-color: var(--bg-dark); color: #f8fafc; }
  
  .theme-dark .glass-panel { 
    background: var(--card-dark); 
    border: var(--glass-border-dark); 
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  }
  
  .theme-light .glass-panel {
    background: var(--card-light);
    border: var(--glass-border-light);
    box-shadow: var(--glass-shadow);
  }
  
  .theme-dark .text-slate-400 { color: #94a3b8; }
  .theme-dark .text-slate-500 { color: #64748b; }
  .theme-dark .text-slate-600 { color: #cbd5e1; }
  .theme-dark .text-slate-700 { color: #e2e8f0; }
  .theme-dark input, .theme-dark select { background: #1e293b; border-color: #334155; color: white; }
  
  /* Glassmorphism Base */
  .glass-panel {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  /* Animations */
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  .animate-enter { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  
  @keyframes pulse-soft { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
  .pulse-active { animation: pulse-soft 2s infinite; }

  /* Custom Scrollbar */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .theme-dark ::-webkit-scrollbar-thumb { background: #334155; }

  /* 3D Tilt Effect on Hover */
  .hover-3d { transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
  .hover-3d:hover { transform: translateY(-3px) scale(1.01); }
`;
document.head.appendChild(styles);

// --- CONTEXTS ---

const ThemeContext = React.createContext();
const ToastContext = React.createContext();

const ThemeProvider = ({ children }) => {
  // CHANGED: Default state is now "dark"
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const addToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  };
  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-md animate-enter ${
              t.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
            } bg-white dark:bg-slate-800`}
          >
            <i
              className={`fas ${
                t.type === "success" ? "fa-check-circle" : "fa-times-circle"
              }`}
            ></i>
            <span className="text-xs font-bold font-battambang">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// --- UI COMPONENTS ---

const Skeleton = ({ className }) => (
  <div
    className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`}
  ></div>
);

const Badge = ({ children, color = "indigo" }) => {
  const colors = {
    indigo:
      "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
    emerald:
      "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    rose: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
    slate:
      "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colors[color]}`}
    >
      {children}
    </span>
  );
};

const StatWidget = ({ title, value, icon, trend, color, delay }) => (
  <div
    className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover-3d"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div
      className={`absolute top-0 right-0 w-20 h-20 bg-${color}-500 opacity-[0.08] rounded-bl-full transition-transform group-hover:scale-110`}
    ></div>
    <div className="flex justify-between items-start relative z-10">
      <div>
        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
          {title}
        </h4>
        <div className="flex items-end gap-2">
          <span className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
            {value}
          </span>
          {trend && (
            <span className="text-[10px] font-bold text-emerald-500 mb-1.5">
              <i className="fas fa-arrow-up"></i> {trend}%
            </span>
          )}
        </div>
      </div>
      <div
        className={`w-10 h-10 rounded-xl bg-${color}-50 dark:bg-${color}-500/20 flex items-center justify-center text-${color}-500 shadow-sm border border-${color}-100 dark:border-${color}-500/30`}
      >
        <i className={`fas ${icon} text-lg`}></i>
      </div>
    </div>
    <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
      <div className={`h-full bg-${color}-500 w-2/3 rounded-full`}></div>
    </div>
  </div>
);

const ContextMenu = ({ x, y, onClose, onAction }) => (
  <div
    className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl rounded-lg py-1 w-40 flex flex-col animate-enter"
    style={{ top: y, left: x }}
    onMouseLeave={onClose}
  >
    <button
      onClick={() => onAction("ping")}
      className="px-4 py-2 text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 flex items-center gap-2"
    >
      <i className="fas fa-signal text-xs"></i> Ping Device
    </button>
    <button
      onClick={() => onAction("edit")}
      className="px-4 py-2 text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 flex items-center gap-2"
    >
      <i className="fas fa-edit text-xs"></i> Edit Details
    </button>
    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
    <button
      onClick={() => onAction("reset")}
      className="px-4 py-2 text-left text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
    >
      <i className="fas fa-power-off text-xs"></i> Reset
    </button>
  </div>
);

const PC_Node = ({ pc, pcNum, onClick }) => {
  const [contextMenu, setContextMenu] = useState(null);

  const handleRightClick = (e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeMenu = () => setContextMenu(null);

  let statusClass =
    "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300 dark:hover:border-slate-500";
  let ringClass = "";

  if (pc.status === "connected") {
    statusClass =
      "bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400";
    ringClass = "pulse-active";
  } else if (pc.status === "offline") {
    statusClass =
      "bg-rose-50/50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-500";
  }

  return (
    <>
      <div
        onClick={onClick}
        onContextMenu={handleRightClick}
        className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-95 hover:shadow-lg ${statusClass}`}
      >
        {pc.status === "connected" && (
          <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 flex h-1.5 w-1.5 md:h-2 md:w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-emerald-500"></span>
          </span>
        )}

        {/* CHANGED: Icons and Text are smaller on mobile (default) and larger on md screens */}
        <i
          className={`fas fa-desktop text-sm md:text-xl mb-1 md:mb-2 ${ringClass}`}
        ></i>

        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-wider">
          PC {pcNum}
        </span>

        {pc.info && (
          <div className="absolute inset-x-0 bottom-0 bg-slate-900/90 backdrop-blur-[2px] p-0.5 md:p-1 rounded-b-lg opacity-0 hover:opacity-100 transition-opacity">
            <p className="text-[7px] md:text-[9px] text-white text-center font-battambang truncate px-1">
              {pc.info}
            </p>
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeMenu}
          onAction={(action) => {
            if (action === "edit") onClick();
            closeMenu();
          }}
        />
      )}
    </>
  );
};

const CabinCard = ({
  cabin,
  id,
  isExpanded,
  toggle,
  section,
  onEditPC,
  onEditTable,
  onDelete,
}) => {
  const total = Object.values(cabin.tables || {}).reduce(
    (acc, t) => acc + Object.keys(t.pcs || {}).length,
    0
  );
  const active = Object.values(cabin.tables || {}).reduce(
    (acc, t) =>
      acc +
      Object.values(t.pcs || {}).filter((p) => p.status === "connected").length,
    0
  );

  const pct = total ? (active / total) * 100 : 0;

  return (
    <div className="glass-panel rounded-2xl mb-4 md:mb-6 overflow-hidden transition-all duration-500 hover:shadow-xl group border border-slate-100 dark:border-white/5">
      {/* Header */}
      <div
        className="p-4 md:p-5 flex items-center justify-between cursor-pointer bg-white/40 dark:bg-slate-800/30 hover:bg-white/60 dark:hover:bg-slate-800/50 transition-colors"
        onClick={toggle}
      >
        <div className="flex items-center gap-3 md:gap-5">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-lg md:text-2xl shadow-lg shadow-indigo-500/20">
            <i className="fas fa-server"></i>
          </div>
          <div>
            <div className="flex items-center gap-2 md:gap-3 mb-1">
              <h3 className="text-sm md:text-lg font-bold text-slate-800 dark:text-white truncate max-w-[120px] md:max-w-none">
                {cabin.name}
              </h3>
              <div className="hidden md:flex gap-2">
                <Badge color="slate">{cabin.number}</Badge>
                {cabin.type === "RA" ? (
                  <Badge color="indigo">Zone A</Badge>
                ) : (
                  <Badge color="emerald">Zone B</Badge>
                )}
              </div>
            </div>

            <div className="flex md:hidden gap-1 mb-1">
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">
                {cabin.number}
              </span>
            </div>

            <div className="flex items-center gap-3 w-32 md:w-64">
              <div className="flex-1 h-1.5 md:h-2 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {active}/{total}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Equipment Icons */}
          <div className="hidden md:flex gap-2">
            {cabin.equipment?.manage && (
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 text-xs border border-transparent dark:border-white/5">
                <i className="fas fa-network-wired"></i>
              </div>
            )}
          </div>

          <button
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${
              isExpanded ? "rotate-180 bg-slate-200 dark:bg-slate-700" : ""
            }`}
          >
            <i className="fas fa-chevron-down text-slate-400"></i>
          </button>
        </div>
      </div>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-black/20 p-3 md:p-6 animate-enter">
          <div className="grid gap-4 md:gap-6">
            {cabin.tables &&
              Object.entries(cabin.tables).map(([tid, table]) => {
                const pcs = Object.entries(table.pcs || {});
                if (section === "RB") pcs.reverse();

                return (
                  <div
                    key={tid}
                    className="bg-white dark:bg-slate-900/40 p-3 md:p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-3 md:mb-4 border-b border-slate-50 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-3 md:w-1.5 md:h-4 bg-indigo-500 rounded-full"></span>
                        <h5 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 font-battambang">
                          {table.name || "Table"}
                        </h5>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTable(
                            `zones/${section}/${id}/tables/${tid}`,
                            table.name
                          );
                        }}
                        className="text-slate-300 hover:text-indigo-500 transition-colors"
                      >
                        <i className="fas fa-pencil-alt text-xs"></i>
                      </button>
                    </div>

                    {/* CHANGED: grid-cols-3 on mobile (2 rows of 3), grid-cols-6 on desktop */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-3">
                      {pcs.map(([pid, pc]) => (
                        <PC_Node
                          key={pid}
                          pc={pc}
                          pcNum={pid.replace("pc", "")}
                          onClick={() =>
                            onEditPC(
                              `zones/${section}/${id}/tables/${tid}/pcs/${pid}`,
                              pc,
                              cabin.name,
                              table.name,
                              section
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={onDelete}
              className="text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <i className="fas fa-trash-alt"></i> Delete Cabin
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- WIZARD MODAL: ADD CABIN ---

const AddCabinWizard = ({ onClose, onCreate, currentView }) => {
  const [step, setStep] = useState(1);
  const isLocked = currentView === "RA" || currentView === "RB";

  const [data, setData] = useState({
    name: "",
    number: "",
    section: isLocked ? currentView : "RB",
    equipment: {
      manage: { c: true, p: "48" },
      router: { c: false, p: "12" },
      poe: { c: false, p: "24" },
    },
  });

  const updateEq = (k, f, v) => {
    setData((p) => ({
      ...p,
      equipment: { ...p.equipment, [k]: { ...p.equipment[k], [f]: v } },
    }));
  };

  const handleCreate = () => {
    const finalEq = {};
    if (data.equipment.manage.c)
      finalEq.manage = { ports: data.equipment.manage.p, name: "Switch" };
    if (data.equipment.router.c)
      finalEq.router = { ports: data.equipment.router.p, name: "Router" };
    if (data.equipment.poe.c)
      finalEq.poe = { ports: data.equipment.poe.p, name: "POE" };

    onCreate({ ...data, equipment: finalEq });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-enter border border-white/10">
        {/* Wizard Header */}
        <div className="px-6 md:px-8 py-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold font-battambang text-slate-800 dark:text-white">
              New Cabin Setup
            </h3>
            <button onClick={onClose}>
              <i className="fas fa-times text-slate-400"></i>
            </button>
          </div>
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  step >= i ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-800"
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-4 animate-enter">
              <h4 className="text-sm font-bold text-slate-500 uppercase">
                Basic Information
              </h4>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">
                  Cabin Name
                </label>
                <input
                  autoFocus
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. Server Room A"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">
                  Cabin Identifier
                </label>
                <input
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. R-01"
                  value={data.number}
                  onChange={(e) => setData({ ...data, number: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-enter">
              <h4 className="text-sm font-bold text-slate-500 uppercase">
                Location Zone
              </h4>
              {isLocked ? (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/30 rounded-xl flex items-center gap-4">
                  <i className="fas fa-lock text-indigo-400"></i>
                  <div>
                    <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                      Zone Locked
                    </p>
                    <p className="text-xs text-indigo-500/80">
                      Adding to {currentView === "RB" ? "Zone B" : "Zone A"}{" "}
                      based on current view.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {["RB", "RA"].map((z) => (
                    <button
                      key={z}
                      onClick={() => setData({ ...data, section: z })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        data.section === z
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                      }`}
                    >
                      <span className="block text-lg font-black mb-1">
                        {z === "RB" ? "B" : "A"}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        Zone {z === "RB" ? "Left" : "Right"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-enter">
              <h4 className="text-sm font-bold text-slate-500 uppercase">
                Hardware Config
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {["manage", "router", "poe"].map((id) => (
                  <div
                    key={id}
                    onClick={() => updateEq(id, "c", !data.equipment[id].c)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      data.equipment[id].c
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-slate-200 dark:border-slate-800 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          data.equipment[id].c
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                        }`}
                      >
                        <i
                          className={`fas ${
                            id === "manage"
                              ? "fa-network-wired"
                              : id === "router"
                              ? "fa-globe"
                              : "fa-wifi"
                          }`}
                        ></i>
                      </div>
                      <span className="font-bold uppercase text-xs">{id}</span>
                    </div>
                    {data.equipment[id].c && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <select
                          className="text-xs font-bold p-1 rounded bg-white dark:bg-slate-800 border-none outline-none"
                          value={data.equipment[id].p}
                          onChange={(e) => updateEq(id, "p", e.target.value)}
                        >
                          <option value="12">12P</option>
                          <option value="24">24P</option>
                          <option value="48">48P</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950 flex justify-between">
          <button
            disabled={step === 1}
            onClick={() => setStep((s) => s - 1)}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Back
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all"
            >
              Next Step <i className="fas fa-arrow-right ml-1"></i>
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="px-6 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all"
            >
              Create Cabin <i className="fas fa-check ml-1"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- PC DETAIL MODAL (With Tabs) ---

const PCDetailModal = ({ initialData, onClose, onSave, onDelete }) => {
  const [tab, setTab] = useState("general");
  const [data, setData] = useState({
    status: initialData.status || "idle",
    sourceType: initialData.sourceType || "Manage",
    sourceName: initialData.sourceName || "",
    port: initialData.port || "",
    info: initialData.info || "",
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-enter border border-white/10">
        {/* Header with Tabs */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span className="text-indigo-500">
                {initialData.extraInfo.zone}
              </span>{" "}
              / <span>{initialData.extraInfo.cabin}</span> /{" "}
              <span>{initialData.extraInfo.table}</span>
            </div>
            <button onClick={onClose}>
              <i className="fas fa-times text-slate-400"></i>
            </button>
          </div>

          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            {["general", "network", "actions"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                  tab === t
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 min-h-[250px]">
          {tab === "general" && (
            <div className="space-y-4 animate-enter">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                  Current Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "idle", icon: "fa-moon", color: "slate" },
                    { id: "connected", icon: "fa-check", color: "emerald" },
                    { id: "offline", icon: "fa-ban", color: "rose" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setData({ ...data, status: s.id })}
                      className={`py-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                        data.status === s.id
                          ? `border-${s.color}-500 bg-${s.color}-50 dark:bg-${s.color}-500/20 text-${s.color}-600`
                          : "border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <i className={`fas ${s.icon}`}></i>
                      <span className="text-[9px] font-bold uppercase">
                        {s.id}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                  User / Device Info
                </label>
                <input
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold outline-none text-slate-700 dark:text-white"
                  value={data.info}
                  onChange={(e) => setData({ ...data, info: e.target.value })}
                  placeholder="e.g. Employee Name"
                />
              </div>
            </div>
          )}

          {tab === "network" && (
            <div className="space-y-4 animate-enter">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                <h5 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
                  <i className="fas fa-link"></i> Uplink Connection
                </h5>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-slate-400">
                        Device Type
                      </label>
                      <select
                        className="w-full mt-1 p-2 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold border border-slate-200 dark:border-slate-700"
                        value={data.sourceType}
                        onChange={(e) =>
                          setData({ ...data, sourceType: e.target.value })
                        }
                      >
                        <option value="Manage">Manage Switch</option>
                        <option value="Router">Router</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400">
                        Port No.
                      </label>
                      <input
                        className="w-full mt-1 p-2 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold border border-slate-200 dark:border-slate-700 text-center"
                        value={data.port}
                        onChange={(e) =>
                          setData({ ...data, port: e.target.value })
                        }
                        placeholder="#"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400">
                      Source Name / IP
                    </label>
                    <input
                      className="w-full mt-1 p-2 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold border border-slate-200 dark:border-slate-700"
                      value={data.sourceName}
                      onChange={(e) =>
                        setData({ ...data, sourceName: e.target.value })
                      }
                      placeholder="e.g. SW-Main-01"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "actions" && (
            <div className="space-y-3 animate-enter">
              <button className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 font-bold text-xs">
                <i className="fas fa-terminal"></i> Ping Check (Simulate)
              </button>
              <button className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 font-bold text-xs">
                <i className="fas fa-history"></i> View Log History
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-2"></div>
              <button
                onClick={onDelete}
                className="w-full p-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-900/20 text-rose-600 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
              >
                Reset Configuration
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(data)}
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APPLICATION STRUCTURE ---

const AppContent = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const addToast = useContext(ToastContext);

  const [view, setView] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [zones, setZones] = useState({ RA: {}, RB: {} });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    idle: 0,
    offline: 0,
  });
  const [expanded, setExpanded] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Modal States
  const [modal, setModal] = useState(null); // 'addCabin', 'editPC', 'editTable'
  const [modalData, setModalData] = useState({});

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "zones"), (snap) => {
      const d = snap.val() || { RA: {}, RB: {} };
      setZones({ RA: d.RA || {}, RB: d.RB || {} });

      let s = { total: 0, active: 0, idle: 0, offline: 0 };
      ["RA", "RB"].forEach((z) => {
        if (d[z])
          Object.values(d[z]).forEach((c) => {
            if (c.tables)
              Object.values(c.tables).forEach((t) => {
                if (t.pcs)
                  Object.values(t.pcs).forEach((p) => {
                    s.total++;
                    if (p.status === "connected") s.active++;
                    else if (p.status === "offline") s.offline++;
                    else s.idle++;
                  });
              });
          });
      });
      setStats(s);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handlers
  const handleNav = (v) => {
    setView(v);
    setSidebarOpen(false);
  };
  const toggleExp = (id) => {
    const s = new Set(expanded);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpanded(s);
  };

  const createCabin = async (data) => {
    const tables = {};
    for (let i = 1; i <= 8; i++) {
      const pcs = {};
      for (let j = 1; j <= 6; j++) pcs[`pc${j}`] = { status: "idle", info: "" };
      tables[`table${i}`] = { name: `Table ${i}`, pcs };
    }
    const payload = {
      name: data.name,
      number: data.number,
      type: data.section,
      createdAt: Date.now(),
      equipment: data.equipment,
      tables,
    };
    try {
      await set(push(ref(db, `zones/${data.section}`)), payload);
      addToast("Cabin deployed successfully");
      setModal(null);
    } catch {
      addToast("Deployment failed", "error");
    }
  };

  const updatePC = async (data) => {
    try {
      await update(ref(db, modalData.path), data);
      addToast("PC Updated");
      setModal(null);
    } catch {
      addToast("Error", "error");
    }
  };

  const resetPC = async () => {
    try {
      await update(ref(db, modalData.path), {
        status: "idle",
        info: "",
        sourceType: "",
        sourceName: "",
        port: "",
      });
      addToast("PC Reset");
      setModal(null);
    } catch {
      addToast("Error", "error");
    }
  };

  const updateTable = async (name) => {
    await update(ref(db, modalData.path), { name });
    setModal(null);
  };

  const deleteCabin = async (section, id) => {
    if (confirm("Confirm deletion?")) {
      await remove(ref(db, `zones/${section}/${id}`));
      addToast("Cabin removed");
    }
  };

  // Renderers
  const renderList = (sec) => {
    const list = Object.entries(zones[sec] || {}).filter(
      ([_, c]) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.number.toLowerCase().includes(search.toLowerCase())
    );

    if (list.length === 0)
      return (
        <div className="flex flex-col items-center justify-center p-12 opacity-50">
          <i className="fas fa-box-open text-4xl mb-2 text-slate-300 dark:text-slate-700"></i>
          <p className="font-bold text-xs text-slate-400">
            No cabins found here.
          </p>
        </div>
      );

    return list.map(([id, c]) => (
      <CabinCard
        key={id}
        id={id}
        cabin={c}
        section={sec}
        isExpanded={expanded.has(id) || search.length > 0}
        toggle={() => toggleExp(id)}
        onDelete={() => deleteCabin(sec, id)}
        onEditTable={(p, n) => {
          setModalData({ path: p, name: n });
          setModal("editTable");
        }}
        onEditPC={(p, d, cn, tn, z) => {
          setModalData({
            path: p,
            ...d,
            extraInfo: { cabin: cn, table: tn, zone: z },
          });
          setModal("editPC");
        }}
      />
    ));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#020617] transition-colors duration-300">
      {/* SIDEBAR */}
      <aside
        className={`fixed md:relative z-50 h-full w-72 glass-panel border-r-0 md:border-r border-white/20 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="h-20 md:h-24 flex items-center px-6 md:px-8">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 mr-3">
            <i className="fas fa-globe"></i>
          </div>
          <div>
            <h1 className="font-extrabold text-lg md:text-xl tracking-tight text-slate-800 dark:text-white font-battambang">
              NetAdmin
            </h1>
            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Enterprise
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden ml-auto text-slate-400"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
          <p className="px-4 text-[9px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
            Analytics
          </p>
          <button
            onClick={() => handleNav("all")}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
              view === "all"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-500 hover:bg-white dark:hover:bg-white/5"
            }`}
          >
            <i className="fas fa-chart-pie w-5 text-center"></i> Dashboard
          </button>

          <p className="px-4 text-[9px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-8 mb-3">
            Zone Management
          </p>
          <button
            onClick={() => handleNav("RB")}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
              view === "RB"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-500 hover:bg-white dark:hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-4">
              <i className="fas fa-server w-5 text-center"></i> Zone B (Left)
            </div>
            <span className="px-2 py-0.5 rounded bg-white/20 text-[10px]">
              {Object.keys(zones.RB).length}
            </span>
          </button>
          <button
            onClick={() => handleNav("RA")}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
              view === "RA"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-500 hover:bg-white dark:hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-4">
              <i className="fas fa-layer-group w-5 text-center"></i> Zone A
              (Right)
            </div>
            <span className="px-2 py-0.5 rounded bg-white/20 text-[10px]">
              {Object.keys(zones.RA).length}
            </span>
          </button>
        </div>

        {/* User Profile */}
        <div className="p-6 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white dark:border-slate-800">
              AD
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">
                Admin User
              </p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wide">
                ● Online
              </p>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="ml-auto w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-indigo-500 transition-colors"
            >
              <i
                className={`fas ${theme === "dark" ? "fa-moon" : "fa-sun"}`}
              ></i>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-500 dark:text-slate-300"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight font-battambang">
                {view === "all"
                  ? "System Overview"
                  : `Zone ${view === "RB" ? "B" : "A"} Manager`}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                Realtime Network Monitoring
              </p>
            </div>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative group">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
              <input
                className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none font-bold text-xs text-slate-600 dark:text-slate-300 w-64 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="Search Cabins, IPs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setModal("addCabin")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 text-xs font-bold transition-transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
            >
              <i className="fas fa-plus"></i> New Cabin
            </button>
          </div>

          {/* Mobile Search Icon & Add Button */}
          <div className="flex md:hidden gap-2">
            <button
              onClick={() => setModal("addCabin")}
              className="bg-indigo-600 text-white w-9 h-9 rounded-lg flex items-center justify-center shadow-lg"
            >
              <i className="fas fa-plus text-xs"></i>
            </button>
          </div>
        </header>

        {/* Mobile Search Input */}
        <div className="md:hidden px-4 py-3 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-xs font-bold outline-none border border-transparent focus:border-indigo-500 dark:text-white"
              placeholder="Search cabins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32">
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Skeleton className="h-24 md:h-32 rounded-2xl" />
                <Skeleton className="h-24 md:h-32 rounded-2xl" />
                <Skeleton className="h-24 md:h-32 rounded-2xl" />
                <Skeleton className="h-24 md:h-32 rounded-2xl" />
              </div>
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          ) : (
            <>
              {view === "all" && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
                  <StatWidget
                    title="Total Devices"
                    value={stats.total}
                    icon="fa-desktop"
                    color="indigo"
                    delay="0"
                  />
                  <StatWidget
                    title="Active Online"
                    value={stats.active}
                    icon="fa-wifi"
                    trend={12}
                    color="emerald"
                    delay="100"
                  />
                  <StatWidget
                    title="System Idle"
                    value={stats.idle}
                    icon="fa-moon"
                    color="slate"
                    delay="200"
                  />
                  <StatWidget
                    title="Connection Issues"
                    value={stats.offline}
                    icon="fa-exclamation-triangle"
                    color="rose"
                    delay="300"
                  />
                </div>
              )}

              {view === "all" ? (
                <div className="grid xl:grid-cols-2 gap-8 animate-enter">
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-3 h-3 rounded bg-indigo-500"></span>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                        Zone B (Left Wing)
                      </h3>
                    </div>
                    {renderList("RB")}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-3 h-3 rounded bg-purple-500"></span>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                        Zone A (Right Wing)
                      </h3>
                    </div>
                    {renderList("RA")}
                  </div>
                </div>
              ) : (
                <div className="max-w-5xl mx-auto animate-enter">
                  {renderList(view)}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* MODALS INJECTION */}
      {modal === "addCabin" && (
        <AddCabinWizard
          onClose={() => setModal(null)}
          onCreate={createCabin}
          currentView={view}
        />
      )}
      {modal === "editPC" && (
        <PCDetailModal
          initialData={modalData}
          onClose={() => setModal(null)}
          onSave={updatePC}
          onDelete={resetPC}
        />
      )}
      {modal === "editTable" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-enter border border-white/10">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">
              Rename Table
            </h3>
            <input
              autoFocus
              className="w-full p-3 mb-4 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none font-bold dark:text-white"
              value={modalData.name}
              onChange={(e) =>
                setModalData({ ...modalData, name: e.target.value })
              }
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={() => updateTable(modalData.name)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => (
  <ThemeProvider>
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  </ThemeProvider>
);

const root = createRoot(document.getElementById("root"));
root.render(<App />);
