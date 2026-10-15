/* ============================================================
   UI
   ============================================================ */
const $ = s => document.querySelector(s);
const el = (tag,props={},...kids)=>{
  const e=document.createElement(tag);
  for(const k in props){
    if(k==="class") e.className=props[k];
    else if(k==="html") e.innerHTML=props[k];
    else if(k.startsWith("on")) e.addEventListener(k.slice(2),props[k]);
    else if(props[k]!==null&&props[k]!==undefined) e.setAttribute(k,props[k]);
  }
  kids.flat().forEach(k=>{ if(k===null||k===undefined)return; e.appendChild(typeof k==="string"?document.createTextNode(k):k); });
  if(tag==="button"&&!e.hasAttribute("aria-label")){
    const icons={"↑":T("up"),"↓":T("down"),"⟲":"Reset","−":"Zoom out","+":"Zoom in","☰":T("structure"),"☷":T("inspector")};
    const label=e.getAttribute("title")||icons[e.textContent.trim()];
    if(label)e.setAttribute("aria-label",label);
  }
  return e;
};
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove("show"),1900); }

/* ---------- helpers ---------- */
const findPhase = id => MODEL.phases.find(p=>p.id===id);
function findOp(pid,oid){ const p=findPhase(pid); return p?p.ops.find(o=>o.id===oid):null; }
function selOp(){ return SEL&&SEL.opId ? findOp(SEL.phaseId,SEL.opId) : null; }


/* ---------- render everything ---------- */
let ZOOM = 1, RENDER_FRAME = 0;
function renderAll(){ renderTree(); renderInspector(); renderDiagram(); }
function renderDiagram(){
  scheduleCheckpoint();
  cancelAnimationFrame(RENDER_FRAME);
  RENDER_FRAME=requestAnimationFrame(renderDiagramNow);
}
function renderDiagramNow(){
  try{
    LAST = buildDiagram();
    $("#stage").innerHTML = toSVG(LAST);
    renderSelectionMarker();
    $("#dims").textContent = Math.round(LAST.w)+" × "+Math.round(LAST.h)+" px";
    let nops=0, nitems=0;
    MODEL.phases.forEach(p=>p.ops.forEach(o=>{ nops++; Object.values(o.cells||{}).forEach(v=>{ nitems += String(v||"").split("\n").filter(l=>l.trim()&&!/^[\s\-•·]/.test(l)).length; }); }));
    $("#stats").textContent = `${MODEL.phases.length} ${T("phase").toLowerCase()}s · ${nops} ${T("ops")} · ${nitems} ${T("items")}`;
    applyZoom();
    renderMinimap();
  }catch(err){
    console.error(err);
    $("#stage").innerHTML = '<div style="padding:20px;color:#900;font:13px monospace">'+esc(err.message)+'</div>';
  }
}
function applyZoom(){
  const st=$("#stage"), so=$("#stageOuter");
  st.style.transform = `scale(${ZOOM})`;
  $("#zLbl").textContent = Math.round(ZOOM*100)+"%";
  if(LAST){
    st.style.width = LAST.w+"px"; st.style.height = LAST.h+"px";
    so.style.width = (LAST.w*ZOOM)+"px"; so.style.height = (LAST.h*ZOOM)+"px";
  }
  updateMinimapViewport();
}
function renderMinimap(){
  if(!LAST) return;
  const mini=$("#minimap");
  const scale=Math.max(0.01,Math.min(180/LAST.w,110/LAST.h));
  const cv=toCanvas(LAST,scale); cv.style.width="100%";cv.style.height="100%";
  mini.replaceChildren(cv,el("div",{id:"miniView"}));
  updateMinimapViewport();
}
function updateMinimapViewport(){
  if(!LAST) return;
  const wrap=$("#canvasWrap"), mini=$("#minimap"), view=$("#miniView");
  if(!view||!mini.clientWidth) return;
  const sx=mini.clientWidth/(LAST.w*ZOOM), sy=mini.clientHeight/(LAST.h*ZOOM);
  view.style.left=Math.max(0,wrap.scrollLeft*sx)+"px";
  view.style.top=Math.max(0,wrap.scrollTop*sy)+"px";
  view.style.width=Math.min(mini.clientWidth,wrap.clientWidth*sx)+"px";
  view.style.height=Math.min(mini.clientHeight,wrap.clientHeight*sy)+"px";
  updateMapContext();
}
function fitZoom(){
  if(!LAST) return;
  const wrap=$("#canvasWrap");
  ZOOM = Math.min((wrap.clientWidth-44)/LAST.w, (wrap.clientHeight-44)/LAST.h, 4);
  ZOOM = Math.max(0.02, ZOOM);
  applyZoom();
}

