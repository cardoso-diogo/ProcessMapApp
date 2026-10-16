"use strict";

const TESTS=[];
function test(name,fn){TESTS.push({name,fn});}
function assert(value,message="Assertion failed"){if(!value)throw new Error(message);}

test("Cell parsing preserves continuation lines",()=>{
  const items=parseCell("First\n- detail\n Second detail\nSecond","RQ","1.1");
  assert(items.length===2);
  assert(items[0].code==="RQ 1.1.1");
  assert(items[0].extra.length===2);
});

test("Phase codes continue after Z",()=>{
  const previous=MODEL;
  MODEL=newModel();
  MODEL.phases=Array.from({length:26},(_,i)=>newPhase(String.fromCharCode(65+i)));
  assert(nextPhaseCode()==="AA");
  MODEL=previous;
});

test("Decision back=1 targets the previous operation",()=>{
  assert(decisionTargetIndex(3,1)===2);
  assert(decisionTargetIndex(3,2)===1);
  assert(decisionTargetIndex(0,1)===0);
});

test("Map hit testing identifies layer cells and operations",()=>{
  MODEL=newModel();
  const phase=newPhase("A","Test phase"),operation=newOp("1.1");
  operation.title="Test operation";
  phase.ops=[operation];MODEL.phases=[phase];
  const result=buildDiagram(),col=result.cols[0];
  const layerRow=result.rows.find(r=>!r.L.flow);
  const flowRow=result.rows.find(r=>r.L.flow);
  const layer=mapEditTarget(col.x+2,layerRow.y+2,result);
  assert(layer?.type==="cell"&&layer.op===col.op);
  const metrics=flowMetrics(result.cols,MODEL.settings,MODEL.settings.fontBase,MODEL.settings.fontBase*MODEL.settings.lineH);
  const operationTarget=mapEditTarget(col.x+2,flowRow.y+9+metrics.g1H+metrics.g2H+metrics.topNodes,result);
  assert(operationTarget?.type==="operation"&&operationTarget.op===col.op);
});

test("Viewport context identifies the visible phase, operation and layer",()=>{
  MODEL=newModel();
  const firstPhase=newPhase("A","First"),secondPhase=newPhase("B","Second");
  firstPhase.ops=[newOp("1.1")];secondPhase.ops=[newOp("2.1")];MODEL.phases=[firstPhase,secondPhase];
  const result=buildDiagram(),col=result.cols[1],row=result.rows.find(candidate=>candidate.L.id==="D");
  const context=mapContextAt(col.x+col.w/2,row.y+row.h/2,result);
  assert(context.phase===secondPhase);
  assert(context.col.op===secondPhase.ops[0]);
  assert(context.row.L.id==="D");
  const header=mapContextAt(col.x+col.w/2,result.titleLayout.y+1,result);
  assert(header.phase===secondPhase&&header.row===null);
});

test("Multiline title and subtitle expand the title band and remain editable",()=>{
  MODEL=newModel();
  MODEL.meta.title="ASSEMBLY PROCESS MAP\nPilot line";
  MODEL.meta.subtitle="Released production data\nRevision A";
  const result=buildDiagram();
  const rendered=result.dl.o.filter(o=>o.t==="t").map(o=>o.s).join(" ");
  assert(rendered.includes("ASSEMBLY PROCESS MAP Pilot line"));
  assert(rendered.includes("Released production data Revision A"));
  assert(result.titleLayout.h>MODEL.settings.fontTitle*1.9);
  const subtitleTarget=mapEditTarget(result.titleLayout.subtitleX+1,result.titleLayout.y+1,result);
  assert(subtitleTarget?.type==="subtitle");
});

test("Visual themes change geometry and canvas treatment",()=>{
  MODEL=newModel();
  const phase=newPhase("A","Visual"),operation=newOp("1.1");
  operation.cells.RQ="Requirement";phase.ops=[operation];MODEL.phases=[phase];
  MODEL.meta.theme="plum";
  const classic=buildDiagram();
  MODEL.meta.theme="executive";
  const cards=buildDiagram();
  MODEL.meta.theme="blueprint";
  const blueprint=buildDiagram();
  assert(classic.background==="#ffffff");
  assert(cards.background==="#f4f6f8");
  assert(blueprint.background==="#071b2b");
  assert(cards.dl.o.some(o=>o.t==="r"&&o.rx===7));
  assert(blueprint.dl.o.some(o=>o.dash==="2 3"));
});

