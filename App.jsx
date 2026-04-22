import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "lumber_crm_v2";
const initialData = { entries: [], tasks: [], nextId: 1 };

function loadData() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : initialData; }
  catch { return initialData; }
}
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

const LEAD_SOURCES = ["Cold Call", "Referral", "Job Site Visit", "Walk-in", "Social Media", "Other"];
const CUSTOMER_TYPES = ["Contractor", "Builder", "Developer", "Homeowner", "Other"];
const PROJECT_STATUSES = ["Active", "Pending", "Closed Won", "Closed Lost"];
const STATUS_COLORS = {
  "Active":       { bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  "Pending":      { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  "Closed Won":   { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6" },
  "Closed Lost":  { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
};

function genId(data) { const id = data.nextId; data.nextId++; return id; }
function fmtDate(iso) { if (!iso) return ""; return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function fmtDateTime(iso) { if (!iso) return ""; return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }); }
function daysSince(iso) { if (!iso) return 0; return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); }

const S = {
  app: { fontFamily: "'DM Sans', sans-serif", background: "#f8f7f4", minHeight: "100vh", maxWidth: "430px", margin: "0 auto", paddingBottom: "80px" },
  header: { background: "#1a1a2e", color: "#fff", padding: "18px 18px 14px", position: "sticky", top: 0, zIndex: 100 },
  hTitle: { fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px", color: "#fff", margin: 0 },
  hSub: { fontSize: "12px", color: "#8b8fa8", marginTop: "2px" },
  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", background: "#1a1a2e", display: "flex", borderTop: "1px solid #2d2d4e", zIndex: 200 },
  navBtn: (a) => ({ flex: 1, padding: "12px 0 10px", background: "none", border: "none", cursor: "pointer", color: a ? "#f0a500" : "#6b7280", fontSize: "10px", fontWeight: a ? 700 : 500, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }),
  card: { background: "#fff", borderRadius: "14px", marginBottom: "10px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" },
  btn: (v="primary") => ({
    background: v==="primary"?"#f0a500":v==="danger"?"#fee2e2":v==="success"?"#d1fae5":"#f3f4f6",
    color: v==="primary"?"#1a1a2e":v==="danger"?"#dc2626":v==="success"?"#065f46":"#374151",
    border:"none", borderRadius:"10px", padding:"10px 16px", fontWeight:700, fontSize:"13px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap"
  }),
  input: { width:"100%", padding:"10px 12px", border:"1.5px solid #e5e7eb", borderRadius:"10px", fontSize:"14px", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", outline:"none" },
  label: { fontSize:"11px", fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", display:"block", marginBottom:"5px" },
  select: { width:"100%", padding:"10px 12px", border:"1.5px solid #e5e7eb", borderRadius:"10px", fontSize:"14px", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", background:"#fff", outline:"none" },
  modal: { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:300, display:"flex", alignItems:"flex-end", justifyContent:"center" },
  modalInner: { background:"#fff", borderRadius:"20px 20px 0 0", padding:"24px 20px 36px", width:"100%", maxWidth:"430px", maxHeight:"85vh", overflowY:"auto" },
  secTitle: { fontSize:"11px", fontWeight:800, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"10px" },
  back: { background:"none", border:"none", color:"#f0a500", fontSize:"14px", fontWeight:700, cursor:"pointer", padding:0 },
  statCard: (bg) => ({ background:bg, borderRadius:"14px", padding:"16px", flex:"1", minWidth:"calc(50% - 5px)" }),
  pill: (active) => ({ padding:"5px 13px", borderRadius:"999px", fontSize:"12px", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", background:active?"#f0a500":"#f3f4f6", color:active?"#1a1a2e":"#6b7280", border:"none" }),
  tabBtn: (active) => ({ flex:1, padding:"13px 8px", background:"none", border:"none", borderBottom:active?"2px solid #f0a500":"2px solid transparent", color:active?"#f0a500":"#6b7280", fontWeight:700, fontSize:"14px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", marginBottom:"-2px" }),
};

function Badge({ n }) {
  if (!n) return null;
  return <span style={{ background:"#ef4444", color:"#fff", borderRadius:"999px", fontSize:"10px", fontWeight:700, padding:"1px 5px" }}>{n}</span>;
}

export default function App() {
  const [data, setData] = useState(() => loadData());
  const [tab, setTab] = useState("pipeline");
  const [pTab, setPTab] = useState("leads");
  const [view, setView] = useState("list");
  const [selId, setSelId] = useState(null);
  const [dTab, setDTab] = useState("projects");
  const [search, setSearch] = useState("");
  const [alerts, setAlerts] = useState([]);

  const [showProj, setShowProj] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  const [eForm, setEForm] = useState({ name:"", phone:"", type:"", leadSource:"", checkInDays:7 });
  const [pForm, setPForm] = useState({ name:"", status:"Active", description:"" });
  const [nForm, setNForm] = useState({ text:"", reminderDate:"" });
  const [tForm, setTForm] = useState({ title:"", date:"", entryId:"" });
  const [sFilt, setSFilt] = useState("thisMonth");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");

  const persist = useCallback((d) => { setData(d); saveData(d); }, []);

  useEffect(() => {
    setAlerts(data.entries.filter(e => {
      const d = daysSince(e.lastCheckIn || e.createdAt);
      return e.checkInDays && d >= e.checkInDays;
    }));
  }, [data.entries]);

  const sel = data.entries.find(e => e.id === selId);
  const leads = data.entries.filter(e => e.kind === "lead");
  const customers = data.entries.filter(e => e.kind === "customer");
  const list = (pTab === "leads" ? leads : customers).filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) || (e.phone||"").includes(search)
  );

  function addEntry() {
    if (!eForm.name.trim()) return;
    const d = { ...data, entries: [...data.entries] };
    d.entries.push({ id:genId(d), kind:pTab==="leads"?"lead":"customer", name:eForm.name.trim(), phone:eForm.phone.trim(), type:eForm.type, leadSource:eForm.leadSource, checkInDays:parseInt(eForm.checkInDays)||7, createdAt:new Date().toISOString(), convertedAt:null, lastCheckIn:null, projects:[], notes:[] });
    persist(d); setEForm({ name:"", phone:"", type:"", leadSource:"", checkInDays:7 }); setView("list");
  }

  function convertToCustomer() {
    persist({ ...data, entries: data.entries.map(e => e.id===selId ? {...e, kind:"customer", convertedAt:new Date().toISOString()} : e) });
    setShowConvert(false); setPTab("customers"); setView("list");
  }

  function checkIn(id) { persist({ ...data, entries: data.entries.map(e => e.id===id ? {...e, lastCheckIn:new Date().toISOString()} : e) }); }
  function deleteEntry(id) { persist({ ...data, entries: data.entries.filter(e => e.id!==id) }); setView("list"); }

  function addProject() {
    if (!pForm.name.trim()) return;
    const d = { ...data, entries: data.entries.map(e => { if(e.id!==selId) return e; const nd={...data}; return {...e, projects:[...(e.projects||[]), {id:genId(nd), name:pForm.name.trim(), status:pForm.status, description:pForm.description.trim(), createdAt:new Date().toISOString()}]}; }) };
    persist(d); setPForm({ name:"", status:"Active", description:"" }); setShowProj(false);
  }

  function updateProjStatus(eid, pid, status) {
    persist({ ...data, entries: data.entries.map(e => e.id!==eid?e : {...e, projects:e.projects.map(p => p.id===pid?{...p,status}:p)}) });
  }

  function deleteProject(eid, pid) {
    persist({ ...data, entries: data.entries.map(e => e.id!==eid?e : {...e, projects:e.projects.filter(p=>p.id!==pid)}) });
  }

  function addNote() {
    if (!nForm.text.trim()) return;
    const note = { id:genId(data), text:nForm.text.trim(), createdAt:new Date().toISOString(), reminderDate:nForm.reminderDate||null, reminderFired:false };
    const d = { ...data, entries: data.entries.map(e => e.id!==selId?e : {...e, notes:[...(e.notes||[]),note]}) };
    if (nForm.reminderDate) {
      const entry = data.entries.find(e=>e.id===selId);
      d.tasks = [...(d.tasks||[]), { id:genId(d), title:`Follow up: ${entry?.name} — "${nForm.text.trim().slice(0,40)}"`, date:nForm.reminderDate, entryId:selId, fromNote:true, createdAt:new Date().toISOString(), done:false }];
    }
    persist(d); setNForm({ text:"", reminderDate:"" }); setShowNote(false);
  }

  function deleteNote(eid, nid) { persist({ ...data, entries: data.entries.map(e => e.id!==eid?e : {...e, notes:e.notes.filter(n=>n.id!==nid)}) }); }

  function addTask() {
    if (!tForm.title.trim() || !tForm.date) return;
    const d = { ...data };
    d.tasks = [...(d.tasks||[]), { id:genId(d), title:tForm.title.trim(), date:tForm.date, entryId:tForm.entryId?parseInt(tForm.entryId):null, createdAt:new Date().toISOString(), done:false }];
    persist(d); setTForm({ title:"", date:"", entryId:"" }); setShowTask(false);
  }

  function toggleTask(id) { persist({ ...data, tasks: data.tasks.map(t => t.id===id?{...t,done:!t.done}:t) }); }
  function deleteTask(id) { persist({ ...data, tasks: data.tasks.filter(t=>t.id!==id) }); }

  function getStatsRange() {
    const now = new Date();
    if (sFilt==="thisMonth") return [new Date(now.getFullYear(),now.getMonth(),1), new Date(now.getFullYear(),now.getMonth()+1,0)];
    if (sFilt==="lastMonth") return [new Date(now.getFullYear(),now.getMonth()-1,1), new Date(now.getFullYear(),now.getMonth(),0)];
    if (sFilt==="custom" && cStart && cEnd) return [new Date(cStart), new Date(cEnd)];
    return [new Date(0), new Date()];
  }

  function getStats() {
    const [start,end] = getStatsRange();
    const inRange = data.entries.filter(e => { const d=new Date(e.createdAt); return d>=start && d<=end; });
    const totalLeads = inRange.filter(e => e.kind==="lead" || e.convertedAt).length;
    const converted = inRange.filter(e => e.kind==="customer" && e.convertedAt).length;
    const convRate = totalLeads>0 ? Math.round(converted/totalLeads*100) : 0;
    const allP = inRange.flatMap(e=>e.projects||[]);
    const won = allP.filter(p=>p.status==="Closed Won").length;
    const lost = allP.filter(p=>p.status==="Closed Lost").length;
    const active = allP.filter(p=>p.status==="Active").length;
    const closeRate = allP.length>0 ? Math.round(won/allP.length*100) : 0;
    return { totalLeads, converted, convRate, won, lost, active, closeRate, totalP:allP.length };
  }

  function getCalDays() {
    const tasks = (data.tasks||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
    const g = {};
    tasks.forEach(t => { const day=t.date.slice(0,10); if(!g[day]) g[day]=[]; g[day].push(t); });
    return g;
  }

  // ── ADD ENTRY VIEW ──────────────────────────────────────────────────────
  if (view==="addEntry") {
    const isLead = pTab==="leads";
    return (
      <div style={S.app}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet"/>
        <div style={S.header}>
          <button style={S.back} onClick={()=>{setView("list");setEForm({name:"",phone:"",type:"",leadSource:"",checkInDays:7});}}>← Back</button>
          <div style={{...S.hTitle, marginTop:"8px"}}>Add {isLead?"Lead":"Customer"}</div>
        </div>
        <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"14px"}}>
          <div><label style={S.label}>Name *</label><input style={S.input} placeholder="Full name or business" value={eForm.name} onChange={e=>setEForm(f=>({...f,name:e.target.value}))}/></div>
          <div><label style={S.label}>Phone</label><input style={S.input} placeholder="Phone number" value={eForm.phone} onChange={e=>setEForm(f=>({...f,phone:e.target.value}))}/></div>
          <div><label style={S.label}>Type</label><select style={S.select} value={eForm.type} onChange={e=>setEForm(f=>({...f,type:e.target.value}))}><option value="">Select...</option>{CUSTOMER_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label style={S.label}>Lead Source</label><select style={S.select} value={eForm.leadSource} onChange={e=>setEForm(f=>({...f,leadSource:e.target.value}))}><option value="">Select...</option>{LEAD_SOURCES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div>
            <label style={S.label}>Check-in Reminder (days)</label>
            <input style={S.input} type="number" min="1" value={eForm.checkInDays} onChange={e=>setEForm(f=>({...f,checkInDays:e.target.value}))}/>
            <div style={{fontSize:"11px",color:"#9ca3af",marginTop:"4px"}}>Notify me if no contact in this many days</div>
          </div>
          <button style={{...S.btn("primary"),width:"100%",padding:"14px"}} onClick={addEntry}>Add {isLead?"Lead":"Customer"}</button>
        </div>
      </div>
    );
  }

  // ── DETAIL VIEW ─────────────────────────────────────────────────────────
  if (view==="detail" && sel) {
    const e = sel;
    const days = daysSince(e.lastCheckIn||e.createdAt);
    const overdue = days >= e.checkInDays;
    const isLead = e.kind==="lead";
    return (
      <div style={S.app}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet"/>
        <div style={S.header}>
          <button style={S.back} onClick={()=>setView("list")}>← {isLead?"Leads":"Customers"}</button>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginTop:"8px"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <div style={S.hTitle}>{e.name}</div>
                <span style={{background:isLead?"#fef3c7":"#d1fae5",color:isLead?"#92400e":"#065f46",fontSize:"11px",fontWeight:700,padding:"2px 8px",borderRadius:"999px"}}>{isLead?"Lead":"Customer"}</span>
              </div>
              <div style={S.hSub}>{[e.phone,e.type,e.leadSource].filter(Boolean).join(" · ")}</div>
            </div>
            <button style={{...S.btn("danger"),fontSize:"12px",padding:"6px 10px"}} onClick={()=>deleteEntry(e.id)}>Delete</button>
          </div>
        </div>

        {/* Check-in bar */}
        <div style={{background:overdue?"#fef3c7":"#f0fdf4",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:"12px",color:overdue?"#92400e":"#166534",fontWeight:600}}>
            {overdue?`⚠️ No check-in in ${days} days`:`✓ Last contact ${days===0?"today":`${days}d ago`}`}
          </div>
          <button style={{...S.btn("primary"),fontSize:"12px",padding:"6px 12px"}} onClick={()=>checkIn(e.id)}>Check In</button>
        </div>

        {/* Convert button */}
        {isLead && (
          <div style={{padding:"10px 16px",background:"#f0fdf4",borderBottom:"1px solid #d1fae5"}}>
            <button style={{...S.btn("success"),width:"100%",padding:"11px"}} onClick={()=>setShowConvert(true)}>🎉 Convert to Customer</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{display:"flex",background:"#fff",borderBottom:"2px solid #f3f4f6"}}>
          {["projects","notes"].map(t=>(
            <button key={t} onClick={()=>setDTab(t)} style={S.tabBtn(dTab===t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)} ({t==="projects"?(e.projects?.length||0):(e.notes?.length||0)})
            </button>
          ))}
        </div>

        {dTab==="projects" && (
          <div style={{padding:"16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <div style={S.secTitle}>Projects</div>
              <button style={{...S.btn("primary"),fontSize:"12px",padding:"6px 12px"}} onClick={()=>setShowProj(true)}>+ Add</button>
            </div>
            {(e.projects||[]).length===0 && <div style={{textAlign:"center",color:"#9ca3af",fontSize:"14px",padding:"30px 0"}}>No projects yet</div>}
            {(e.projects||[]).map(p=>(
              <div key={p.id} style={{...S.card,padding:"14px"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:"15px",color:"#1a1a2e"}}>{p.name}</div>
                    {p.description && <div style={{fontSize:"13px",color:"#6b7280",marginTop:"3px"}}>{p.description}</div>}
                    <div style={{fontSize:"11px",color:"#9ca3af",marginTop:"4px"}}>{fmtDate(p.createdAt)}</div>
                  </div>
                  <button onClick={()=>deleteProject(e.id,p.id)} style={{background:"none",border:"none",color:"#d1d5db",cursor:"pointer",fontSize:"16px"}}>✕</button>
                </div>
                <div style={{marginTop:"10px",display:"flex",gap:"6px",flexWrap:"wrap"}}>
                  {PROJECT_STATUSES.map(s=>(
                    <button key={s} onClick={()=>updateProjStatus(e.id,p.id,s)} style={{
                      padding:"4px 10px",borderRadius:"999px",fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                      background:p.status===s?STATUS_COLORS[s].bg:"#f3f4f6",
                      color:p.status===s?STATUS_COLORS[s].text:"#9ca3af",
                      border:p.status===s?`1.5px solid ${STATUS_COLORS[s].dot}`:"1.5px solid transparent"
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {dTab==="notes" && (
          <div style={{padding:"16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <div style={S.secTitle}>Notes</div>
              <button style={{...S.btn("primary"),fontSize:"12px",padding:"6px 12px"}} onClick={()=>setShowNote(true)}>+ Add</button>
            </div>
            {(e.notes||[]).length===0 && <div style={{textAlign:"center",color:"#9ca3af",fontSize:"14px",padding:"30px 0"}}>No notes yet</div>}
            {(e.notes||[]).slice().reverse().map(n=>(
              <div key={n.id} style={{...S.card,padding:"14px"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div style={{fontSize:"14px",color:"#1a1a2e",lineHeight:1.5,flex:1}}>{n.text}</div>
                  <button onClick={()=>deleteNote(e.id,n.id)} style={{background:"none",border:"none",color:"#d1d5db",cursor:"pointer",fontSize:"16px",paddingLeft:"8px"}}>✕</button>
                </div>
                <div style={{marginTop:"8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:"11px",color:"#9ca3af"}}>{fmtDateTime(n.createdAt)}</div>
                  {n.reminderDate && (
                    <div style={{fontSize:"11px",background:n.reminderFired?"#d1fae5":"#fef3c7",color:n.reminderFired?"#065f46":"#92400e",padding:"3px 8px",borderRadius:"999px",fontWeight:600}}>
                      {n.reminderFired?"✓ Reminded":`🔔 ${fmtDate(n.reminderDate)}`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        {showProj && (
          <div style={S.modal} onClick={()=>setShowProj(false)}>
            <div style={S.modalInner} onClick={ev=>ev.stopPropagation()}>
              <div style={{fontSize:"18px",fontWeight:800,marginBottom:"16px",color:"#1a1a2e"}}>Add Project</div>
              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                <div><label style={S.label}>Name *</label><input style={S.input} placeholder="e.g. 3-unit framing" value={pForm.name} onChange={ev=>setPForm(f=>({...f,name:ev.target.value}))}/></div>
                <div><label style={S.label}>Status</label><select style={S.select} value={pForm.status} onChange={ev=>setPForm(f=>({...f,status:ev.target.value}))}>{PROJECT_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
                <div><label style={S.label}>Description</label><input style={S.input} placeholder="Optional details" value={pForm.description} onChange={ev=>setPForm(f=>({...f,description:ev.target.value}))}/></div>
                <button style={{...S.btn("primary"),width:"100%",padding:"13px"}} onClick={addProject}>Add Project</button>
                <button style={{...S.btn(),width:"100%",padding:"13px"}} onClick={()=>setShowProj(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showNote && (
          <div style={S.modal} onClick={()=>setShowNote(false)}>
            <div style={S.modalInner} onClick={ev=>ev.stopPropagation()}>
              <div style={{fontSize:"18px",fontWeight:800,marginBottom:"16px",color:"#1a1a2e"}}>Add Note</div>
              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                <div><label style={S.label}>Note *</label><textarea style={{...S.input,minHeight:"80px",resize:"vertical"}} placeholder="What happened? Follow up?" value={nForm.text} onChange={ev=>setNForm(f=>({...f,text:ev.target.value}))}/></div>
                <div>
                  <label style={S.label}>Reminder (optional)</label>
                  <div style={{display:"flex",gap:"8px",marginBottom:"8px",flexWrap:"wrap"}}>
                    {[{label:"1 Week",days:7},{label:"2 Weeks",days:14},{label:"1 Month",days:30}].map(opt=>{
                      const d=new Date(); d.setDate(d.getDate()+opt.days);
                      const val=d.toISOString().slice(0,16);
                      return <button key={opt.label} onClick={()=>setNForm(f=>({...f,reminderDate:val}))} style={S.pill(nForm.reminderDate===val)}>{opt.label}</button>;
                    })}
                  </div>
                  <input type="datetime-local" style={S.input} value={nForm.reminderDate} onChange={ev=>setNForm(f=>({...f,reminderDate:ev.target.value}))}/>
                  {nForm.reminderDate && <div style={{fontSize:"11px",color:"#6b7280",marginTop:"4px"}}>📅 Also added to your calendar automatically</div>}
                </div>
                <button style={{...S.btn("primary"),width:"100%",padding:"13px"}} onClick={addNote}>Save Note</button>
                <button style={{...S.btn(),width:"100%",padding:"13px"}} onClick={()=>setShowNote(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showConvert && (
          <div style={S.modal} onClick={()=>setShowConvert(false)}>
            <div style={S.modalInner} onClick={ev=>ev.stopPropagation()}>
              <div style={{fontSize:"18px",fontWeight:800,marginBottom:"8px",color:"#1a1a2e"}}>Convert to Customer?</div>
              <div style={{fontSize:"14px",color:"#6b7280",marginBottom:"20px"}}><strong>{e.name}</strong> will move from Leads to Customers. All projects and notes carry over.</div>
              <button style={{...S.btn("success"),width:"100%",padding:"13px",marginBottom:"10px"}} onClick={convertToCustomer}>🎉 Yes, Convert!</button>
              <button style={{...S.btn(),width:"100%",padding:"13px"}} onClick={()=>setShowConvert(false)}>Cancel</button>
            </div>
          </div>
        )}

        <nav style={S.nav}>
          {[["pipeline","🏗️","Pipeline"],["calendar","📅","Calendar"],["stats","📊","Stats"]].map(([t,icon,label])=>(
            <button key={t} style={S.navBtn(tab===t)} onClick={()=>{setTab(t);setView("list");}}>
              <span style={{fontSize:"20px"}}>{icon}</span>{label}
            </button>
          ))}
        </nav>
      </div>
    );
  }

  // ── MAIN TABS ──────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet"/>

      <div style={S.header}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={S.hTitle}>🪵 LumberCRM</div>
            <div style={S.hSub}>Your field sales tracker</div>
          </div>
          {alerts.length>0 && <div style={{background:"#ef4444",color:"#fff",borderRadius:"12px",padding:"5px 10px",fontSize:"12px",fontWeight:700}}>🔔 {alerts.length} overdue</div>}
        </div>
      </div>

      {/* PIPELINE */}
      {tab==="pipeline" && (
        <div>
          <div style={{display:"flex",background:"#fff",borderBottom:"2px solid #f3f4f6"}}>
            {[["leads","🎯 Leads",leads.length],["customers","🤝 Customers",customers.length]].map(([t,label,count])=>(
              <button key={t} onClick={()=>{setPTab(t);setSearch("");}} style={{...S.tabBtn(pTab===t),display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
                {label}
                <span style={{background:pTab===t?"#f0a500":"#e5e7eb",color:pTab===t?"#1a1a2e":"#6b7280",borderRadius:"999px",fontSize:"11px",fontWeight:800,padding:"1px 7px"}}>{count}</span>
              </button>
            ))}
          </div>

          <div style={{padding:"14px 16px 0",display:"flex",gap:"10px"}}>
            <input style={{...S.input,flex:1}} placeholder={`🔍 Search ${pTab}...`} value={search} onChange={e=>setSearch(e.target.value)}/>
            <button style={S.btn("primary")} onClick={()=>setView("addEntry")}>+ Add</button>
          </div>

          {alerts.filter(a=>pTab==="leads"?a.kind==="lead":a.kind==="customer").length>0 && (
            <div style={{padding:"12px 16px 0"}}>
              <div style={S.secTitle}>⚠️ Check-in Overdue</div>
              {alerts.filter(a=>pTab==="leads"?a.kind==="lead":a.kind==="customer").map(a=>(
                <div key={a.id} style={{background:"#fef3c7",borderRadius:"10px",padding:"10px 14px",marginBottom:"8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:"14px",color:"#92400e"}}>{a.name}</div>
                    <div style={{fontSize:"12px",color:"#b45309"}}>{daysSince(a.lastCheckIn||a.createdAt)}d since last contact</div>
                  </div>
                  <button style={{...S.btn("primary"),fontSize:"12px",padding:"6px 10px"}} onClick={()=>checkIn(a.id)}>✓</button>
                </div>
              ))}
            </div>
          )}

          <div style={{padding:"12px 16px 0"}}>
            <div style={S.secTitle}>{pTab==="leads"?"All Leads":"All Customers"} ({list.length})</div>
            {list.length===0 && (
              <div style={{textAlign:"center",padding:"40px 0",color:"#9ca3af"}}>
                <div style={{fontSize:"40px",marginBottom:"8px"}}>{pTab==="leads"?"🎯":"🤝"}</div>
                <div style={{fontWeight:700}}>No {pTab} yet</div>
                <div style={{fontSize:"13px"}}>Tap + Add to get started</div>
              </div>
            )}
            {list.map(e=>{
              const days=daysSince(e.lastCheckIn||e.createdAt);
              const overdue=days>=e.checkInDays;
              const won=(e.projects||[]).filter(p=>p.status==="Closed Won").length;
              return (
                <div key={e.id} style={{...S.card,cursor:"pointer"}} onClick={()=>{setSelId(e.id);setView("detail");setDTab("projects");}}>
                  <div style={{padding:"14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
                      <div style={{width:"42px",height:"42px",borderRadius:"12px",background:overdue?"#fef3c7":"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>
                        {overdue?"⚠️":e.kind==="lead"?"🎯":"🤝"}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:"15px",color:"#1a1a2e"}}>{e.name}</div>
                        <div style={{fontSize:"12px",color:"#6b7280"}}>{e.phone}</div>
                        <div style={{fontSize:"11px",color:"#9ca3af",marginTop:"2px"}}>{[e.type,e.leadSource].filter(Boolean).join(" · ")}</div>
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:"12px",color:overdue?"#ef4444":"#10b981",fontWeight:600}}>{days}d ago</div>
                      <div style={{fontSize:"11px",color:"#9ca3af"}}>{(e.projects||[]).length} projects</div>
                      {won>0 && <div style={{fontSize:"11px",color:"#3b82f6",fontWeight:600}}>{won} won</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CALENDAR */}
      {tab==="calendar" && (
        <div style={{padding:"16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
            <div style={S.secTitle}>Schedule</div>
            <button style={{...S.btn("primary"),fontSize:"12px",padding:"6px 12px"}} onClick={()=>setShowTask(true)}>+ Task</button>
          </div>
          {Object.keys(getCalDays()).length===0 && (
            <div style={{textAlign:"center",padding:"40px 0",color:"#9ca3af"}}>
              <div style={{fontSize:"40px",marginBottom:"8px"}}>📅</div>
              <div style={{fontWeight:700}}>No tasks yet</div>
              <div style={{fontSize:"13px"}}>Tap + Task to add one</div>
            </div>
          )}
          {Object.entries(getCalDays()).map(([day,tasks])=>{
            const isToday = day===new Date().toISOString().slice(0,10);
            const d = new Date(day+"T00:00:00");
            return (
              <div key={day} style={{marginBottom:"16px"}}>
                <div style={{fontSize:"13px",fontWeight:800,color:isToday?"#f0a500":"#6b7280",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.5px"}}>
                  {isToday?"Today":d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
                </div>
                {tasks.map(t=>{
                  const linked=t.entryId?data.entries.find(e=>e.id===t.entryId):null;
                  return (
                    <div key={t.id} style={{...S.card,padding:"12px 14px",display:"flex",alignItems:"center",gap:"12px"}}>
                      <button onClick={()=>toggleTask(t.id)} style={{width:"22px",height:"22px",borderRadius:"6px",border:`2px solid ${t.done?"#10b981":"#d1d5db"}`,background:t.done?"#10b981":"#fff",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:"12px"}}>
                        {t.done?"✓":""}
                      </button>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:"14px",color:t.done?"#9ca3af":"#1a1a2e",textDecoration:t.done?"line-through":"none"}}>{t.title}</div>
                        {linked && <div style={{fontSize:"11px",color:"#6b7280",marginTop:"2px"}}>{linked.kind==="lead"?"🎯":"🤝"} {linked.name}</div>}
                        {t.fromNote && <div style={{fontSize:"11px",color:"#9ca3af"}}>📝 Note reminder</div>}
                      </div>
                      <button onClick={()=>deleteTask(t.id)} style={{background:"none",border:"none",color:"#d1d5db",cursor:"pointer",fontSize:"16px"}}>✕</button>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {showTask && (
            <div style={S.modal} onClick={()=>setShowTask(false)}>
              <div style={S.modalInner} onClick={ev=>ev.stopPropagation()}>
                <div style={{fontSize:"18px",fontWeight:800,marginBottom:"16px",color:"#1a1a2e"}}>Add Task</div>
                <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                  <div><label style={S.label}>Task *</label><input style={S.input} placeholder="e.g. Call John about quote" value={tForm.title} onChange={e=>setTForm(f=>({...f,title:e.target.value}))}/></div>
                  <div><label style={S.label}>Date *</label><input type="date" style={S.input} value={tForm.date} onChange={e=>setTForm(f=>({...f,date:e.target.value}))}/></div>
                  <div>
                    <label style={S.label}>Link to Lead / Customer (optional)</label>
                    <select style={S.select} value={tForm.entryId} onChange={e=>setTForm(f=>({...f,entryId:e.target.value}))}>
                      <option value="">No one linked</option>
                      <optgroup label="Leads">{leads.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</optgroup>
                      <optgroup label="Customers">{customers.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</optgroup>
                    </select>
                  </div>
                  <button style={{...S.btn("primary"),width:"100%",padding:"13px"}} onClick={addTask}>Add Task</button>
                  <button style={{...S.btn(),width:"100%",padding:"13px"}} onClick={()=>setShowTask(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATS */}
      {tab==="stats" && (()=>{
        const s = getStats();
        return (
          <div style={{padding:"16px"}}>
            <div style={S.secTitle}>Stats Dashboard</div>
            <div style={{display:"flex",gap:"6px",marginBottom:"14px",flexWrap:"wrap"}}>
              {[["thisMonth","This Month"],["lastMonth","Last Month"],["allTime","All Time"],["custom","Custom"]].map(([v,l])=>(
                <button key={v} onClick={()=>setSFilt(v)} style={S.pill(sFilt===v)}>{l}</button>
              ))}
            </div>
            {sFilt==="custom" && (
              <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
                <div style={{flex:1}}><label style={S.label}>From</label><input type="date" style={S.input} value={cStart} onChange={e=>setCStart(e.target.value)}/></div>
                <div style={{flex:1}}><label style={S.label}>To</label><input type="date" style={S.input} value={cEnd} onChange={e=>setCEnd(e.target.value)}/></div>
              </div>
            )}

            {/* Lead → Customer */}
            <div style={{...S.card,padding:"16px",marginBottom:"10px"}}>
              <div style={{fontSize:"13px",fontWeight:700,color:"#6b7280",marginBottom:"10px"}}>LEAD → CUSTOMER CONVERSION</div>
              <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
                <div style={{flex:1,textAlign:"center"}}>
                  <div style={{fontSize:"28px",fontWeight:800,color:"#1a1a2e"}}>{s.totalLeads}</div>
                  <div style={{fontSize:"11px",color:"#6b7280",fontWeight:600}}>Leads Approached</div>
                </div>
                <div style={{fontSize:"22px",color:"#d1d5db"}}>→</div>
                <div style={{flex:1,textAlign:"center"}}>
                  <div style={{fontSize:"28px",fontWeight:800,color:"#10b981"}}>{s.converted}</div>
                  <div style={{fontSize:"11px",color:"#6b7280",fontWeight:600}}>Became Customers</div>
                </div>
              </div>
              <div style={{height:"8px",background:"#f3f4f6",borderRadius:"999px",marginTop:"12px",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${s.convRate}%`,background:"#10b981",borderRadius:"999px",transition:"width 0.5s"}}/>
              </div>
              <div style={{fontSize:"12px",color:"#9ca3af",marginTop:"6px",textAlign:"center"}}>{s.convRate}% conversion rate</div>
            </div>

            {/* Projects */}
            <div style={{fontSize:"13px",fontWeight:700,color:"#6b7280",marginBottom:"8px",marginTop:"4px"}}>PROJECTS</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"10px",marginBottom:"10px"}}>
              <div style={S.statCard("#d1fae5")}><div style={{fontSize:"26px",fontWeight:800,color:"#065f46"}}>{s.won}</div><div style={{fontSize:"11px",color:"#065f46",fontWeight:600}}>Closed Won</div></div>
              <div style={S.statCard("#fee2e2")}><div style={{fontSize:"26px",fontWeight:800,color:"#991b1b"}}>{s.lost}</div><div style={{fontSize:"11px",color:"#991b1b",fontWeight:600}}>Closed Lost</div></div>
              <div style={S.statCard("#dbeafe")}><div style={{fontSize:"26px",fontWeight:800,color:"#1e40af"}}>{s.active}</div><div style={{fontSize:"11px",color:"#1e40af",fontWeight:600}}>Active</div></div>
              <div style={S.statCard("#fff")}><div style={{fontSize:"26px",fontWeight:800,color:"#1a1a2e"}}>{s.totalP}</div><div style={{fontSize:"11px",color:"#6b7280",fontWeight:600}}>Total</div></div>
            </div>
            <div style={{...S.card,padding:"16px"}}>
              <div style={{fontSize:"13px",fontWeight:700,color:"#6b7280",marginBottom:"6px"}}>PROJECT CLOSE RATE</div>
              <div style={{fontSize:"36px",fontWeight:800,color:s.closeRate>=50?"#10b981":s.closeRate>=25?"#f59e0b":"#ef4444"}}>{s.closeRate}%</div>
              <div style={{height:"8px",background:"#f3f4f6",borderRadius:"999px",marginTop:"8px",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${s.closeRate}%`,background:s.closeRate>=50?"#10b981":s.closeRate>=25?"#f59e0b":"#ef4444",borderRadius:"999px",transition:"width 0.5s"}}/>
              </div>
              <div style={{fontSize:"12px",color:"#9ca3af",marginTop:"6px"}}>{s.won} won out of {s.totalP} projects</div>
            </div>
          </div>
        );
      })()}

      <nav style={S.nav}>
        {[["pipeline","🏗️","Pipeline"],["calendar","📅","Calendar"],["stats","📊","Stats"]].map(([t,icon,label])=>(
          <button key={t} style={S.navBtn(tab===t)} onClick={()=>setTab(t)}>
            <span style={{fontSize:"20px"}}>{icon}</span>
            {label}
            {t==="pipeline" && alerts.length>0 && <Badge n={alerts.length}/>}
          </button>
        ))}
      </nav>
    </div>
  );
}