/* ---------- map-aware navigation ---------- */
let VIEW_CONTEXT={phase:null,col:null,row:null};
function setContextChip(id,text,target){
  const button=$(id);
  button.textContent=text||"—";
  button.disabled=!target;
  button.classList.toggle("current",!!target);
  button.title=text||"";
}
function updateMapContext(){
  const wrap=$("#canvasWrap"),stage=$("#stage");
  if(!LAST||!wrap||!stage||!LAST.cols.length){
    VIEW_CONTEXT={phase:null,col:null,row:null};
    setContextChip("#contextPhase","—",null);
    setContextChip("#contextOperation","—",null);
    setContextChip("#contextLayer",T("mapHeader"),null);
    return;
  }
  const wrapRect=wrap.getBoundingClientRect(),stageRect=stage.getBoundingClientRect();
  const x=Math.max(0,Math.min(LAST.w,(wrapRect.left+wrap.clientWidth/2-stageRect.left)/ZOOM));
  const y=Math.max(0,Math.min(LAST.h,(wrapRect.top+wrap.clientHeight/2-stageRect.top)/ZOOM));
  VIEW_CONTEXT=mapContextAt(x,y,LAST);
  const {phase,col,row}=VIEW_CONTEXT;
  setContextChip("#contextPhase",phase?`${phase.code} · ${phase.name}`:"—",phase);
  setContextChip("#contextOperation",col?`OP ${phase.code}_${col.op.num} · ${col.op.title||"—"}`:"—",col);
  setContextChip("#contextLayer",row?`${layerCode(row.L)} · ${row.L.name[LANG]||row.L.name.en}`:T("mapHeader"),row);
}
function scrollMapToPoint(mapX,mapY){
  if(!LAST) return;
  const wrap=$("#canvasWrap"),stage=$("#stage"),wrapRect=wrap.getBoundingClientRect(),stageRect=stage.getBoundingClientRect();
  const left=mapX===null?wrap.scrollLeft:wrap.scrollLeft+stageRect.left+mapX*ZOOM-(wrapRect.left+wrap.clientWidth/2);
  const top=mapY===null?wrap.scrollTop:wrap.scrollTop+stageRect.top+mapY*ZOOM-(wrapRect.top+wrap.clientHeight/2);
  wrap.scrollTo({left:Math.max(0,left),top:Math.max(0,top),behavior:"smooth"});
}
function revealPhase(phase){
  if(!LAST||!phase) return;
  const span=LAST.phaseSpans.find(candidate=>candidate.ph.id===phase.id);
  if(span&&span.first<=span.last) scrollMapToPoint((span.x0+span.x1)/2,null);
}
function revealOperation(phase,op){
  if(!LAST||!phase||!op) return;
  const col=LAST.cols.find(candidate=>candidate.ph.id===phase.id&&candidate.op.id===op.id);
  const flowRow=LAST.rows.find(candidate=>candidate.L.flow);
  if(col) scrollMapToPoint(col.x+col.w/2,flowRow?flowRow.y+flowRow.h/2:null);
}
function revealSelection(){
  if(!SEL) return;
  const phase=findPhase(SEL.phaseId);
  const operation=SEL.opId?findOp(SEL.phaseId,SEL.opId):null;
  if(operation) revealOperation(phase,operation); else revealPhase(phase);
}
function renderSelectionMarker(){
  const stage=$("#stage");
  stage?.querySelector(".map-selection-marker")?.remove();
  if(!stage||!LAST||!SEL?.opId||!LAST.rows.length) return;
  const col=LAST.cols.find(candidate=>candidate.ph.id===SEL.phaseId&&candidate.op.id===SEL.opId);
  if(!col) return;
  const first=LAST.rows[0],last=LAST.rows[LAST.rows.length-1];
  stage.appendChild(el("div",{class:"map-selection-marker",style:
    `left:${col.x-3}px;top:${first.y}px;width:${col.w+6}px;height:${last.y+last.h-first.y}px`}));
}

/* ---------- tree ---------- */
function renderTree(){
  const b=$("#treeBody"); b.innerHTML="";
  const locate=$("#btnLocateSelection"); if(locate) locate.disabled=!SEL;
  if(!MODEL.phases.length){
    b.appendChild(el("div",{class:"empty",html:T("noSel")}));
    renderSelectionMarker();
    return;
  }
  MODEL.phases.forEach((ph,pi)=>{
    const head = el("div",{class:"phase-head", onclick:()=>{ SEL={phaseId:ph.id}; renderInspector(); renderTree(); revealPhase(ph); }},
      el("span",{class:"code"},ph.code),
      el("span",{class:"nm"},ph.name),
      el("button",{class:"btn sm icon", title:T("up"), onclick:e=>{e.stopPropagation(); move(MODEL.phases,pi,-1); renderAll();}},"↑"),
      el("button",{class:"btn sm icon", title:T("down"), onclick:e=>{e.stopPropagation(); move(MODEL.phases,pi,1); renderAll();}},"↓")
    );
    const box = el("div",{class:"phase"}, head);
    ph.ops.forEach((op,oi)=>{
      const sel = SEL&&SEL.opId===op.id;
      box.appendChild(el("div",{class:"op"+(sel?" sel":""), onclick:()=>{ SEL={phaseId:ph.id,opId:op.id}; renderTree(); renderInspector(); revealOperation(ph,op); }},
        el("span",{class:"num"},op.num),
        el("span",{class:"nm"},op.title||"—"),
        el("button",{class:"btn sm icon",onclick:e=>{e.stopPropagation(); move(ph.ops,oi,-1); renderAll();}},"↑"),
        el("button",{class:"btn sm icon",onclick:e=>{e.stopPropagation(); move(ph.ops,oi,1); renderAll();}},"↓")
      ));
    });
    box.appendChild(el("div",{style:"padding:6px 8px;display:flex;gap:6px"},
      el("button",{class:"btn sm",onclick:()=>{ const o=newOp(autoNum(ph)); ph.ops.push(o); SEL={phaseId:ph.id,opId:o.id}; renderAll(); }},T("addOp"))
    ));
    b.appendChild(box);
  });
  renderSelectionMarker();
}
function move(arr,i,d){ const j=i+d; if(j<0||j>=arr.length) return; const t=arr[i]; arr[i]=arr[j]; arr[j]=t; }

/* ---------- inspector ---------- */
function field(label,input,help){
  return el("div",{class:"field"}, el("label",{},label), input, help?el("div",{class:"help"},help):null);
}
function txt(val,on,ph){ return el("input",{type:"text",value:val||"",placeholder:ph||"",oninput:e=>on(e.target.value)}); }
function groupTxt(phase,op,level){
  const group=operationGroup(phase,op,level),blocked=level===2&&!op.group1Id;
  return el("input",{type:"text",value:group?.name||"",placeholder:blocked?T("groupFirst"):"",
    ...(blocked?{disabled:"disabled"}:{}),onchange:e=>{
      setOperationGroupName(phase,op,level,e.target.value);
      renderInspector();renderDiagram();
    }});
}
function num(val,on,mn,mx){ return el("input",{type:"number",value:val,min:mn??0,max:mx??9999,oninput:e=>{
  const v=parseFloat(e.target.value); if(!Number.isFinite(v)) return;
  on(Math.min(mx??9999,Math.max(mn??0,v)));
}}); }
function area(val,on,rows,ph){ return el("textarea",{rows:rows||3,placeholder:ph||"",oninput:e=>on(e.target.value)},val||""); }
const lines2arr = s => String(s||"").split("\n").map(x=>x.trim()).filter(Boolean);