test("Save As picker writes the project and reports cancellation",async()=>{
  const originalPicker=window.showSaveFilePicker;
  let written=null,closed=false;
  window.showSaveFilePicker=async()=>({
    name:"project.json",
    createWritable:async()=>({
      write:async value=>{written=value;},
      close:async()=>{closed=true;}
    })
  });
  const saved=await saveProjectDocument("project.json",'{"ok":true}');
  assert(saved.saved&&saved.method==="picker");
  assert(written==='{"ok":true}'&&closed);
  window.showSaveFilePicker=async()=>{throw new DOMException("Cancelled","AbortError");};
  const cancelled=await saveProjectDocument("project.json","ignored");
  assert(!cancelled.saved);
  if(originalPicker) window.showSaveFilePicker=originalPicker;
  else delete window.showSaveFilePicker;
});

test("Operation flow has no arrows before the first or after the final operation",()=>{
  MODEL=newModel();
  const phase=newPhase("A","Flow");
  phase.ops=[newOp("1.1"),newOp("1.2")];
  MODEL.phases=[phase];
  const result=buildDiagram();
  const first=result.cols[0],last=result.cols[result.cols.length-1];
  const points=o=>o.t==="l"?[[o.x1,o.y1],[o.x2,o.y2]]:(o.t==="p"?o.pts:[]);
  const leadIn=result.dl.o.some(o=>points(o).some(([x])=>x<first.x-1));
  assert(!leadIn,"first operation must not draw an incoming arrow");
  const leadOut=result.dl.o.some(o=>points(o).some(([x])=>x>last.x+last.w+1));
  assert(!leadOut,"final operation must not draw an outgoing arrow");
  const between=result.dl.o.filter(o=>o.t==="l"&&o.s===theme().connector&&o.x1>=first.x+first.w&&o.x2<=last.x);
  const halo=result.dl.o.filter(o=>o.t==="l"&&o.s===theme().opBody&&o.sw>=3);
  assert(between.some(line=>line.sw>=1.15),"operation connectors should be visually emphasized");
  assert(halo.length>0,"operation connectors should include a contrast halo");
});

test("Operation codes do not have a redundant trailing zero",()=>{
  MODEL=newModel();
  const phase=newPhase("A","Flow"),operation=newOp("1.1");
  operation.title="Layup";phase.ops=[operation];MODEL.phases=[phase];
  const text=buildDiagram().dl.o.filter(o=>o.t==="t").map(o=>o.s).join(" ");
  assert(text.includes("OP A_1.1 Layup"));
  assert(!text.includes("OP A_1.1.0"));
});

test("Long operation titles and steps wrap without changing the default column width",()=>{
  MODEL=newModel();
  MODEL.settings.colW=110;
  const phase=newPhase("A","Flow"),operation=newOp("1.1");
  operation.title="Prepare and verify a particularly long operation title";
  operation.steps=["Confirm every required component against the released production record",
    "UNINTERRUPTEDIDENTIFIERTHATMUSTWRAPSAFELY"];
  phase.ops=[operation];MODEL.phases=[phase];operation.__phcode=phase.code;
  const metrics=opBoxHeight(operation,MODEL.settings,MODEL.settings.fontBase,
    MODEL.settings.fontBase*MODEL.settings.lineH,MODEL.settings.colW);
  const lineWidth=line=>Math.max(0,...line.map(segment=>segment.x+segment.w));
  assert(metrics.headLines.length>1,"Long operation titles should wrap");
  assert(metrics.stepLayouts[0].lines.length>1,"Long operation steps should wrap");
  assert(metrics.stepLayouts[1].lines.length>1,"Long uninterrupted text should hard-wrap");
  assert(metrics.headLines.every(line=>lineWidth(line)<=MODEL.settings.colW-12+.01));
  assert(metrics.stepLayouts.every(step=>step.lines.every(line=>lineWidth(line)<=MODEL.settings.colW-20+.01)));
  const result=buildDiagram();
  assert(result.cols[0].w===MODEL.settings.colW,"Text wrapping should preserve the common column width");
  assert(result.rows.find(row=>row.L.flow).h>MODEL.settings.rowMin,"The flow lane should grow to fit wrapped operations");
});

