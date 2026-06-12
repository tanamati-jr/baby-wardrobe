import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    db: { schema: "public" },
    global: { fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(30000) }) }
  }
);

// ─── Default data ────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  {name:"Onesie",    emoji:"👶", color:"#ffd6e0"},
  {name:"Bodysuit",  emoji:"🩱", color:"#ffecd2"},
  {name:"Pajamas",   emoji:"😴", color:"#d6eaff"},
  {name:"Pants",     emoji:"👖", color:"#c8f0d0"},
  {name:"Shorts",    emoji:"🩳", color:"#fff4cc"},
  {name:"Shirt",     emoji:"👕", color:"#d9f5ff"},
  {name:"Dress",     emoji:"👗", color:"#f9d6ff"},
  {name:"Romper",    emoji:"🐸", color:"#d6ffe8"},
  {name:"Jacket",    emoji:"🧥", color:"#ffe8d6"},
  {name:"Cardigan",  emoji:"🧶", color:"#edd9ff"},
  {name:"Socks",     emoji:"🧦", color:"#ffd6f5"},
  {name:"Hat",       emoji:"🎩", color:"#d6f0ff"},
  {name:"Mittens",   emoji:"🧤", color:"#ddffd6"},
  {name:"Shoes",     emoji:"👟", color:"#fff0d6"},
  {name:"Swimsuit",  emoji:"🏊", color:"#d6f9ff"},
  {name:"Bibs",      emoji:"🍼", color:"#ffd6d6"},
  {name:"Sleepsuit", emoji:"🌙", color:"#e8d6ff"},
  {name:"Blanket",   emoji:"🛏", color:"#fef3c7"},
  {name:"Towel",     emoji:"🏖", color:"#cffafe"},
  {name:"Bag",       emoji:"🎒", color:"#e0e7ff"},
];

const DEFAULT_SIZES = ["Preemie","Newborn","0–3m","3–6m","6–9m","9–12m","12–18m","18–24m","2T","3T","4T","One Size"];
const PALETTE = ["#ffd6e0","#ffecd2","#d6eaff","#c8f0d0","#fff4cc","#d9f5ff","#f9d6ff","#d6ffe8","#ffe8d6","#edd9ff","#ffd6f5","#d6f0ff","#ddffd6","#fff0d6","#d6f9ff","#ffd6d6","#e8d6ff","#fef3c7","#cffafe","#e0e7ff"];
const EMOJIS = ["👶","🩱","😴","👖","🩳","👕","👗","🐸","🧥","🧶","🧦","🎩","🧤","👟","🏊","🍼","🌙","🛏","🏖","🎒","🧸","🎀","🌈","⭐","🦋","🐣","🐥","🌸","🍭","🎁"];

const groupKey = (type, size) => `${type}::${size}`;

function groupItems(items) {
  const groups = {};
  for (const item of items) {
    const k = groupKey(item.type, item.size);
    if (!groups[k]) groups[k] = { type: item.type, size: item.size, items: [] };
    groups[k].items.push(item);
  }
  for (const g of Object.values(groups)) g.owned = g.items.reduce((s,i)=>s+i.qty,0);
  return groups;
}