function renderInspector(){
  const b=$("#inspBody"); b.innerHTML="";
  $("#inspTitle").textContent = T("inspector");

  // project box always on top
  const proj = el("div",{class:"sec open"},
    el("h4",{onclick:e=>e.currentTarget.parentNode.classList.toggle("open")}, T("project")),
    el("div",{class:"body"},
      field(T("title"), area(MODEL.meta.title, v=>{MODEL.meta.title=v; renderDiagram();},2)),
      field(T("subt"),  area(MODEL.meta.subtitle, v=>{MODEL.meta.subtitle=v; renderDiagram();},2))
    ));
  b.appendChild(proj);

  const op = selOp();
  if(!op){
    const ph = SEL&&SEL.phaseId ? findPhase(SEL.phaseId) : null;
    if(ph){
      b.appendChild(el("div",{class:"sec open"},
        el("h4",{}, T("phase")),
        el("div",{class:"body"},
          field(T("phaseCode"), txt(ph.code,v=>{ph.code=v;renderTree();renderDiagram();})),
          field(T("phaseName"), txt(ph.name,v=>{ph.name=v;renderTree();renderDiagram();})),
          el("div",{class:"row"},
            el("button",{class:"btn sm",onclick:()=>{ const o=newOp(autoNum(ph)); ph.ops.push(o); SEL={phaseId:ph.id,opId:o.id}; renderAll(); }},T("addOp")),
            el("button",{class:"btn sm",onclick:()=>{ if(confirm(T("confirmDel"))){ MODEL.phases=MODEL.phases.filter(p=>p.id!==ph.id); SEL=null; renderAll(); } }},T("delPhase"))
          ))));
    } else {
      b.appendChild(el("div",{class:"empty",html:T("noSel")}));
    }
    return;
  }

  const ph = findPhase(SEL.phaseId);
  const group1=operationGroup(ph,op,1),group2=operationGroup(ph,op,2);
  $("#inspTitle").textContent = `OP ${ph.code}_${op.num}`;

  const sharedGroupFields=group=>group?el("div",{style:"margin:5px 0 10px;padding:8px;border:1px solid var(--line);border-radius:7px"},
    el("div",{class:"tiny",style:"margin-bottom:6px"},group.name+" · "+T("groupIoHelp")),
    el("div",{class:"row"},
      el("div",{style:"flex:1"},field(T("groupInputs"),area(group.inputs.join("\n"),v=>{group.inputs=lines2arr(v);renderDiagram();},2))),
      el("div",{style:"flex:1"},field(T("groupOutputs"),area(group.outputs.join("\n"),v=>{group.outputs=lines2arr(v);renderDiagram();},2)))
    )):null;

  /* operation core */
  b.appendChild(el("div",{class:"sec open"},
    el("h4",{onclick:e=>e.currentTarget.parentNode.classList.toggle("open")}, "OP · " + (op.title||"—")),
    el("div",{class:"body"},
      el("div",{class:"row"},
        el("div",{style:"width:38%"}, field(T("opNum"), txt(op.num,v=>{
          op.num=v;$("#inspTitle").textContent=`OP ${ph.code}_${op.num}`;renderTree();renderDiagram();
        }))),
        el("div",{style:"flex:1"}, field(T("opTitle"), txt(op.title,v=>{op.title=v;renderTree();renderDiagram();})))
      ),
      field(T("steps"), area(op.steps.join("\n"), v=>{op.steps=lines2arr(v);renderDiagram();},3)),
      el("div",{class:"row"},
        el("div",{style:"flex:1"},field(T("group1"),groupTxt(ph,op,1))),
        el("div",{style:"flex:1"},field(T("group2"),groupTxt(ph,op,2)))
      ),
      sharedGroupFields(group1),
      sharedGroupFields(group2),
      el("div",{class:"row"},
        el("div",{style:"flex:1"}, field(T("inputs"), area(op.inputs.join("\n"),v=>{op.inputs=lines2arr(v);renderDiagram();},2))),
        el("div",{style:"flex:1"}, field(T("outputs"), area(op.outputs.join("\n"),v=>{op.outputs=lines2arr(v);renderDiagram();},2)))
      ),
      field(T("scrap"), area(op.scrap.join("\n"),v=>{op.scrap=lines2arr(v);renderDiagram();},2)),
      field(T("width"), num(op.width||0, v=>{op.width=v; renderDiagram();},0,900), "0 = auto"),
      el("div",{class:"row",style:"margin-top:6px"},
        el("button",{class:"btn sm",onclick:()=>{
          const c=JSON.parse(JSON.stringify(op)); c.id=nid(); c.num=autoNum(ph);
          ph.ops.splice(ph.ops.indexOf(op)+1,0,c); SEL={phaseId:ph.id,opId:c.id}; renderAll();
        }},T("dup")),
        el("button",{class:"btn sm",onclick:()=>{ if(confirm(T("confirmDel"))){ ph.ops=ph.ops.filter(o=>o.id!==op.id); cleanupPhaseGroups(ph); SEL={phaseId:ph.id}; renderAll(); } }},T("del"))
      )
    )));

  /* decision */
  const decOn = !!op.decision;
  const decBody = el("div",{class:"body"},
    el("label",{style:"display:flex;gap:8px;align-items:center;margin-bottom:8px;text-transform:none;font-size:13px;color:var(--txt)"},
      el("input",{type:"checkbox", ...(decOn?{checked:"checked"}:{}) , onchange:e=>{
        op.decision = e.target.checked ? {text:"?", yes:"Yes", no:"No", back:1} : null;
        renderInspector(); renderDiagram();
      }}), T("decision")),
    decOn ? field(T("decText"), txt(op.decision.text,v=>{op.decision.text=v;renderDiagram();})) : null,
    decOn ? el("div",{class:"row"},
      el("div",{style:"flex:1"},field(T("decYes"), txt(op.decision.yes,v=>{op.decision.yes=v;renderDiagram();}))),
      el("div",{style:"flex:1"},field(T("decNo"),  txt(op.decision.no ,v=>{op.decision.no =v;renderDiagram();})))
    ) : null,
    decOn ? field(T("decBack"), num(op.decision.back,v=>{op.decision.back=Math.max(1,v);renderDiagram();},1,20)) : null
  );
  b.appendChild(el("div",{class:"sec"+(decOn?" open":"")},
    el("h4",{onclick:e=>e.currentTarget.parentNode.classList.toggle("open")}, "◇ "+T("decision")), decBody));

  /* layers */
  b.appendChild(el("div",{style:"margin:14px 2px 6px;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px"},T("layers")));
  MODEL.layers.filter(l=>!l.flow).forEach(L=>{
    const raw = op.cells[L.id]||"";
    const n = parseCell(raw,layerCode(L),op.num).length;
    const open = !!raw;
    const cols = layerColors(L);
    b.appendChild(el("div",{class:"sec"+(open?" open":""), id:"sec_"+L.id},
      el("h4",{onclick:e=>e.currentTarget.parentNode.classList.toggle("open"), style:L.on?"":"opacity:.45"},
        el("span",{class:"swatch",style:"background:"+cols.box}),
        el("b",{},layerCode(L)), el("span",{},L.name[LANG]),
        el("span",{class:"cnt"}, n?String(n):"")),
      el("div",{class:"body"},
        area(raw, v=>{ op.cells[L.id]=v; renderDiagram(); updateCount(L,op); }, Math.max(3,Math.min(12,raw.split("\n").length+1)),
             layerCode(L)+" "+op.num+".1 …"),
        el("div",{class:"help"}, T("autoCode")+" "+T("contHelp")),
        L.id==="SPC"?el("div",{},
          el("div",{class:"help"},SPC_GUIDANCE[LANG].help),
          !raw?el("button",{class:"btn sm",type:"button",onclick:()=>{
            op.cells.SPC=SPC_GUIDANCE[LANG].template;
            renderInspector();renderDiagram();
          }},SPC_GUIDANCE[LANG].insert):null
        ):null
      )));
  });
}
function updateCount(layer,op){
  const s=document.querySelector("#sec_"+layer.id+" .cnt");
  if(s) s.textContent = String(parseCell(op.cells[layer.id],layerCode(layer),op.num).length||"");
}

