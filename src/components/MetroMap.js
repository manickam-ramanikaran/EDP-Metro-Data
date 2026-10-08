import React from "react";
import { sources, layers, deliveries } from "../data/metroData";

export default function MetroMap({activeId,setActiveId,step,sourceFilter,deliveryFilter}){
  return <div className="metro-shell">
    <section className="sources-zone">
      <div className="zone-title">MULTIPLE DATA SOURCES</div>
      {sources.map((s,i)=><button key={s.id} className={`source-card ${sourceFilter!=="all"&&sourceFilter!==s.id?"muted":""}`} style={{"--c":s.color,"--delay":`${i*.13}s`}} onClick={()=>setActiveId(`source:${s.id}`)}>
        <span className="source-icon">{s.icon}</span><span>{s.name}</span><i className="source-line" />
      </button>)}
    </section>
    <section className="track-zone">
      <div className="rail"><div className="rail-glow"/><div className="train" style={{"--progress":`${Math.min(step,5)*20}%`}}><span>▰</span><span>▰</span><span>▰</span></div></div>
      <div className="stations">
        {layers.map((l,i)=>{
          const reached=step>i; const current=step===i+1;
          return <button key={l.id} className={`station ${reached?"reached":""} ${current?"current":""}`} style={{"--c":l.color,"--i":i}} onClick={()=>setActiveId(l.id)}>
            <span className="station-name">{l.name}</span><span className="pole"/><span className="station-orb"><b>{l.icon}</b></span><span className="station-caption">{l.purpose}</span>
          </button>
        })}
      </div>
      <div className="particles">{Array.from({length:18}).map((_,i)=><i key={i} style={{"--n":i,"--d":`${(i%7)*.35}s`}} />)}</div>
    </section>
    <section className="delivery-zone">
      <div className="zone-title">DELIVERY TERMINAL</div>
      {deliveries.map((d,i)=><button key={d.id} className={`delivery-card ${deliveryFilter!=="all"&&deliveryFilter!==d.id?"muted":""}`} style={{"--delay":`${i*.12}s`}} onClick={()=>setActiveId(`delivery:${d.id}`)}><span>{d.icon}</span>{d.name}</button>)}
    </section>
  </div>
}