test("Flow nodes wrap long input and output labels without truncation",()=>{
  MODEL=newModel();
  const phase=newPhase("A","Flow"),operation=newOp("1.1");
  operation.width=120;
  operation.inputs=["RAW MATERIAL","RELEASED PRODUCTION DATA"];
  operation.outputs=["RELEASED MATERIAL AND DATA"];
  phase.ops=[operation];MODEL.phases=[phase];
  const result=buildDiagram();
  const rendered=result.dl.o.filter(o=>o.t==="t").map(o=>o.s).join(" ");
  const compact=rendered.replace(/\s/g,"");
  assert(compact.includes("RELEASEDPRODUCTIONDATA"),"Wrapped input text must remain complete");
  assert(compact.includes("RELEASEDMATERIALANDDATA"),"Wrapped output text must remain complete");
  assert(result.dl.o.some(o=>o.t==="r"&&o.f===theme().node&&o.h>15),"Long labels should increase node height");
});

test("Ungrouped operations keep the operation-only I/O layout",()=>{
  MODEL=newModel();
  const phase=newPhase("A","Flow"),operation=newOp("1.1");
  operation.inputs=["OPINPUT"];operation.outputs=["OPOUTPUT"];
  phase.ops=[operation];MODEL.phases=[phase];
  const result=buildDiagram();
  const metrics=flowMetrics(result.cols,MODEL.settings,MODEL.settings.fontBase,MODEL.settings.fontBase*MODEL.settings.lineH);
  const rendered=result.dl.o.filter(o=>o.t==="t").map(o=>o.s).join(" ");
  assert(phase.groups.length===0&&metrics.g1H===0&&metrics.g2H===0);
  assert(rendered.includes("OPINPUT")&&rendered.includes("OPOUTPUT"));
});

test("Shared group I/O renders once across a contiguous operation group",()=>{
  MODEL=newModel();
  const phase=newPhase("A","Flow"),first=newOp("1.1"),second=newOp("1.2");
  phase.ops=[first,second];MODEL.phases=[phase];
  const group=setOperationGroupName(phase,first,1,"Layup");
  setOperationGroupName(phase,second,1,"Layup");
  group.inputs=["GROUPINPUT"];group.outputs=["GROUPOUTPUT"];
  first.inputs=["OPINPUT"];
  const result=buildDiagram(),metrics=flowMetrics(result.cols,MODEL.settings,MODEL.settings.fontBase,MODEL.settings.fontBase*MODEL.settings.lineH);
  const labels=result.dl.o.filter(o=>o.t==="t").map(o=>o.s);
  assert(first.group1Id===second.group1Id&&phase.groups.length===1);
  assert(metrics.groups[0].length===1&&metrics.groups[0][0].first===0&&metrics.groups[0][0].last===1);
  assert(labels.filter(label=>label==="GROUPINPUT").length===1);
  assert(labels.filter(label=>label==="GROUPOUTPUT").length===1);
  assert(labels.includes("OPINPUT"),"Operation I/O must remain available inside a group");
  const groupOutline=result.dl.o.find(o=>o.t==="r"&&!o.f&&o.s===theme().groupBand[0]);
  const groupText=result.dl.o.find(o=>o.t==="t"&&o.s==="GROUPINPUT");
  const groupNode=result.dl.o.find(o=>o.t==="r"&&o.f===theme().node&&groupText&&
    groupText.x>=o.x&&groupText.x<=o.x+o.w&&groupText.y>=o.y&&groupText.y<=o.y+o.h);
  assert(groupOutline&&groupNode&&groupNode.y+groupNode.h<groupOutline.y,"Shared I/O must sit outside and above the group box");
  const restored=normalizeProject(JSON.parse(serializeModel(MODEL))),restoredGroup=restored.phases[0].groups[0];
  assert(restoredGroup.inputs[0]==="GROUPINPUT"&&restoredGroup.outputs[0]==="GROUPOUTPUT","Shared I/O must survive a save/open round trip");
});