/* ---------- direct map editing ---------- */
function closeMapEditor(){
  const editor=document.querySelector(".map-editor");
  if(editor) editor.remove();
}
function openMapEditor(target,clientX,clientY){
  closeMapEditor();
  let value="";
  if(target.type==="title") value=MODEL.meta.title;
  else if(target.type==="subtitle") value=MODEL.meta.subtitle;
  else if(target.type==="phase") value=target.phase.name;
  else if(target.type==="operation") value=[target.op.title,...(target.op.steps||[])].join("\n");
  else value=target.op.cells[target.layer.id]||"";
  const textarea=el("textarea",{rows:"6","aria-label":target.label},value);
  const editor=el("div",{class:"map-editor"},
    el("label",{},target.label),
    textarea,
    target.type==="cell"&&target.layer.id==="SPC"?el("div",{class:"help"},SPC_GUIDANCE[LANG].help):null,
    target.type==="operation"?el("div",{class:"help"},LANG==="pt"?
      "Primeira linha: título. Linhas seguintes: passos.":"First line: title. Following lines: steps."):null,
    el("div",{class:"actions"},
      el("button",{class:"btn sm",type:"button",onclick:closeMapEditor},T("close")),
      el("button",{class:"btn sm primary",type:"button",onclick:commit},"OK")
    )
  );
  function commit(){
    const text=textarea.value;
    if(target.type==="title") MODEL.meta.title=text.trim();
    else if(target.type==="subtitle") MODEL.meta.subtitle=text.trim();
    else if(target.type==="phase") target.phase.name=text.trim();
    else if(target.type==="operation"){
      const lines=String(text).replace(/\r/g,"").split("\n");
      target.op.title=(lines.shift()||"").trim();
      target.op.steps=lines.map(x=>x.trim()).filter(Boolean);
      SEL={phaseId:target.phase.id,opId:target.op.id};
    }else{
      target.op.cells[target.layer.id]=text;
      SEL={phaseId:target.phase.id,opId:target.op.id};
    }
    closeMapEditor();renderAll();
  }
  document.body.appendChild(editor);
  const left=Math.min(clientX+10,window.innerWidth-editor.offsetWidth-12);
  const top=Math.min(clientY+10,window.innerHeight-editor.offsetHeight-12);
  editor.style.left=Math.max(12,left)+"px";editor.style.top=Math.max(12,top)+"px";
  textarea.focus();textarea.select();
  textarea.addEventListener("keydown",e=>{
    if(e.key==="Escape"){e.preventDefault();closeMapEditor();}
    if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();commit();}
  });
}

