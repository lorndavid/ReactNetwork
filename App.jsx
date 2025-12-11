import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, remove, push } from 'firebase/database';

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyATNBHU58oq6TIFZ3V4VrtaN0z9MfnWJwQ",
  authDomain: "internet-manegement-di.firebaseapp.com",
  projectId: "internet-manegement-di",
  storageBucket: "internet-manegement-di.firebasestorage.app",
  messagingSenderId: "811368710372",
  appId: "1:811368710372:web:cea6c0f90facb83a702cf1",
  measurementId: "G-R5J0V7N6VD"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- Components ---

const NavItem = ({ icon, label, active, onClick, count }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 mb-1 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
    }`}
  >
    <div className="flex items-center gap-3">
      <i className={`fas ${icon} w-5 text-center text-lg ${active ? 'text-white' : 'text-slate-400'}`}></i>
      <span className="font-battambang text-sm font-bold tracking-wide pt-0.5">{label}</span>
    </div>
    {count !== undefined && (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
        {count}
      </span>
    )}
  </button>
);

const StatCard = ({ title, value, icon, color, bg }) => (
  <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5 font-inter">{title}</p>
      <p className="text-xl font-black text-slate-800 font-inter leading-none">{value}</p>
    </div>
    <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center text-sm shadow-sm`}>
      <i className={`fas ${icon} ${color}`}></i>
    </div>
  </div>
);

const FilterBar = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus }) => (
  <div className="mb-5 space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
    <div className="relative w-full">
      <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
      <input 
        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none custom-input transition-all font-battambang placeholder:text-slate-400"
        placeholder="Search Cabin, PC..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
    </div>
    
    <div className="flex items-center gap-3">
       <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider min-w-fit">FILTER:</span>
       <div className="relative flex-1">
         <select 
            className="w-full pl-3 pr-8 py-2 text-xs font-bold border border-slate-200 rounded-lg bg-white text-slate-600 outline-none focus:border-indigo-500 cursor-pointer appearance-none shadow-sm"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
         >
            <option value="all">All Status</option>
            <option value="connected">Online Only</option>
            <option value="offline">Offline Only</option>
            <option value="idle">Idle Only</option>
         </select>
         <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
       </div>
    </div>
  </div>
);

const PC_Card = ({ pc, pcNum, onClick }) => {
  let cardClass = "bg-white border-slate-200";
  let content;

  if (pc.status === 'connected') {
    // Online Style
    cardClass = "bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400/20";
    content = (
      <div className="flex flex-col items-center justify-center h-full w-full">
         <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1 shadow-sm">
            <i className="fas fa-check text-[10px]"></i>
         </div>
         <span className="text-emerald-900 font-bold font-battambang text-[10px] leading-tight text-center line-clamp-1 w-full px-1">
           {pc.info || 'User'}
         </span>
         <span className="text-emerald-600/70 font-inter text-[9px] font-bold mt-0.5">PC-{pcNum}</span>
      </div>
    );
  } else if (pc.status === 'offline') {
    // Offline Style
    cardClass = "bg-red-50 border-red-200";
    content = (
      <div className="flex flex-col items-center justify-center h-full opacity-80">
         <i className="fas fa-exclamation-circle text-lg mb-1 text-red-400"></i>
         <span className="text-red-400 font-bold font-inter text-[10px]">PC-{pcNum}</span>
      </div>
    );
  } else {
    // Idle Style
    content = (
      <div className="flex flex-col items-center justify-center h-full opacity-40">
         <i className="fas fa-desktop text-2xl mb-1 text-slate-400"></i>
         <span className="text-slate-400 font-bold font-inter text-[10px]">PC-{pcNum}</span>
      </div>
    );
  }

  return (
    <div 
      className={`pc-card relative aspect-[4/3] sm:aspect-[1.5/1] rounded-xl border flex flex-col cursor-pointer p-1 ${cardClass}`}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {content}
    </div>
  );
};