test("Legacy repeated group names migrate to shared group records",()=>{
  const raw=newModel(),phase=newPhase("A","Legacy"),first=newOp("1.1"),second=newOp("1.2");
  first.group1="Layup";second.group1="Layup";
  phase.ops=[first,second];raw.phases=[phase];
  const migrated=normalizeProject(raw),migratedPhase=migrated.phases[0];
  assert(migratedPhase.groups.length===1);
  assert(migratedPhase.ops[0].group1Id===migratedPhase.ops[1].group1Id);
  assert(migratedPhase.groups[0].name==="Layup");
  assert(migratedPhase.groups[0].inputs.length===0&&migratedPhase.groups[0].outputs.length===0);
});

test("Project validation rejects malformed input",()=>{
  let rejected=false;
  try{normalizeProject({phases:"invalid",layers:[]});}catch(_){rejected=true;}
  assert(rejected);
});

test("Project migration supplies new settings",()=>{
  const raw=newModel();
  delete raw.settings.pdfMode;
  delete raw.settings.pdfOrientation;
  const migrated=normalizeProject(raw);
  assert(migrated.settings.pdfMode==="single");
  assert(migrated.settings.pdfOrientation==="landscape");
});

test("Legacy layers gain editable codes and the current schema version",()=>{
  const raw=newModel();
  delete raw.schemaVersion;
  raw.layers.forEach(layer=>delete layer.code);
  const migrated=normalizeProject(raw);
  assert(migrated.schemaVersion===PROJECT_SCHEMA_VERSION);
  assert(migrated.layers.every(layer=>layer.code===layer.id));
});

test("Custom layer codes render and survive a save/open round trip",()=>{
  MODEL=newModel();
  const phase=newPhase("A","Custom layers"),op=newOp("1.1"),layer=newInfoLayer("QA");
  layer.name={pt:"Qualidade",en:"Quality"};
  MODEL.layers.splice(MODEL.layers.length-1,0,layer);
  op.cells[layer.id]="Acceptance record";phase.ops=[op];MODEL.phases=[phase];
  let result=buildDiagram();
  let text=result.dl.o.filter(item=>item.t==="t").map(item=>item.s).join(" ");
  assert(text.includes("QA 1.1.1"));
  layer.code="QMS";
  result=buildDiagram();
  text=result.dl.o.filter(item=>item.t==="t").map(item=>item.s).join(" ");
  assert(text.includes("QMS 1.1.1")&&!text.includes("QA 1.1.1"));
  assert(op.cells[layer.id]==="Acceptance record","Renaming a display code must not move cell data");
  const restored=normalizeProject(JSON.parse(serializeModel(MODEL)));
  const restoredLayer=restored.layers.find(candidate=>candidate.id===layer.id);
  assert(restoredLayer?.code==="QMS");
  assert(restored.phases[0].ops[0].cells[layer.id]==="Acceptance record");
});

test("Layer codes must be valid and unique",()=>{
  const raw=newModel();
  raw.layers[1].code=raw.layers[0].code.toLowerCase();
  let duplicateRejected=false;
  try{normalizeProject(raw);}catch(_){duplicateRejected=true;}
  assert(duplicateRejected,"Layer codes must be unique without regard to case");
  raw.layers[1].code="invalid code";
  let invalidRejected=false;
  try{normalizeProject(raw);}catch(_){invalidRejected=true;}
  assert(invalidRejected,"Codes containing spaces must be rejected");
});

test("SPC migration preserves old project data and existing SPC configuration",()=>{
  const raw=newModel();
  delete raw.schemaVersion;
  raw.layers=raw.layers.filter(l=>l.id!=="SPC");
  const phase=newPhase("A","Legacy"),op=newOp("1.1");
  op.cells.MP="Temperature";phase.ops=[op];raw.phases=[phase];
  const migrated=normalizeProject(raw);
  assert(migrated.layers.filter(l=>l.id==="SPC").length===1);
  assert(migrated.layers.find(l=>l.id==="SPC").on);
  assert(migrated.layers.findIndex(l=>l.id==="SPC")===migrated.layers.findIndex(l=>l.id==="CMS")+1);
  assert(migrated.phases[0].ops[0].cells.MP==="Temperature");
  assert(!migrated.phases[0].ops[0].cells.SPC,"Migration must not invent SPC content");
  const spc=migrated.layers.find(l=>l.id==="SPC");
  spc.on=false;spc.box="#123456";spc.name.pt="Plano SPC";
  migrated.layers=migrated.layers.filter(l=>l.id!=="SPC");
  migrated.layers.unshift(spc);
  migrated.phases[0].ops[0].cells.SPC=SPC_GUIDANCE.pt.template;
  const restored=normalizeProject(JSON.parse(serializeModel(migrated)));
  assert(restored.layers.filter(l=>l.id==="SPC").length===1);
  assert(restored.layers[0].id==="SPC"&&!restored.layers[0].on);
  assert(restored.layers[0].box==="#123456"&&restored.layers[0].name.pt==="Plano SPC");
  assert(restored.phases[0].ops[0].cells.SPC===SPC_GUIDANCE.pt.template);
});