/* ---------- settings ---------- */
function setLayerDisplayCode(layer,value,input){
  const previous=layerCode(layer),next=String(value||"").trim().toUpperCase();
  if(!/^[A-Z0-9][A-Z0-9_-]{0,15}$/.test(next)){
    alert(T("invalidLayerCode"));input.value=previous;return;
  }
  if(MODEL.layers.some(other=>other!==layer&&layerCode(other).toUpperCase()===next)){
    alert(T("duplicateLayerCode"));input.value=previous;return;
  }
  layer.code=next;input.value=next;renderInspector();renderDiagram();
}
function deleteInformationLayer(layer){
  if(layer.flow||!confirm(T("confirmLayerDelete"))) return;
  MODEL.layers=MODEL.layers.filter(candidate=>candidate!==layer);
  MODEL.phases.forEach(phase=>phase.ops.forEach(op=>delete op.cells[layer.id]));
  renderSettings();renderInspector();renderDiagram();
}
function renderSettings(){
  const b=$("#settingsBody"); b.innerHTML="";
  const S=MODEL.settings;
  const g=(lbl,inp)=>el("div",{style:"flex:1 1 170px"},field(lbl,inp));
  b.appendChild(el("h3",{style:"margin:0 0 8px;font-size:13px"},T("layout")));
  b.appendChild(el("div",{style:"display:flex;flex-wrap:wrap;gap:10px"},
    g(T("colW"), num(S.colW,v=>{S.colW=v;renderDiagram();},60,900)),
    g(T("gap"), num(S.gap,v=>{S.gap=v;renderDiagram();},0,300)),
    g(T("phaseGap"), num(S.phaseGap,v=>{S.phaseGap=v;renderDiagram();},0,400)),
    g(T("labelW"), num(S.labelW,v=>{S.labelW=v;renderDiagram();},16,120)),
    g(T("fontBase"), num(S.fontBase,v=>{S.fontBase=v;renderDiagram();},4,24)),
    g(T("fontTitle"), num(S.fontTitle,v=>{S.fontTitle=v;renderDiagram();},8,60)),
    g(T("rowMin"), num(S.rowMin,v=>{S.rowMin=v;renderDiagram();},20,400)),
    g(T("margin"), num(S.margin,v=>{S.margin=v;renderDiagram();},0,120))
  ));
  const choice=(value,options,onchange)=>{
    const s=el("select",{onchange:e=>onchange(e.target.value)});
    options.forEach(([v,label])=>s.appendChild(el("option",{value:v},label)));
    s.value=value; return s;
  };
  b.appendChild(el("h3",{style:"margin:18px 0 8px;font-size:13px"},"PDF"));
  b.appendChild(el("div",{style:"display:flex;flex-wrap:wrap;gap:10px"},
    g(T("pdfMode"),choice(S.pdfMode,[["single",T("pdfLarge")],["a4",T("pdfA4")],["a3",T("pdfA3")]],v=>{S.pdfMode=v;scheduleCheckpoint();})),
    g(T("pdfOrientation"),choice(S.pdfOrientation,[["landscape",T("landscape")],["portrait",T("portrait")]],v=>{S.pdfOrientation=v;scheduleCheckpoint();})),
    g(T("pdfTextMode"),choice(S.pdfTextMode,[["vector",T("pdfVectorText")],["unicode",T("pdfUnicodeText")]],v=>{S.pdfTextMode=v;scheduleCheckpoint();}))
  ));
  b.appendChild(el("h3",{style:"margin:18px 0 8px;font-size:13px"},T("layersCfg")));
  b.appendChild(el("div",{class:"help",style:"margin-bottom:9px"},T("layerHelp")));
  const tb=el("tbody");
  MODEL.layers.forEach((L,i)=>{
    const c=layerColors(L);
    const codeInput=el("input",{type:"text",value:layerCode(L),maxlength:"16","aria-label":T("layerCode"),
      onchange:e=>setLayerDisplayCode(L,e.target.value,e.target),style:"min-width:72px;width:86px;text-transform:uppercase"});
    tb.appendChild(el("tr",{},
      el("td",{}, el("input",{type:"checkbox", ...(L.on?{checked:"checked"}:{}), onchange:e=>{L.on=e.target.checked;renderDiagram();renderInspector();}})),
      el("td",{}, codeInput),
      el("td",{}, el("input",{type:"text",value:L.name[LANG],oninput:e=>{L.name[LANG]=e.target.value;renderDiagram();}})),
      el("td",{}, el("input",{type:"color",value:toHex(c.box),oninput:e=>{L.box=e.target.value;renderDiagram();},style:"width:44px;padding:0;height:26px"})),
      el("td",{}, el("input",{type:"color",value:toHex(c.strip),oninput:e=>{L.strip=e.target.value;renderDiagram();},style:"width:44px;padding:0;height:26px"})),
      el("td",{}, el("button",{class:"btn sm",onclick:()=>{move(MODEL.layers,i,-1);renderSettings();renderDiagram();}},"↑"),
                  el("button",{class:"btn sm",onclick:()=>{move(MODEL.layers,i,1);renderSettings();renderDiagram();}},"↓"),
                  el("button",{class:"btn sm",title:"Reset colours",onclick:()=>{L.box=null;L.strip=null;renderSettings();renderDiagram();}},"⟲"),
                  !L.flow?el("button",{class:"btn sm danger",title:T("deleteLayer"),onclick:()=>deleteInformationLayer(L)},"×"):null)
    ));
  });
  b.appendChild(el("table",{class:"grid"},
    el("thead",{},el("tr",{},el("th",{},T("enabled")),el("th",{},T("layerCode")),el("th",{},T("name")),
      el("th",{},T("boxColor")),el("th",{},T("labelColor")),el("th",{},""))), tb));
  b.appendChild(el("button",{class:"btn sm",type:"button",disabled:MODEL.layers.length>=50?"disabled":null,
    style:"margin-top:9px",onclick:()=>{
      const layer=newInfoLayer();MODEL.layers.push(layer);renderSettings();renderInspector();renderDiagram();
    }},T("addLayer")));
}
function toHex(c){ if(/^#[0-9a-f]{6}$/i.test(c)) return c; const d=document.createElement("div"); d.style.color=c; document.body.appendChild(d);
  const m=getComputedStyle(d).color.match(/\d+/g); d.remove();
  return m?"#"+m.slice(0,3).map(v=>(+v).toString(16).padStart(2,"0")).join(""):"#ffffff"; }

/* ---------- export ---------- */
const safeName = () => (MODEL.meta.title||"process_map").replace(/[^\w\-À-ſ\s]+/g,"").trim().replace(/\s+/g,"_") || "process_map";

/* ---------- i18n apply ---------- */
function applyLang(){
  document.documentElement.lang=LANG;
  document.querySelectorAll("[data-i18n]").forEach(n=>{ n.textContent = T(n.dataset.i18n); });
  document.querySelectorAll("[data-i18n-title]").forEach(n=>{ n.setAttribute("aria-label",T(n.dataset.i18nTitle)); });
  $("#brandSub").textContent = T("subtitle");
  renderAll();
}

/* ---------- wiring ---------- */
function initUI(){
  const ts=$("#themeSel");
  Object.keys(THEMES).forEach(k=> ts.appendChild(el("option",{value:k},THEMES[k].name)));
  ts.value=MODEL.meta.theme;
  ts.onchange=()=>{ MODEL.meta.theme=ts.value; renderAll(); };
  $("#langSel").onchange=e=>{ LANG=e.target.value; applyLang(); };
  $("#stage").classList.add("editable");
  $("#stage").title=LANG==="pt"?"Duplo clique para editar":"Double-click to edit";
  $("#stage").addEventListener("dblclick",e=>{
    if(!LAST) return;
    const rect=$("#stage").getBoundingClientRect();
    const x=(e.clientX-rect.left)/ZOOM,y=(e.clientY-rect.top)/ZOOM;
    const target=mapEditTarget(x,y,LAST);
    if(target){e.preventDefault();openMapEditor(target,e.clientX,e.clientY);}
  });
  $("#btnUndo").onclick=()=>{ commitCheckpoint(); restoreHistory(HISTORY_INDEX-1); };
  $("#btnRedo").onclick=()=>{ commitCheckpoint(); restoreHistory(HISTORY_INDEX+1); };

  $("#btnAddPhase").onclick=()=>{ const p=newPhase(nextPhaseCode()); MODEL.phases.push(p); SEL={phaseId:p.id}; renderAll(); };
  $("#btnNew").onclick=()=>{
    if(!confirm(isDirty()?T("unsaved"):T("confirmDel"))) return;
    HISTORY_SUSPENDED=true; MODEL=newModel(); SEL=null; ts.value=MODEL.meta.theme; renderAll(); resetHistory(true); saveRecovery();
  };
  $("#btnExample").onclick=()=>{
    if(isDirty()&&!confirm(T("unsaved"))) return;
    HISTORY_SUSPENDED=true; MODEL=exampleModel(); SEL=null; ts.value=MODEL.meta.theme; renderAll(); resetHistory(false); saveRecovery();
    setTimeout(fitZoom,60);
  };
  $("#btnSave").onclick=async()=>{
    const button=$("#btnSave");
    try{
      commitCheckpoint();
      const snapshot=modelSnapshot();
      button.disabled=true;
      const result=await saveProjectDocument(safeName()+".json",JSON.stringify(JSON.parse(snapshot),null,1));
      if(!result.saved) return;
      LAST_SAVED_SIGNATURE=snapshot;
      saveRecovery();
      toast(T("saved")+(result.path?" · "+result.path:""));
    }catch(error){
      console.error(error);
      alert((LANG==="pt"?"Não foi possível guardar o projeto: ":"Could not save project: ")+error.message);
    }finally{
      button.disabled=false;
    }
  };
  $("#btnOpen").onclick=()=>$("#fileInput").click();
  $("#fileInput").onchange=e=>{
    const f=e.target.files[0]; if(!f) return;
    if(f.size>10*1024*1024){ alert(T("invalidProject")+": ficheiro superior a 10 MB"); e.target.value=""; return; }
    const r=new FileReader();
    r.onload=()=>{ try{
        const m=JSON.parse(r.result);
        HISTORY_SUSPENDED=true; MODEL=normalizeProject(m); SEL=null; ts.value=MODEL.meta.theme; renderAll();
        resetHistory(true); saveRecovery(); setTimeout(fitZoom,60);
      }catch(err){ HISTORY_SUSPENDED=false; alert("Erro: "+err.message); } };
    r.readAsText(f); e.target.value="";
  };

  $("#btnSvg").onclick=()=>{ try{download(safeName()+".svg",toSVG(buildDiagram()),"image/svg+xml");toast("SVG ✓");}
    catch(err){console.error(err);alert("SVG: "+err.message);} };
  $("#btnPdf").onclick=()=>{ try{download(safeName()+".pdf",toPDF(buildDiagram(),MODEL.settings),"application/pdf");toast("PDF ✓");}
    catch(err){console.error(err);alert("PDF: "+err.message);} };
  $("#btnPng").onclick=()=>{
    try{
      const res=buildDiagram(), px = res.w*res.h;
      let sc = 2; if(px*4 > 90e6) sc = Math.max(1, Math.sqrt(90e6/px));
      const cv = toCanvas(res, sc);
      cv.toBlob(b=>{if(!b){alert("PNG: exportação falhou");return;}download(safeName()+".png",b,"image/png");toast("PNG ✓ "+cv.width+"×"+cv.height);});
    }catch(err){console.error(err);alert("PNG: "+err.message);}
  };

  $("#zIn").onclick=()=>{ZOOM=Math.min(6,ZOOM*1.25);applyZoom();};
  $("#zOut").onclick=()=>{ZOOM=Math.max(0.02,ZOOM/1.25);applyZoom();};
  $("#zFit").onclick=fitZoom;
  $("#z100").onclick=()=>{ZOOM=1;applyZoom();};
  $("#canvasWrap").addEventListener("wheel",e=>{
    if(!e.ctrlKey) return; e.preventDefault();
    const wrap=e.currentTarget, rect=wrap.getBoundingClientRect();
    const px=(wrap.scrollLeft+e.clientX-rect.left)/ZOOM, py=(wrap.scrollTop+e.clientY-rect.top)/ZOOM;
    ZOOM = Math.max(0.02, Math.min(6, ZOOM * (e.deltaY<0?1.1:1/1.1))); applyZoom();
    wrap.scrollLeft=px*ZOOM-(e.clientX-rect.left); wrap.scrollTop=py*ZOOM-(e.clientY-rect.top);
    updateMinimapViewport();
  },{passive:false});
  const wrap=$("#canvasWrap"); let pan=null, space=false;
  wrap.addEventListener("pointerdown",e=>{
    if(e.button!==1&&!space) return;
    e.preventDefault(); pan={x:e.clientX,y:e.clientY,left:wrap.scrollLeft,top:wrap.scrollTop};
    wrap.setPointerCapture(e.pointerId); wrap.classList.add("panning");
  });
  wrap.addEventListener("pointermove",e=>{ if(pan){wrap.scrollLeft=pan.left-(e.clientX-pan.x);wrap.scrollTop=pan.top-(e.clientY-pan.y);updateMinimapViewport();} });
  const stopPan=()=>{pan=null;wrap.classList.remove("panning");};
  wrap.addEventListener("pointerup",stopPan); wrap.addEventListener("pointercancel",stopPan);
  wrap.addEventListener("scroll",updateMinimapViewport,{passive:true});
  $("#minimap").addEventListener("click",e=>{
    const r=e.currentTarget.getBoundingClientRect();
    wrap.scrollLeft=((e.clientX-r.left)/r.width)*LAST.w*ZOOM-wrap.clientWidth/2;
    wrap.scrollTop=((e.clientY-r.top)/r.height)*LAST.h*ZOOM-wrap.clientHeight/2;
    updateMinimapViewport();
  });
  $("#contextPhase").onclick=()=>revealPhase(VIEW_CONTEXT.phase);
  $("#contextOperation").onclick=()=>{
    if(!VIEW_CONTEXT.col) return;
    SEL={phaseId:VIEW_CONTEXT.col.ph.id,opId:VIEW_CONTEXT.col.op.id};
    renderTree();renderInspector();revealOperation(VIEW_CONTEXT.col.ph,VIEW_CONTEXT.col.op);
  };
  $("#contextLayer").onclick=()=>{
    if(VIEW_CONTEXT.row) scrollMapToPoint(null,VIEW_CONTEXT.row.y+VIEW_CONTEXT.row.h/2);
  };
  $("#btnLocateSelection").onclick=revealSelection;
  document.addEventListener("keydown",e=>{
    if(e.code==="Space"&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){space=true;e.preventDefault();}
    if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==="z"){e.preventDefault();$("#btnUndo").click();}
    if((e.ctrlKey||e.metaKey)&&(e.key.toLowerCase()==="y"||(e.shiftKey&&e.key.toLowerCase()==="z"))){e.preventDefault();$("#btnRedo").click();}
  });
  document.addEventListener("keyup",e=>{if(e.code==="Space") space=false;});
  $("#btnTreeToggle").onclick=()=>$("#tree").classList.toggle("mobile-open");
  $("#btnInspectorToggle").onclick=()=>$("#inspector").classList.toggle("mobile-open");

  $("#btnSettings").onclick=()=>{ renderSettings(); $("#dlgSettings").showModal(); };
  $("#setClose").onclick=()=>$("#dlgSettings").close();
  $("#btnHelp").onclick=()=>{ $("#helpBody").innerHTML=HELP[LANG]; $("#dlgHelp").showModal(); };
  $("#helpClose").onclick=()=>$("#dlgHelp").close();
  [["zOut","Diminuir zoom"],["zIn","Aumentar zoom"],["zFit","Ajustar mapa"],["z100","Zoom a 100%"],
   ["btnSettings",T("settings")],["btnHelp",T("helpTitle")]].forEach(([id,label])=>{$("#"+id).setAttribute("aria-label",label);});
}