// ─── Manage Categories Screen ────────────────────────────────────────────────
function ManageCategories({ categories, onSave, onClose }) {
  const [cats, setCats] = useState(categories.map(c=>({...c})));
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🧸");
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [editingIdx, setEditingIdx] = useState(null);

  function startEdit(i) { setEditingIdx(i); setNewName(cats[i].name); setNewEmoji(cats[i].emoji); setNewColor(cats[i].color); }
  function saveEdit() {
    if (!newName.trim()) return;
    setCats(prev=>prev.map((c,i)=>i===editingIdx?{...c,name:newName.trim(),emoji:newEmoji,color:newColor}:c));
    setEditingIdx(null); setNewName(""); setNewEmoji("🧸"); setNewColor(PALETTE[0]);
  }
  function deleteAt(i) { setCats(prev=>prev.filter((_,j)=>j!==i)); if(editingIdx===i) setEditingIdx(null); }
  function addNew() {
    if (!newName.trim()) return;
    setCats(prev=>[...prev,{name:newName.trim(),emoji:newEmoji,color:newColor}]);
    setNewName(""); setNewEmoji("🧸"); setNewColor(PALETTE[0]); setAdding(false);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"#f4f0ff",zIndex:300,display:"flex",flexDirection:"column",fontFamily:"'Nunito',sans-serif",maxWidth:480,margin:"0 auto"}}>
      <div style={{background:"linear-gradient(135deg,#b79cff,#7ec8ff)",padding:"20px 18px 16px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.25)",border:"none",borderRadius:12,padding:"6px 12px",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>← Back</button>
        <div style={{flex:1,fontSize:18,fontWeight:900,color:"#fff"}}>Manage Categories</div>
        <button onClick={()=>{onSave(cats);onClose();}} style={{background:"rgba(255,255,255,0.25)",border:"none",borderRadius:12,padding:"6px 14px",color:"#fff",fontWeight:900,fontSize:14,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>Save</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 14px"}}>
        {!adding && editingIdx===null && (
          <button onClick={()=>setAdding(true)} style={{width:"100%",padding:"12px",borderRadius:14,border:"2px dashed #c4b5fd",background:"none",color:"#7c3aed",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"'Nunito',sans-serif",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>＋ Add new category</button>
        )}
        {(adding||editingIdx!==null) && (
          <div style={{background:"#fff",borderRadius:18,padding:16,marginBottom:16,boxShadow:"0 2px 14px rgba(0,0,0,0.08)"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#7c3aed",marginBottom:12}}>{editingIdx!==null?"Edit category":"New category"}</div>
            <label style={lbl}>Name</label>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Blanket" style={{...sinp,marginBottom:12}} />
            <label style={lbl}>Emoji</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
              {EMOJIS.map(e=>(
                <button key={e} onClick={()=>setNewEmoji(e)} style={{width:34,height:34,borderRadius:10,border:newEmoji===e?"2px solid #7c3aed":"1.5px solid #ede8ff",background:newEmoji===e?"#f0eaff":"#faf8ff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{e}</button>
              ))}
            </div>
            <label style={lbl}>Color</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
              {PALETTE.map(c=>(
                <button key={c} onClick={()=>setNewColor(c)} style={{width:28,height:28,borderRadius:"50%",background:c,border:newColor===c?"3px solid #7c3aed":"2px solid rgba(0,0,0,0.08)",cursor:"pointer"}} />
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setAdding(false);setEditingIdx(null);setNewName("");setNewEmoji("🧸");setNewColor(PALETTE[0]);}} style={{flex:1,padding:"10px",borderRadius:12,border:"1.5px solid #ede8ff",background:"#fff",color:"#9b8ec4",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>Cancel</button>
              <button onClick={editingIdx!==null?saveEdit:addNew} style={{flex:2,padding:"10px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#b79cff,#7ec8ff)",color:"#fff",fontWeight:900,fontSize:13,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>{editingIdx!==null?"Save changes":"Add category"}</button>
            </div>
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {cats.map((cat,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:16,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 8px rgba(0,0,0,0.05)",border:editingIdx===i?"2px solid #b79cff":"2px solid transparent"}}>
              <div style={{width:38,height:38,borderRadius:12,background:cat.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{cat.emoji}</div>
              <div style={{flex:1,fontWeight:800,fontSize:14,color:"#2d1f5e"}}>{cat.name}</div>
              <button onClick={()=>startEdit(i)} style={{background:"#f0eaff",border:"none",borderRadius:10,padding:"5px 10px",color:"#7c3aed",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>Edit</button>
              <button onClick={()=>deleteAt(i)} style={{background:"#fff0f0",border:"none",borderRadius:10,padding:"5px 10px",color:"#f87171",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Add Item Modal ──────────────────────────────────────────────────────────
function AddModal({ categories, sizes, onAdd, onClose }) {
  const [type, setType] = useState(categories[0]?.name||"");
  const [size, setSize] = useState(sizes[0]||"");
  const [qty, setQty] = useState(1);
  const [label, setLabel] = useState("");
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  function handleImg(e) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader(); r.onload = ev=>setImage(ev.target.result); r.readAsDataURL(file);
  }
  async function submit() {
    if (!type) return;
    setSaving(true);
    await onAdd({ id:Date.now(), type, size, qty:Number(qty), label, image });
    setSaving(false);
    onClose();
  }

  return (
    <Overlay>
      <Sheet style={{maxHeight:"90vh",overflowY:"auto"}}>
        <Pill />
        <RowBetween>
          <h2 style={sh2}>Add Item</h2>
          <XBtn onClick={onClose} />
        </RowBetween>
        <ImgPicker image={image} onClick={()=>fileRef.current.click()} />
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImg} />
        <Field label="Label (optional)">
          <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="e.g. Star print socks" style={sinp} />
        </Field>
        <Row2>
          <Field label="Category">
            <select value={type} onChange={e=>setType(e.target.value)} style={sinp}>
              {categories.map(c=><option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
            </select>
          </Field>
          <Field label="Size">
            <select value={size} onChange={e=>setSize(e.target.value)} style={sinp}>
              {sizes.map(s=><option key={s}>{s}</option>)}
            </select>
          </Field>
        </Row2>
        <Field label="Quantity">
          <QCounter value={qty} onChange={setQty} />
        </Field>
        <PrimaryBtn onClick={submit} style={{marginTop:8}} disabled={saving}>
          {saving ? "Saving…" : "Add to Wardrobe 🎀"}
        </PrimaryBtn>
      </Sheet>
    </Overlay>
  );
}

// ─── Goal Modal ──────────────────────────────────────────────────────────────
function GoalModal({ group, catMap, onSave, onClose }) {
  const [goal, setGoal] = useState(group.goal??0);
  const cat = catMap[group.type]||{};
  return (
    <Overlay>
      <div style={{background:"#fff",borderRadius:24,padding:28,width:"100%",maxWidth:340,fontFamily:"'Nunito',sans-serif",boxShadow:"0 8px 40px rgba(0,0,0,0.13)"}}>
        <h2 style={{...sh2,marginBottom:4}}>Set Target</h2>
        <p style={{fontSize:13,color:"#b0a0d0",marginBottom:20,fontWeight:700}}>{cat.emoji} {group.type} · {group.size}</p>
        <p style={{fontSize:13,color:"#888",marginBottom:14}}>You own <b style={{color:"#7c3aed"}}>{group.owned}</b>. How many do you need in total?</p>
        <QCounter value={goal} onChange={setGoal} large />
        <div style={{display:"flex",gap:10,marginTop:22}}>
          <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
          <PrimaryBtn onClick={()=>{onSave(goal);onClose();}}>Save</PrimaryBtn>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Detail Drawer ───────────────────────────────────────────────────────────
function DetailDrawer({ group, catMap, onClose, onDeleteItem, onSetGoal }) {
  const toBuy = Math.max(0,(group.goal??0)-group.owned);
  const hasGoal = (group.goal??0)>0;
  const cat = catMap[group.type]||{};
  return (
    <Overlay onBgClick={onClose}>
      <Sheet style={{maxHeight:"85vh",overflowY:"auto"}}>
        <Pill />
        <RowBetween style={{marginBottom:16}}>
          <div>
            <div style={{fontSize:18,fontWeight:900,color:"#2d1f5e"}}>{cat.emoji} {group.type}</div>
            <div style={{fontSize:12,fontWeight:700,color:"#b0a0d0",marginTop:2}}>{group.size}</div>
          </div>
          <XBtn onClick={onClose} />
        </RowBetween>
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {[
            {label:"Owned",value:group.owned,color:"#7c3aed",bg:"#f0eaff"},
            {label:"Target",value:hasGoal?group.goal:"—",color:"#0ea5e9",bg:"#e0f5ff"},
            {label:"To Buy",value:hasGoal?toBuy:"—",color:"#ff7eb6",bg:"#fff0f7"},
          ].map(s=>(
            <div key={s.label} style={{flex:1,background:s.bg,borderRadius:14,padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:900,color:s.color}}>{s.value}</div>
              <div style={{fontSize:9,fontWeight:800,color:s.color,opacity:0.7,textTransform:"uppercase",letterSpacing:0.5}}>{s.label}</div>
            </div>
          ))}
        </div>
        {hasGoal && (
          <div style={{marginBottom:18}}>
            <div style={{height:8,borderRadius:8,background:"#f0eaff",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.min(100,Math.round((group.owned/group.goal)*100))}%`,borderRadius:8,background:group.owned>=group.goal?"#6ee7b7":"linear-gradient(90deg,#b79cff,#7ec8ff)",transition:"width 0.3s"}} />
            </div>
          </div>
        )}
        <button onClick={onSetGoal} style={{width:"100%",padding:"9px",borderRadius:12,border:"1.5px dashed #ded6ff",background:"none",color:"#9b8ec4",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"'Nunito',sans-serif",marginBottom:20}}>
          {hasGoal?`🎯 Change target (currently ${group.goal})`:"＋ Set a target"}
        </button>
        <div style={{fontSize:11,fontWeight:800,color:"#b0a0d0",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Items ({group.items.length})</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
          {group.items.map(item=>(
            <div key={item.id} style={{borderRadius:16,overflow:"hidden",background:"#faf8ff",border:"1.5px solid #f0eaff",position:"relative"}}>
              <div style={{height:90,background:cat.color||"#f0eaff",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                {item.image?<img src={item.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:<span style={{fontSize:32}}>{cat.emoji||"📦"}</span>}
              </div>
              <div style={{padding:"8px 10px 10px"}}>
                <div style={{fontSize:12,fontWeight:800,color:"#2d1f5e",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.label||item.type}</div>
                <div style={{fontSize:11,color:"#b0a0d0",fontWeight:700,marginTop:1}}>qty: {item.qty}</div>
              </div>
              <button onClick={()=>onDeleteItem(item.id)} style={{position:"absolute",top:6,right:6,width:22,height:22,borderRadius:"50%",background:"rgba(255,255,255,0.85)",border:"none",cursor:"pointer",fontSize:11,color:"#aaa",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
          ))}
        </div>
      </Sheet>
    </Overlay>
  );
}

// ─── Group Card ──────────────────────────────────────────────────────────────
function GroupCard({ group, cat, onClick }) {
  const owned = group.owned;
  const goal = group.goal??0;
  const toBuy = Math.max(0,goal-owned);
  const pct = goal>0?Math.min(100,Math.round((owned/goal)*100)):null;
  const isComplete = goal>0&&owned>=goal;
  const previewImgs = group.items.filter(i=>i.image).slice(0,3);
  return (
    <div onClick={onClick} style={{background:"#fff",borderRadius:20,overflow:"hidden",boxShadow:"0 2px 14px rgba(0,0,0,0.07)",cursor:"pointer",userSelect:"none"}}>
      <div style={{height:80,background:cat?.color||"#f0eaff",position:"relative",overflow:"hidden",display:"flex"}}>
        {previewImgs.length>0
          ?previewImgs.map((item,i)=><img key={item.id} src={item.image} alt="" style={{flex:1,minWidth:0,objectFit:"cover",height:"100%",borderRight:i<previewImgs.length-1?"2px solid rgba(255,255,255,0.5)":"none"}} />)
          :<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:36}}>{cat?.emoji||"📦"}</span></div>
        }
        {isComplete&&<span style={{position:"absolute",top:7,right:7,fontSize:16}}>✅</span>}
        {!isComplete&&toBuy>0&&<span style={{position:"absolute",top:7,right:7,background:"#ff7eb6",color:"#fff",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:800}}>🛍 {toBuy}</span>}
        {previewImgs.length>0&&group.items.length>previewImgs.length&&<span style={{position:"absolute",bottom:6,left:8,background:"rgba(0,0,0,0.35)",color:"#fff",borderRadius:20,padding:"1px 7px",fontSize:10,fontWeight:800}}>+{group.items.length-previewImgs.length} more</span>}
      </div>
      <div style={{padding:"10px 12px 12px"}}>
        <div style={{fontWeight:900,fontSize:13,color:"#2d1f5e"}}>{group.type}</div>
        <div style={{fontSize:11,fontWeight:700,color:"#b0a0d0",marginBottom:6}}>{group.size}</div>
        {pct!==null&&<div style={{marginBottom:6}}><div style={{height:5,borderRadius:5,background:"#f0eaff",overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,borderRadius:5,background:isComplete?"#6ee7b7":"linear-gradient(90deg,#b79cff,#7ec8ff)"}} /></div></div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:18,fontWeight:900,color:"#7c3aed"}}>{owned} <span style={{fontSize:11,fontWeight:700,color:"#ccc"}}>owned</span></span>
          {goal>0&&<span style={{fontSize:11,fontWeight:800,color:"#b0a0d0"}}>of {goal}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Shopping List ───────────────────────────────────────────────────────────
function ShoppingList({ groups, catMap }) {
  const needed = Object.values(groups).filter(g=>(g.goal??0)>0&&g.owned<g.goal);
  if (!needed.length) return <Empty icon="🎉" title="You're all stocked up!" sub="Set targets on items to track what to buy." />;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {needed.map(g=>{
        const toBuy=g.goal-g.owned; const cat=catMap[g.type]||{};
        return (
          <div key={groupKey(g.type,g.size)} style={{background:"#fff",borderRadius:16,padding:"13px 14px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 10px rgba(0,0,0,0.06)"}}>
            <div style={{width:48,height:48,borderRadius:14,background:cat.color||"#f0eaff",flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
              {g.items.find(i=>i.image)?<img src={g.items.find(i=>i.image).image} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.7}} />:<span style={{fontSize:24}}>{cat.emoji||"📦"}</span>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:900,color:"#2d1f5e"}}>{g.type}</div>
              <div style={{fontSize:11,fontWeight:700,color:"#b0a0d0"}}>{g.size} · have {g.owned}, need {g.goal}</div>
            </div>
            <div style={{background:"#fff0f7",color:"#ff7eb6",borderRadius:20,padding:"6px 14px",fontSize:16,fontWeight:900,flexShrink:0}}>×{toBuy}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Design system ───────────────────────────────────────────────────────────
const Overlay = ({children,onBgClick}) => (
  <div onClick={onBgClick} style={{position:"fixed",inset:0,background:"rgba(20,10,40,0.4)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
    <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480}}>{children}</div>
  </div>
);
const Sheet = ({children,style={}}) => <div style={{background:"#fff",borderRadius:"28px 28px 0 0",padding:"20px 18px 36px",fontFamily:"'Nunito',sans-serif",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)",...style}}>{children}</div>;
const Pill = () => <div style={{width:40,height:4,background:"#e0d8ff",borderRadius:4,margin:"0 auto 18px"}} />;
const RowBetween = ({children,style={}}) => <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,...style}}>{children}</div>;
const Row2 = ({children}) => <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>{children}</div>;
const XBtn = ({onClick}) => <button onClick={onClick} style={{background:"#f0eaff",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:15,color:"#9b8ec4",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>;
const sh2 = {margin:0,fontSize:19,fontWeight:900,color:"#2d1f5e"};
const sinp = {width:"100%",padding:"10px 12px",borderRadius:12,border:"1.5px solid #ede8ff",fontSize:14,fontFamily:"'Nunito',sans-serif",outline:"none",background:"#fdfcff",boxSizing:"border-box",color:"#2d1f5e"};
const lbl = {display:"block",fontSize:10,fontWeight:800,color:"#9b8ec4",marginBottom:4,letterSpacing:1,textTransform:"uppercase"};
const Field = ({label,children}) => <div style={{marginBottom:12}}><label style={lbl}>{label}</label>{children}</div>;
const PrimaryBtn = ({children,onClick,style={},disabled=false}) => <button onClick={onClick} disabled={disabled} style={{width:"100%",padding:13,borderRadius:14,border:"none",background:disabled?"#d1c4f5":"linear-gradient(135deg,#b79cff,#7ec8ff)",color:"#fff",fontSize:15,fontWeight:900,cursor:disabled?"not-allowed":"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 4px 18px rgba(140,100,255,0.3)",...style}}>{children}</button>;
const SecondaryBtn = ({children,onClick}) => <button onClick={onClick} style={{flex:1,padding:12,borderRadius:14,border:"1.5px solid #ede8ff",background:"#fff",color:"#9b8ec4",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>{children}</button>;
const ImgPicker = ({image,onClick}) => (
  <div onClick={onClick} style={{width:"100%",height:110,borderRadius:18,border:"2px dashed #d8ceff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:14,overflow:"hidden",background:"#faf8ff"}}>
    {image?<img src={image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{textAlign:"center",color:"#c4b8f0"}}><div style={{fontSize:28}}>📷</div><div style={{fontSize:12,marginTop:3,fontWeight:700}}>Tap to upload photo</div></div>}
  </div>
);
const QCounter = ({value,onChange,large=false}) => {
  const sz=large?42:34,fsz=large?20:16;
  return (
    <div style={{display:"flex",alignItems:"center",gap:14,marginTop:4}}>
      <button onClick={()=>onChange(v=>Math.max(0,Number(v)-1))} style={{width:sz,height:sz,borderRadius:"50%",border:"1.5px solid #ede8ff",background:"#faf8ff",cursor:"pointer",fontSize:fsz,fontWeight:900,color:"#8b5cf6",display:"flex",alignItems:"center",justifyContent:"center",padding:0,fontFamily:"'Nunito',sans-serif"}}>−</button>
      <span style={{fontSize:large?28:18,fontWeight:900,color:"#2d1f5e",minWidth:32,textAlign:"center"}}>{value}</span>
      <button onClick={()=>onChange(v=>Number(v)+1)} style={{width:sz,height:sz,borderRadius:"50%",border:"1.5px solid #ede8ff",background:"#faf8ff",cursor:"pointer",fontSize:fsz,fontWeight:900,color:"#8b5cf6",display:"flex",alignItems:"center",justifyContent:"center",padding:0,fontFamily:"'Nunito',sans-serif"}}>+</button>
    </div>
  );
};
const Empty = ({icon,title,sub}) => (
  <div style={{textAlign:"center",padding:"50px 20px",color:"#ccc"}}>
    <div style={{fontSize:44}}>{icon}</div>
    <div style={{marginTop:10,fontSize:15,fontWeight:700,color:"#bbb"}}>{title}</div>
    {sub&&<div style={{fontSize:12,marginTop:4}}>{sub}</div>}
  </div>
);

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [sizes] = useState(DEFAULT_SIZES);
  const [items, setItems] = useState([]);
  const [goals, setGoals] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("wardrobe");
  const [screen, setScreen] = useState("main");
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState(null);
  const [goalFor, setGoalFor] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [filterSize, setFilterSize] = useState("All");

  // ── Load data from Supabase on mount ──
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: itemsData }, { data: goalsData }] = await Promise.all([
        supabase.from("items").select("*").order("created_at", { ascending: false }),
        supabase.from("goals").select("*"),
      ]);
      if (itemsData) setItems(itemsData);
      if (goalsData) {
        const g = {};
        for (const row of goalsData) g[row.id] = row.goal;
        setGoals(g);
      }
      setLoading(false);
    }
    load();

    // ── Realtime sync ──
    const channel = supabase.channel("realtime-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, () => load())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function addItem(item) {
    const { data } = await supabase.from("items").insert([{
      id: item.id, type: item.type, size: item.size,
      qty: item.qty, label: item.label, image: item.image,
    }]).select();
    if (data) setItems(prev => [data[0], ...prev]);
  }

  async function deleteItem(id) {
    await supabase.from("items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  async function saveGoal(type, size, goal) {
    const k = groupKey(type, size);
    await supabase.from("goals").upsert([{ id: k, goal }]);
    setGoals(prev => ({ ...prev, [k]: goal }));
  }

  const catMap = Object.fromEntries(categories.map(c=>[c.name,c]));
  const rawGroups = groupItems(items);
  const groups = {};
  for (const [k,g] of Object.entries(rawGroups)) groups[k]={...g,goal:goals[k]??0};
  const liveDetail = detail ? groups[groupKey(detail.type,detail.size)] : null;

  const usedTypes = ["All",...categories.filter(c=>Object.values(groups).some(g=>g.type===c.name)).map(c=>c.name)];
  const usedSizes = ["All",...sizes.filter(s=>Object.values(groups).some(g=>g.size===s))];
  const filtered = Object.values(groups).filter(g=>(filterType==="All"||g.type===filterType)&&(filterSize==="All"||g.size===filterSize));
  const totalOwned = Object.values(groups).reduce((s,g)=>s+g.owned,0);
  const totalToBuy = Object.values(groups).filter(g=>g.goal>0&&g.owned<g.goal).reduce((s,g)=>s+Math.max(0,g.goal-g.owned),0);

  if (screen==="manage") return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}body{background:#f4f0ff;font-family:'Nunito',sans-serif;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:#ddd;border-radius:10px;}select{-webkit-appearance:none;}`}</style>
      <ManageCategories categories={categories} onSave={cats=>setCategories(cats)} onClose={()=>setScreen("main")} />
    </>
  );

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}body{background:#f4f0ff;font-family:'Nunito',sans-serif;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:#ddd;border-radius:10px;}select{-webkit-appearance:none;}`}</style>

      <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",paddingBottom:90}}>
        <div style={{background:"linear-gradient(150deg,#b79cff 0%,#7ec8ff 100%)",padding:"32px 20px 22px",borderBottomLeftRadius:30,borderBottomRightRadius:30,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-30,right:-30,width:130,height:130,borderRadius:"50%",background:"rgba(255,255,255,0.08)"}} />
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <div style={{fontSize:12,fontWeight:800,color:"rgba(255,255,255,0.7)",letterSpacing:2,textTransform:"uppercase"}}>Baby's</div>
            <button onClick={()=>setScreen("manage")} style={{background:"rgba(255,255,255,0.22)",border:"none",borderRadius:12,padding:"5px 12px",color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>⚙ Categories</button>
          </div>
          <div style={{fontSize:26,fontWeight:900,color:"#fff",letterSpacing:-0.5,marginBottom:20}}>Mini Wardrobe 🎀</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {[
              {label:"Categories",value:Object.keys(groups).length,icon:"👗",bg:"rgba(255,255,255,0.18)"},
              {label:"Owned",value:totalOwned,icon:"✅",bg:"rgba(255,255,255,0.18)"},
              {label:"To Buy",value:totalToBuy,icon:"🛒",bg:"rgba(255,100,150,0.28)"},
            ].map(s=>(
              <div key={s.label} style={{background:s.bg,borderRadius:16,padding:"10px 6px",textAlign:"center"}}>
                <div style={{fontSize:18}}>{s.icon}</div>
                <div style={{fontSize:20,fontWeight:900,color:"#fff"}}>{s.value}</div>
                <div style={{fontSize:9,fontWeight:800,color:"rgba(255,255,255,0.75)",textTransform:"uppercase",letterSpacing:0.5}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{padding:"18px 14px 0"}}>
          {loading ? (
            <div style={{textAlign:"center",padding:"60px 20px",color:"#c4b5fd"}}>
              <div style={{fontSize:36,marginBottom:12}}>🎀</div>
              <div style={{fontWeight:800,fontSize:15}}>Loading your wardrobe…</div>
            </div>
          ) : (<>
            <div style={{display:"flex",gap:6,marginBottom:18,background:"#ece6ff",borderRadius:14,padding:4}}>
              {["wardrobe","shopping"].map(t=>(
                <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"9px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:13,background:tab===t?"#fff":"transparent",color:tab===t?"#7c3aed":"#bbb",boxShadow:tab===t?"0 2px 8px rgba(0,0,0,0.08)":"none",transition:"all 0.2s"}}>
                  {t==="wardrobe"?"👗 Wardrobe":"🛒 Shopping List"}
                </button>
              ))}
            </div>

            {tab==="wardrobe"&&(<>
              {Object.keys(groups).length>0&&(<>
                <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4,marginBottom:6}}>
                  {usedTypes.map(t=><button key={t} onClick={()=>setFilterType(t)} style={{flexShrink:0,padding:"5px 12px",borderRadius:20,border:"none",background:filterType===t?"#7c3aed":"#fff",color:filterType===t?"#fff":"#999",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>{t}</button>)}
                </div>
                <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4,marginBottom:14}}>
                  {usedSizes.map(s=><button key={s} onClick={()=>setFilterSize(s)} style={{flexShrink:0,padding:"5px 12px",borderRadius:20,border:"none",background:filterSize===s?"#7ec8ff":"#fff",color:filterSize===s?"#fff":"#999",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>{s}</button>)}
                </div>
              </>)}
              {filtered.length===0
                ?<Empty icon="👶" title={Object.keys(groups).length===0?"No items yet!":"No items match filters."} sub={Object.keys(groups).length===0?"Tap + to add your first item.":undefined} />
                :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {filtered.map(g=><GroupCard key={groupKey(g.type,g.size)} group={g} cat={catMap[g.type]} onClick={()=>setDetail(g)} />)}
                </div>
              }
            </>)}
            {tab==="shopping"&&<ShoppingList groups={groups} catMap={catMap} />}
          </>)}
        </div>
      </div>

      <button onClick={()=>setShowAdd(true)} style={{position:"fixed",bottom:24,right:20,width:58,height:58,borderRadius:"50%",background:"linear-gradient(135deg,#b79cff,#7ec8ff)",border:"none",color:"#fff",fontSize:28,cursor:"pointer",boxShadow:"0 6px 24px rgba(130,100,255,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>＋</button>

      {showAdd&&<AddModal categories={categories} sizes={sizes} onAdd={addItem} onClose={()=>setShowAdd(false)} />}
      {liveDetail&&!goalFor&&(
        <DetailDrawer group={liveDetail} catMap={catMap} onClose={()=>setDetail(null)} onDeleteItem={id=>{deleteItem(id);if(liveDetail.items.length<=1)setDetail(null);}} onSetGoal={()=>setGoalFor(liveDetail)} />
      )}
      {goalFor&&(
        <GoalModal group={goalFor} catMap={catMap} onSave={goal=>saveGoal(goalFor.type,goalFor.size,goal)} onClose={()=>setGoalFor(null)} />
      )}
    </>
  );
}