const CabinCard = ({ cabinId, cabin, isExpanded, toggleExpand, onDelete, section, onEditTable, onEditPC }) => {
  let activeCount = 0;
  let totalPC = 0;
  
  if (cabin.tables) {
    Object.values(cabin.tables).forEach(table => {
      Object.values(table.pcs).forEach(pc => {
        totalPC++;
        if(pc.status === 'connected') activeCount++;
      });
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
      {/* Cabin Header */}
      <div 
        className="px-4 py-3 flex items-center justify-between bg-white cursor-pointer active:bg-slate-50 transition-colors border-b border-slate-50"
        onClick={toggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-lg shadow-sm">
             <i className="fas fa-server"></i>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-bold text-slate-800 font-inter">{cabin.name}</h3>
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md font-bold uppercase tracking-wide">#{cabin.number}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-battambang">
              <span className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'status-active' : 'bg-slate-300'}`}></span>
              <span className="font-bold text-slate-700">{activeCount}</span> / {totalPC} កំពុងប្រើ
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           {cabin.equipment?.manage && (
             <span className="hidden sm:inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold border border-indigo-100 rounded">SW:{cabin.equipment.manage.ports}</span>
           )}
           <i className={`fas fa-chevron-down text-slate-300 text-[10px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}></i>
        </div>
      </div>

      {/* Cabin Body */}
      {isExpanded && (
        <div className="px-3 pb-3 bg-slate-50/50">
          <div className="space-y-4 pt-3">
            {cabin.tables && Object.entries(cabin.tables).map(([tableId, table]) => {
              
              let pcEntries = Object.entries(table.pcs);
              
              // Zone B: Reverse logic (PC 6 left, PC 1 right)
              if (section === 'RB') {
                pcEntries.reverse(); 
              }

              return (
                <div key={tableId}>
                   {/* Table Header */}
                   <div className="flex justify-between items-center mb-2 px-1">
                     <div className="flex items-center gap-2">
                       <div className="h-3 w-1 bg-indigo-500 rounded-full"></div>
                       <span className="text-xs font-bold text-slate-700 font-battambang">
                         {table.name.replace('Table', 'តុ')}
                       </span>
                     </div>
                     <button className="w-6 h-6 rounded-full bg-white border border-slate-100 text-slate-300 hover:text-indigo-500 hover:border-indigo-100 flex items-center justify-center transition-all shadow-sm" 
                       onClick={(e) => { e.stopPropagation(); onEditTable(`zones/${section}/${cabinId}/tables/${tableId}`, table.name); }}>
                       <i className="fas fa-pen text-[9px]"></i>
                     </button>
                   </div>
                   
                   {/* GRID LAYOUT UPDATE */}
                   {/* Mobile: 3 Columns (2 Rows). PC: 6 Columns (1 Row). */}
                   <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                     {pcEntries.map(([pcId, pc]) => {
                       const pcNum = parseInt(pcId.replace('pc', '')); 
                       return (
                         <PC_Card 
                            key={pcId} 
                            pc={pc} 
                            pcNum={pcNum} 
                            onClick={() => onEditPC(`zones/${section}/${cabinId}/tables/${tableId}/pcs/${pcId}`, pc)}
                         />
                       );
                     })}
                   </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-2 border-t border-slate-200 flex justify-end">
             <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                className="text-[9px] font-bold text-red-400 hover:text-red-600 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-battambang flex items-center gap-1.5 shadow-sm"
             >
               <i className="fas fa-trash-alt"></i> លុបបន្ទប់
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Modals ---

const Modal = ({ title, onClose, children, footer }) => (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh]">
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
        <h5 className="font-bold text-base text-slate-800 font-battambang">{title}</h5>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition-colors">
          <i className="fas fa-times text-sm"></i>
        </button>
      </div>
      <div className="p-5 overflow-y-auto font-battambang custom-scrollbar">
        {children}
      </div>
      {footer && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-2">
          {footer}
        </div>
      )}
    </div>
  </div>
);

const AddCabinModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '', number: '', section: 'RB',
    equipment: {
      manage: { checked: true, ports: '48', name: '' },
      router: { checked: false, ports: '12', name: '' },
      poe: { checked: false, ports: '24', name: '' }
    }
  });

  const updateEq = (type, field, val) => {
    setFormData(prev => ({
      ...prev,
      equipment: { ...prev.equipment, [type]: { ...prev.equipment[type], [field]: val } }
    }));
  };

  const handleCreate = () => {
    if(!formData.name || !formData.number) return;
    const finalEq = {};
    ['manage', 'router', 'poe'].forEach(t => {
      if(formData.equipment[t].checked) 
        finalEq[t] = { ports: formData.equipment[t].ports, name: formData.equipment[t].name || (t==='manage'?'Switch':t==='router'?'Router':'POE') };
    });
    onCreate({ ...formData, equipment: finalEq });
  };

  return (
    <Modal title="បន្ថែមបន្ទប់ថ្មី" onClose={onClose} footer={
      <>
        <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">បោះបង់</button>
        <button onClick={handleCreate} className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-200 transition-colors">បង្កើត</button>
      </>
    }>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">ឈ្មោះបន្ទប់</label>
            <input className="w-full p-2.5 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 outline-none font-bold text-slate-700 bg-slate-50 focus:bg-white transition-colors" 
              placeholder="ឧ. David" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">លេខកូដ</label>
            <input className="w-full p-2.5 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 outline-none font-bold text-slate-700 bg-slate-50 focus:bg-white transition-colors" 
              placeholder="R-01-B" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
          </div>
        </div>
        
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-2">តំបន់ (Zone)</label>
          <div className="grid grid-cols-2 gap-3">
            {['RB', 'RA'].map(sec => (
              <label key={sec} className="cursor-pointer relative group">
                <input type="radio" name="section" className="peer absolute opacity-0" checked={formData.section === sec} onChange={() => setFormData({...formData, section: sec})} />
                <div className="p-2.5 text-xs font-bold border-2 border-slate-100 rounded-lg text-center peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 text-slate-400 transition-all group-hover:bg-slate-50">
                  {sec === 'RB' ? 'Zone B (Left)' : 'Zone A (Right)'}
                </div>
              </label>
            ))}
          </div>
        </div>
        
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
           <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-2">Network Equipment</label>
           <div className="space-y-2">
             {['manage', 'router', 'poe'].map(type => (
               <div key={type} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                 <input type="checkbox" checked={formData.equipment[type].checked} onChange={e => updateEq(type, 'checked', e.target.checked)} className="w-4 h-4 rounded text-indigo-600 border-slate-300 ml-1" />
                 <span className="text-xs font-bold w-12 capitalize text-slate-600">{type === 'manage' ? 'SW' : type}</span>
                 {formData.equipment[type].checked && (
                   <select className="p-1 text-[10px] font-bold border bg-slate-50 rounded text-slate-700 ml-auto outline-none" value={formData.equipment[type].ports} onChange={e => updateEq(type, 'ports', e.target.value)}>
                     <option value="8">8P</option><option value="12">12P</option><option value="24">24P</option><option value="48">48P</option>
                   </select>
                 )}
               </div>
             ))}
           </div>
        </div>
      </div>
    </Modal>
  );
};

const EditPCModal = ({ initialData, onClose, onSave, onDelete }) => {
  const [data, setData] = useState({
    status: initialData.status || 'idle',
    sourceType: initialData.sourceType || 'Manage',
    sourceName: initialData.sourceName || '',
    port: initialData.port || '',
    info: initialData.info || ''
  });

  return (
    <Modal title="កែប្រែ PC" onClose={onClose} footer={
      <div className="flex w-full justify-between items-center">
        <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-600 font-bold px-1 transition-colors">Reset</button>
        <div className="flex gap-2">
           <button onClick={onClose} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">បោះបង់</button>
           <button onClick={() => onSave(data)} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm transition-colors">រក្សាទុក</button>
        </div>
      </div>
    }>
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Status</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              {id: 'idle', label: 'ទំនេរ'}, {id: 'connected', label: 'Online'}, {id: 'offline', label: 'Offline'}
            ].map(st => (
              <button key={st.id} onClick={() => setData({...data, status: st.id})}
                className={`p-2 text-[10px] font-bold uppercase rounded-lg border-2 transition-all ${data.status === st.id 
                  ? (st.id === 'connected' ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : st.id === 'offline' ? 'bg-red-50 border-red-400 text-red-700' : 'bg-white border-slate-500 text-slate-700') 
                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                {st.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
           <div className="mb-2">
             <label className="block text-[10px] font-bold text-slate-500 mb-1">User Name</label>
             <input className="w-full p-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 outline-none font-bold text-slate-700 focus:bg-white transition-colors" 
              placeholder="e.g. Lorn David" value={data.info} onChange={e => setData({...data, info: e.target.value})} />
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
           <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-2">Uplink Info</label>
           <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="col-span-2">
                <select className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white font-bold text-slate-600 outline-none focus:border-indigo-500" value={data.sourceType} onChange={e => setData({...data, sourceType: e.target.value})}>
                  <option value="Manage">Switch</option><option value="Router">Router</option><option value="POE">POE</option>
                </select>
              </div>
              <input className="w-full p-2 text-xs border border-slate-200 rounded-lg font-bold text-slate-700 text-center outline-none focus:border-indigo-500" placeholder="Port" value={data.port} onChange={e => setData({...data, port: e.target.value})} />
            </div>
            <input className="w-full p-2 text-xs border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-indigo-500" placeholder="Device Name / IP" value={data.sourceName} onChange={e => setData({...data, sourceName: e.target.value})} />
        </div>
      </div>
    </Modal>
  );
};

// --- Main App ---

function App() {
  const [currentView, setCurrentView] = useState('all'); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [zones, setZones] = useState({ RA: {}, RB: {} });
  const [stats, setStats] = useState({ total: 0, active: 0, idle: 0, offline: 0 });
  const [expandedCabins, setExpandedCabins] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Modals
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState({});

  useEffect(() => {
    const zonesRef = ref(db, 'zones');
    const unsubscribe = onValue(zonesRef, (snapshot) => {
      const data = snapshot.val() || { RA: {}, RB: {} };
      setZones(data);
      calculateStats(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const calculateStats = (data) => {
    let s = { total: 0, active: 0, idle: 0, offline: 0 };
    ['RA', 'RB'].forEach(z => {
      if(data[z]) Object.values(data[z]).forEach(cabin => {
        if(cabin.tables) Object.values(cabin.tables).forEach(t => {
          Object.values(t.pcs).forEach(pc => {
            s.total++;
            if(pc.status === 'connected') s.active++;
            else if(pc.status === 'offline') s.offline++;
            else s.idle++;
          });
        });
      });
    });
    setStats(s);
  };

  const handleNavClick = (view) => {
    setCurrentView(view);
    if(window.innerWidth < 768) setSidebarOpen(false);
  };

  const toggleCabin = (id) => {
    const newSet = new Set(expandedCabins);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedCabins(newSet);
  };

  // CRUD Operations
  const handleCreateCabin = async (formData) => {
    const tables = {};
    for (let t = 1; t <= 2; t++) { 
      const pcs = {};
      for (let p = 1; p <= 6; p++) {
        pcs[`pc${p}`] = { status: 'idle', sourceType: '', sourceName: '', port: '', info: '' };
      }
      tables[`table${t}`] = { name: `Table ${t}`, pcs: pcs };
    }

    const newCabin = {
      name: formData.name, number: formData.number, type: formData.section,
      createdAt: Date.now(), equipment: formData.equipment, tables: tables
    };

    await set(push(ref(db, `zones/${formData.section}`)), newCabin);
    setActiveModal(null);
  };

  const handleUpdateTable = async (name) => {
    await update(ref(db, modalData.path), { name });
    setActiveModal(null);
  };

  const handleUpdatePC = async (data) => {
    await update(ref(db, modalData.path), data);
    setActiveModal(null);
  };

  const handleDeletePC = async () => {
    await update(ref(db, modalData.path), { status: 'idle', info: '', sourceName: '', sourceType: 'Manage', port: '' });
    setActiveModal(null);
  };

  const deleteCabin = async (section, id) => {
    if(confirm("Delete this cabin?")) await remove(ref(db, `zones/${section}/${id}`));
  };

  // Helper to filter and render cabins
  const renderZoneList = (section) => {
    const items = zones[section] || {};
    
    // Filter Logic
    const filtered = Object.entries(items).filter(([_, cabin]) => {
      let matchesSearch = true;
      if (searchTerm) {
        const t = searchTerm.toLowerCase();
        const cabinMatch = cabin.name.toLowerCase().includes(t) || cabin.number.toLowerCase().includes(t);
        let pcMatch = false;
        if(cabin.tables) {
          pcMatch = Object.values(cabin.tables).some(table => 
             Object.values(table.pcs).some(pc => 
               (pc.info && pc.info.toLowerCase().includes(t)) || 
               (pc.sourceName && pc.sourceName.toLowerCase().includes(t))
             ) || table.name.toLowerCase().includes(t)
          );
        }
        matchesSearch = cabinMatch || pcMatch;
      }

      let matchesStatus = true;
      if (filterStatus !== 'all') {
        if(cabin.tables) {
           matchesStatus = Object.values(cabin.tables).some(table => 
              Object.values(table.pcs).some(pc => pc.status === filterStatus)
           );
        } else { matchesStatus = false; }
      }

      return matchesSearch && matchesStatus;
    });

    if(filtered.length === 0) return <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-300 font-bold text-sm bg-white mt-4">No results found</div>;

    return filtered.map(([id, cabin]) => (
      <CabinCard 
        key={id} cabinId={id} cabin={cabin} section={section}
        isExpanded={expandedCabins.has(id) || searchTerm !== ''}
        toggleExpand={() => toggleCabin(id)}
        onDelete={() => deleteCabin(section, id)}
        onEditTable={(p, n) => { setModalData({path:p, name:n}); setActiveModal('editTable'); }}
        onEditPC={(p, d) => { setModalData({path:p, ...d}); setActiveModal('editPC'); }}
      />
    ));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f3f4f6]">
      
      {/* Mobile Backdrop */}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/60 z-30 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)}></div>}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-40 w-72 h-full bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 shadow-2xl md:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-20 flex items-center px-6 bg-white">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white mr-3 shadow-lg shadow-indigo-200">
             <i className="fas fa-network-wired text-lg"></i>
           </div>
           <div>
             <span className="font-extrabold text-slate-800 text-xl tracking-tight font-battambang">NetworkDI</span>
             <p className="text-[10px] text-slate-400 font-bold tracking-wider">NETWORK SYSTEM</p>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-2">Main Menu</p>
          <NavItem icon="fa-chart-pie" label="តំបន់ទាំងអស់" active={currentView === 'all'} onClick={() => handleNavClick('all')} />
          <NavItem icon="fa-server" label="តំបន់ B (RB)" active={currentView === 'RB'} onClick={() => handleNavClick('RB')} count={Object.keys(zones.RB).length} />
          <NavItem icon="fa-layer-group" label="តំបន់ A (RA)" active={currentView === 'RA'} onClick={() => handleNavClick('RA')} count={Object.keys(zones.RA).length} />
          
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-6 mb-3 ml-2">Other</p>
          <NavItem icon="fa-life-ring" label="ជំនួយ" active={currentView === 'help'} onClick={() => handleNavClick('help')} />
        </div>

        <div className="p-5 border-t border-slate-50 text-center bg-white">
           
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#f3f4f6]">
        {/* Header */}
        <header className="h-16 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg mr-3 transition-colors">
              <i className="fas fa-bars text-xl"></i>
            </button>
            <h2 className="text-lg font-bold text-slate-800 font-battambang">
              {currentView === 'all' ? 'ផ្ទាំងគ្រប់គ្រងអុីនធើណេត' : currentView === 'help' ? 'មជ្ឈមណ្ឌលជំនួយ' : `តំបន់ ${currentView === 'RB' ? 'B' : 'A'}`}
            </h2>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-xs font-bold text-slate-700">Admin User</span>
                <span className="text-[10px] font-bold text-emerald-500">● Online</span>
             </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-white cursor-pointer">
              A
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar pb-24">
          
          {/* SEARCH & FILTER BAR - MAIN CONTENT */}
          {(currentView === 'all' || currentView === 'RA' || currentView === 'RB') && (
             <FilterBar 
                searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
                filterStatus={filterStatus} setFilterStatus={setFilterStatus} 
             />
          )}

          {loading ? (
            <div className="flex justify-center py-32 text-indigo-200"><i className="fas fa-circle-notch animate-spin text-4xl"></i></div>
          ) : (
            <>
              {currentView === 'help' ? (
                 <div className="flex flex-col items-center justify-center h-full text-center text-slate-300 font-battambang">
                   <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <i className="fas fa-book-open text-5xl text-slate-200"></i>
                   </div>
                   <h3 className="text-xl font-bold text-slate-400 mb-1">មជ្ឈមណ្ឌលជំនួយ</h3>
                   <p className="text-xs">មិនទាន់មានឯកសារនៅឡើយទេ</p>
                 </div>
              ) : (
                <>
                  {/* Stats */}
                  {currentView === 'all' && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <StatCard title="TOTAL DEVICES" value={stats.total} icon="fa-desktop" bg="bg-indigo-50" color="text-indigo-600" />
                      <StatCard title="ONLINE" value={stats.active} icon="fa-wifi" bg="bg-emerald-50" color="text-emerald-500" />
                      <StatCard title="IDLE" value={stats.idle} icon="fa-moon" bg="bg-slate-100" color="text-slate-400" />
                      <StatCard title="OFFLINE" value={stats.offline} icon="fa-exclamation" bg="bg-red-50" color="text-red-400" />
                    </div>
                  )}

                  {/* Overview Layout */}
                  {currentView === 'all' ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Zone B */}
                        <div>
                           <div className="flex items-center justify-between mb-4 px-1">
                             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                               <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm"></span> ZONE B (RB)
                             </h3>
                           </div>
                           {renderZoneList('RB')}
                        </div>

                        {/* Zone A */}
                        <div>
                           <div className="flex items-center justify-between mb-4 px-1">
                             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                               <span className="w-2.5 h-2.5 bg-purple-500 rounded-sm"></span> ZONE A (RA)
                             </h3>
                           </div>
                           {renderZoneList('RA')}
                        </div>
                    </div>
                  ) : (
                    /* Single Zone View */
                    <div className="max-w-5xl mx-auto">
                       {/* Add Cabin Button for Specific Zone */}
                       <div className="flex justify-end mb-4">
                          <button 
                             onClick={() => setActiveModal('addCabin')} 
                             className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 text-xs font-bold font-battambang flex items-center gap-2 transition-all transform hover:scale-105"
                           >
                             <i className="fas fa-plus text-sm"></i> បន្ថែមទូថ្មី
                           </button>
                       </div>
                       {renderZoneList(currentView)}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      {activeModal === 'addCabin' && <AddCabinModal onClose={() => setActiveModal(null)} onCreate={handleCreateCabin} />}
      {activeModal === 'editTable' && (
        <Modal title="កែប្រែឈ្មោះតុ" onClose={() => setActiveModal(null)} footer={
          <button onClick={() => handleUpdateTable(modalData.name)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold font-battambang shadow-md">រក្សាទុក</button>
        }>
          <input className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700 text-sm" value={modalData.name} onChange={e => setModalData({...modalData, name: e.target.value})} />
        </Modal>
      )}
      {activeModal === 'editPC' && <EditPCModal initialData={modalData} onClose={() => setActiveModal(null)} onSave={handleUpdatePC} onDelete={handleDeletePC} />}

    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);