const HELP = {
pt:`<h3>Fluxo de trabalho</h3>
<ol>
<li><b>Fases</b> — crie as grandes etapas do processo (A, B, C…) no painel esquerdo. Cada fase ocupa um bloco de colunas no mapa.</li>
<li><b>Operações</b> — dentro de cada fase adicione as operações. Cada operação é <u>uma coluna</u> do mapa e recebe um número (ex.: <code>2.1</code>).</li>
<li><b>Camadas de informação</b> — no inspetor à direita, preencha as caixas de cada camada. Em ⚙ pode criar e eliminar camadas, mudar o respetivo código e nome, reordená-las ou ocultá-las. <b>Uma linha = um item</b>; o código (<code>RQ 2.1.1</code>) é gerado automaticamente.</li>
<li>Linhas começadas por <code>-</code> ou por espaço <b>continuam o item anterior</b> (sub-detalhe sem código novo).</li>
<li><b>Fluxo do processo</b> — passos, agrupamentos (dois níveis), entradas/saídas, refugo e decisões definem-se nos campos da operação.</li>
<li>Quando várias operações pertencem ao mesmo grupo ou subgrupo, podem ser definidas <b>entradas e saídas partilhadas</b>. Estas aparecem uma única vez, acima e fora da caixa do grupo, ligadas ao respetivo limite; as entradas e saídas próprias de cada operação continuam opcionais.</li>
<li><b>Exportar</b> — SVG, PDF (página única ou A4/A3 multipágina) ou PNG. Em ⚙ pode escolher texto vetorial compatível ou imagem Unicode para preservar qualquer alfabeto.</li>
<li><b>Guardar e recuperar</b> — <b>Guardar projeto</b> grava um .json. As alterações também são recuperadas automaticamente neste navegador.</li>
</ol>
<h3>Dicas</h3>
<ul>
<li>A barra de contexto acima do mapa mostra sempre a fase, operação e camada no centro da vista. Clique num elemento da barra para o recentrar, ou use <b>Localizar seleção</b>. A operação selecionada fica assinalada no mapa.</li>
<li>Ctrl + roda do rato faz zoom na pré-visualização.</li>
<li>Arraste com o botão central, ou mantenha Espaço enquanto arrasta, para deslocar o mapa. Clique no minimapa para navegar.</li>
<li>Faça duplo clique numa caixa, operação, fase ou título para editar diretamente no mapa. Ctrl+Enter confirma; Esc cancela.</li>
<li>Use Ctrl+Z / Ctrl+Y ou os botões Desfazer / Refazer para percorrer até 80 estados.</li>
<li>Em ⚙ pode criar, eliminar, ligar/desligar e reordenar camadas, personalizar os códigos, mudar cores e ajustar larguras/letras.</li>
<li>Os temas Executive, Blueprint e Lean Board alteram também a geometria, grelha, etiquetas, conectores e hierarquia visual do mapa.</li>
<li>O código da operação no mapa é <code>OP {Fase}_{nº}</code>.</li>
<li>Se uma coluna precisar de mais espaço, defina uma largura específica no campo "Largura da coluna".</li>
</ul>`,
en:`<h3>Workflow</h3>
<ol>
<li><b>Phases</b> — create the main process stages (A, B, C…) in the left panel. Each phase spans a block of columns.</li>
<li><b>Operations</b> — add operations inside each phase. Each operation is <u>one column</u> and gets a number (e.g. <code>2.1</code>).</li>
<li><b>Layers of information</b> — in the inspector on the right, fill the boxes for each layer. Under ⚙ you can create and delete layers, change their code and name, reorder them, or hide them. <b>One line = one item</b>; the code (<code>RQ 2.1.1</code>) is generated automatically.</li>
<li>Lines starting with <code>-</code> or a space <b>continue the previous item</b> (sub-detail, no new code).</li>
<li><b>Process flow</b> — steps, groupings (two levels), inputs/outputs, scrap and decisions are set in the operation fields.</li>
<li>When several operations belong to the same group or subgroup, you can define <b>shared inputs and outputs</b>. They appear once above and outside the group box, connected to its boundary; each operation can still have its own optional inputs and outputs.</li>
<li><b>Export</b> — SVG, PDF (single page or tiled A4/A3) or PNG. Under ⚙ choose compatible vector text or a Unicode image to preserve any alphabet.</li>
<li><b>Save and recover</b> — <b>Save project</b> writes a .json. Changes are also recovered automatically in this browser.</li>
</ol>
<h3>Tips</h3>
<ul>
<li>The context bar above the map always shows the phase, operation and layer at the centre of the viewport. Click an item to recenter it, or use <b>Locate selection</b>. The selected operation is outlined on the map.</li>
<li>Ctrl + mouse wheel zooms the preview.</li>
<li>Drag with the middle mouse button, or hold Space while dragging, to pan. Click the minimap to navigate.</li>
<li>Double-click a cell, operation, phase or title to edit it directly on the map. Ctrl+Enter saves; Esc cancels.</li>
<li>Use Ctrl+Z / Ctrl+Y or Undo / Redo to browse up to 80 states.</li>
<li>Under ⚙ you can create, delete, toggle and reorder layers, customize codes, change colours and adjust widths/fonts.</li>
<li>Executive, Blueprint and Lean Board also change the map geometry, grid, labels, connectors and visual hierarchy.</li>
<li>The operation code on the map is <code>OP {Phase}_{no}</code>.</li>
<li>If a column needs more room, set a specific width in the "Column width" field.</li>
</ul>`
};