test("SPC templates render, export and support direct editing in every theme",()=>{
  MODEL=newModel();
  const phase=newPhase("A","SPC"),op=newOp("1.1");
  phase.ops=[op];MODEL.phases=[phase];
  for(const language of ["pt","en"]){
    op.cells.SPC=SPC_GUIDANCE[language].template;
    const items=parseCell(op.cells.SPC,"SPC",op.num);
    assert(items.length===10&&items[0].code==="SPC 1.1.1");
    for(const theme of Object.keys(THEMES)){
      MODEL.meta.theme=theme;
      assert(THEMES[theme].layer.SPC,"Theme must define SPC colours");
      const result=buildDiagram(),row=result.rows.find(r=>r.L.id==="SPC");
      assert(row&&row.h>MODEL.settings.rowMin);
      const target=mapEditTarget(result.cols[0].x+2,row.y+2,result);
      assert(target?.type==="cell"&&target.layer.id==="SPC");
      const svg=toSVG(result);
      assert(svg.includes("SPC 1.1.1")&&svg.includes("CTQ"));
      const pdf=new TextDecoder("latin1").decode(toPDF(result,{pdfMode:"single"}));
      assert(pdf.startsWith("%PDF-")&&pdf.includes("CTQ"));
    }
  }
  MODEL.layers.find(l=>l.id==="SPC").on=false;
  assert(!buildDiagram().rows.some(r=>r.L.id==="SPC"));
});

test("SVG escapes project text",()=>{
  MODEL=newModel();
  MODEL.meta.title="<unsafe & title>";
  const svg=toSVG(buildDiagram());
  assert(svg.includes("&lt;unsafe &amp; title&gt;"));
  assert(!svg.includes("<unsafe & title>"));
});

test("Single-page PDF has a valid signature",()=>{
  const pdf=toPDF(buildDiagram(),{pdfMode:"single"});
  const signature=Array.from(pdf.slice(0,5)).map(x=>String.fromCharCode(x)).join("");
  assert(signature==="%PDF-");
});

test("Unicode-safe PDF embeds browser-rendered text as an image",()=>{
  MODEL.meta.title="Medição Δ μ Ω 漢字";
  const pdf=toPDF(buildDiagram(),{pdfMode:"single",pdfTextMode:"unicode"});
  const text=new TextDecoder("latin1").decode(pdf);
  assert(text.startsWith("%PDF-"));
  assert(text.includes("/Subtype/Image"));
});

test("A4 export creates multiple vector pages for a wide map",()=>{
  MODEL=newModel();
  const phase=newPhase("A","Wide");
  phase.ops=Array.from({length:10},(_,i)=>newOp(`${i+1}.1`));
  MODEL.phases=[phase];
  const pdf=toPDF(buildDiagram(),{pdfMode:"a4",pdfOrientation:"landscape"});
  const text=new TextDecoder("latin1").decode(pdf);
  assert((text.match(/\/Type\/Page(?!s)/g)||[]).length>1);
});

(async()=>{
  const list=document.querySelector("#results");
  let passed=0;
  for(const t of TESTS){
    const item=document.createElement("li");
    try{await t.fn();item.className="pass";item.textContent="PASS — "+t.name;passed++;}
    catch(err){item.className="fail";item.textContent="FAIL — "+t.name+": "+err.message;}
    list.appendChild(item);
  }
  document.querySelector("#summary").textContent=`${passed}/${TESTS.length} tests passed`;
  document.title=passed===TESTS.length?"PASS — Process Map Builder tests":"FAIL — Process Map Builder tests";
})();
