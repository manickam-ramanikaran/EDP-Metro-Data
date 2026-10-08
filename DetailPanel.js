import React from "react";
import {sources,layers,deliveries} from "../data/metroData";
export default function DetailPanel({activeId,onClose}){
  if(!activeId) return null;
  let item,kind="layer";
  if(activeId.startsWith("source:")){kind="source";item=sources.find(x=>x.id===activeId.split(":")[1]);}
  else if(activeId.startsWith("delivery:")){kind="delivery";item=deliveries.find(x=>x.id===activeId.split(":")[1]);}
  else item=layers.find(x=>x.id===activeId);
  if(!item) return null;
  return <aside className="detail-panel" style={{"--c":item.color||"#d4af6a"}}>
    <button className="close" onClick={onClose}>×</button>
    <div className="detail-kicker">{kind.toUpperCase()}</div><h2>{item.icon} {item.name}</h2>
    {kind==="layer"&&<><h3>Purpose</h3><p>{item.purpose}</p><h3>Key activities</h3><ul>{item.activities.map(x=><li key={x}>✓ {x}</li>)}</ul><h3>Outputs</h3><ul className="outputs">{item.outputs.map(x=><li key={x}>◆ {x}</li>)}</ul></>}
    {kind==="source"&&<><h3>Source context</h3><p>{item.detail}</p><p className="tip">Select Play Journey to follow this data through every EDP layer.</p></>}
    {kind==="delivery"&&<><h3>Delivery outcome</h3><p>Curated data products are distributed to {item.name.toLowerCase()} through governed consumption patterns.</p></>}
  </aside>
}