/* ============================================================
   FICTIONAL EXAMPLE — generic discrete-product assembly
   ============================================================ */
function exampleModel(){
  const m = newModel();
  m.meta.title = "PRODUCT ASSEMBLY PROCESS MAP";
  m.meta.subtitle = "Fictional example · training data only";
  m.meta.theme = "plum";
  const mk = (num,title,steps,extra={}) => Object.assign(newOp(num), {title, steps}, extra);

  const A = newPhase("A","MATERIAL PREPARATION");
  A.ops = [
    mk("1.1","Receive components",["Check delivery","Confirm identification"],{
      cells:{
        RQ:"Correct part and quantity\nTraceability available",
        SW:"Inventory system",
        EM:"Barcode scanner\nInspection bench",
        IP:"Purchase order\nApproved part list",
        PP:"Sampling frequency\nAcceptance criteria",
        D:"Wrong part\nTransport damage\nMissing traceability",
        MP:"Part number\nQuantity\nVisual condition",
        CMS:"Receipt inspection\nBarcode verification"
      }}),
    mk("1.2","Prepare work kit",["Pick components","Arrange in sequence"],{
      cells:{
        RQ:"Complete kit\nComponents protected from damage",
        SW:"Digital work instructions",
        EM:"Kitting trolley\nProtective containers",
        IP:"Bill of materials\nAssembly sequence",
        PP:"Kit quantity\nStorage conditions",
        D:"Missing component\nMixed revision\nHandling damage",
        MP:"Kit completeness\nRevision status",
        CMS:"Kit checklist"
      }})
  ];
  const preparation=setOperationGroupName(A,A.ops[0],1,"Material preparation");
  setOperationGroupName(A,A.ops[1],1,"Material preparation");
  preparation.inputs=["RECEIVED COMPONENTS","RELEASED WORK ORDER"];
  preparation.outputs=["VERIFIED WORK KIT"];

  const B = newPhase("B","ASSEMBLY AND RELEASE");
  B.ops = [
    mk("2.1","Fit components",["Locate base component","Install mating components"],{
      cells:{
        RQ:"Parts seated correctly\nNo visible damage",
        EM:"Assembly fixture\nHand tools",
        IP:"Assembly drawing\nStandard work",
        PP:"Component orientation\nInstallation sequence",
        D:"Incorrect orientation\nPart not seated\nSurface damage",
        MP:"Position\nFit condition",
        CMS:"Visual inspection"
      }}),
    mk("2.2","Fasten assembly",["Install fasteners","Apply final torque"],{
      decision:{text:"Torque accepted?",yes:"Yes",no:"No",back:1},
      cells:{
        RQ:"Fasteners present\nTorque within approved limits",
        EM:"Calibrated torque tool",
        IP:"Torque specification\nTool setup instruction",
        PP:"Torque setting\nTightening sequence",
        D:"Missing fastener\nUnder-torque\nOver-torque",
        MP:"Applied torque\nTool calibration status",
        CMS:"Digital torque record",
        SPC:"Illustrative SPC plan - validate before use\nCTQ: applied torque\nChart: I-MR for sequential readings\nSampling: one reading per completed unit\nCL / UCL / LCL: establish from a stable baseline\nUSL / LSL: approved engineering specification\nReaction plan: contain affected units and investigate the cause"
      }}),
    mk("2.3","Final inspection",["Inspect assembly","Record result","Release product"],{
      inputs:["COMPLETED ASSEMBLY"],
      outputs:["RELEASED PRODUCT"],
      scrap:["NONCONFORMING MATERIAL"],
      cells:{
        RQ:"All acceptance criteria satisfied\nRecord complete",
        SW:"Quality record system",
        EM:"Inspection gauge",
        IP:"Inspection plan\nRelease checklist",
        PP:"Inspection sequence",
        D:"Undetected defect\nIncomplete record",
        MP:"Critical dimensions\nVisual condition",
        CMS:"Final inspection\nRecord review"
      }})
  ];
  const assembly=setOperationGroupName(B,B.ops[0],1,"Controlled assembly");
  setOperationGroupName(B,B.ops[1],1,"Controlled assembly");
  assembly.inputs=["VERIFIED WORK KIT"];
  assembly.outputs=["COMPLETED ASSEMBLY"];

  m.phases=[A,B];
  return normalizeProject(m);
}

/* ---------------- boot ---------------- */
function initialProject(){
  try{
    const raw=localStorage.getItem(AUTOSAVE_KEY);
    if(raw){
      const saved=JSON.parse(raw);
      if(saved&&saved.model&&(!saved.dirty||confirm(LANG==="pt"?"Foi encontrada uma recuperação automática. Pretende restaurá-la?":"An automatic recovery was found. Restore it?")))
        return {model:normalizeProject(saved.model),recovered:!!saved.dirty};
    }
  }catch(err){
    console.warn("Recovery could not be loaded:",err);
    localStorage.removeItem(AUTOSAVE_KEY);
  }
  return {model:exampleModel(),recovered:false};
}
const INITIAL=initialProject();
MODEL=INITIAL.model;
initUI();
applyLang();
resetHistory(!INITIAL.recovered);
if(INITIAL.recovered) setTimeout(()=>toast(T("recovered")),100);
setTimeout(fitZoom,80);
window.addEventListener("resize",()=>{updateMinimapViewport();});
window.addEventListener("beforeunload",e=>{commitCheckpoint();saveRecovery();if(isDirty()){e.preventDefault();e.returnValue="";}});
