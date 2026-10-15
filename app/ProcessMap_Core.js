"use strict";
/* ============================================================
   PROCESS MAP BUILDER — engine
   ============================================================ */

/* ---------------- i18n ---------------- */
const I18N = {
  pt:{
    new:"Novo", open:"Abrir…", save:"Guardar projeto", example:"Exemplo", undo:"Desfazer", redo:"Refazer",
    structure:"Estrutura", phase:"Fase", inspector:"Inspetor", fit:"Ajustar",
    settings:"Definições", close:"Fechar", helpTitle:"Como usar",
    subtitle:"Diagramas de processo",
    project:"Projeto", title:"Título", subt:"Subtítulo",
    addOp:"+ Operação", delPhase:"Eliminar fase", phaseCode:"Código", phaseName:"Nome da fase",
    opNum:"Nº da operação", opTitle:"Título da operação", steps:"Passos (uma linha por passo)",
    group1:"Grupo (nível 1)", group2:"Subgrupo (nível 2)",
    groupInputs:"Entradas partilhadas do grupo", groupOutputs:"Saídas partilhadas do grupo",
    groupIoHelp:"Aplicam-se uma vez a todo o grupo, não a cada operação.", groupFirst:"Defina primeiro o grupo de nível 1",
    inputs:"Entradas (uma por linha)", outputs:"Saídas (uma por linha)", scrap:"Sucata / refugo",
    decision:"Decisão a seguir a esta operação", decText:"Texto da decisão",
    decYes:"Etiqueta ramo sim", decNo:"Etiqueta ramo não", decBack:"Recuar N operações no ramo 'não'",
    layers:"Camadas de informação", noSel:"Selecione uma operação na árvore à esquerda,<br>ou crie uma fase para começar.",
    viewing:"A visualizar", mapHeader:"Cabeçalho do mapa", locateSelection:"Localizar seleção",
    width:"Largura da coluna (px)", del:"Eliminar", dup:"Duplicar", up:"Mover para cima", down:"Mover para baixo",
    general:"Geral", layout:"Layout", layersCfg:"Camadas", colW:"Largura de coluna",
    gap:"Espaço entre operações", phaseGap:"Espaço entre fases", labelW:"Largura da faixa de camadas",
    fontBase:"Tamanho de letra (conteúdo)", fontTitle:"Tamanho de letra (títulos)",
    rowMin:"Altura mínima de linha", margin:"Margem", enabled:"Ativa", name:"Nome", layerCode:"Código",
    addLayer:"+ Camada", newLayer:"Nova camada", deleteLayer:"Eliminar camada",
    confirmLayerDelete:"Eliminar esta camada e todo o conteúdo associado? Esta ação pode ser desfeita.",
    invalidLayerCode:"Use 1–16 letras, números, _ ou -; o código deve começar por uma letra ou número.",
    duplicateLayerCode:"Já existe uma camada com este código.",
    layerHelp:"O código aparece no mapa; a chave interna permanece estável para proteger os dados existentes.",
    boxColor:"Cor da caixa", labelColor:"Cor da faixa", ops:"operações", items:"itens",
    confirmDel:"Eliminar definitivamente?", saved:"Projeto guardado", exported:"Exportado",
    opsCount:"operações", pagesNote:"px", untitled:"Sem título",
    autoCode:"Códigos gerados automaticamente a partir do nº da operação.",
    contHelp:"Linhas começadas por «-» ou espaço continuam o item anterior (sem novo código).",
    newPhase:"Nova fase", newOp:"Nova operação", noteOrder:"Arraste com ↑ ↓ para reordenar.",
    recovered:"Projeto recuperado automaticamente", invalidProject:"Projeto inválido", unsaved:"Existem alterações não guardadas.",
    pdfMode:"Formato do PDF", pdfLarge:"Página única", pdfA4:"A4 multipágina", pdfA3:"A3 multipágina",
    pdfOrientation:"Orientação", landscape:"Horizontal", portrait:"Vertical",
    pdfTextMode:"Texto no PDF", pdfVectorText:"Vetorial (compatível)", pdfUnicodeText:"Unicode (imagem)"
  },
  en:{
    new:"New", open:"Open…", save:"Save project", example:"Example", undo:"Undo", redo:"Redo",
    structure:"Structure", phase:"Phase", inspector:"Inspector", fit:"Fit",
    settings:"Settings", close:"Close", helpTitle:"How to use",
    subtitle:"Process diagrams",
    project:"Project", title:"Title", subt:"Subtitle",
    addOp:"+ Operation", delPhase:"Delete phase", phaseCode:"Code", phaseName:"Phase name",
    opNum:"Operation no.", opTitle:"Operation title", steps:"Steps (one per line)",
    group1:"Group (level 1)", group2:"Subgroup (level 2)",
    groupInputs:"Shared group inputs", groupOutputs:"Shared group outputs",
    groupIoHelp:"Applied once to the whole group, not to each operation.", groupFirst:"Define the level 1 group first",
    inputs:"Inputs (one per line)", outputs:"Outputs (one per line)", scrap:"Scrap",
    decision:"Decision after this operation", decText:"Decision text",
    decYes:"Yes branch label", decNo:"No branch label", decBack:"Go back N operations on 'no'",
    layers:"Layers of information", noSel:"Select an operation in the tree on the left,<br>or create a phase to start.",
    viewing:"Viewing", mapHeader:"Map header", locateSelection:"Locate selection",
    width:"Column width (px)", del:"Delete", dup:"Duplicate", up:"Move up", down:"Move down",
    general:"General", layout:"Layout", layersCfg:"Layers", colW:"Column width",
    gap:"Gap between operations", phaseGap:"Gap between phases", labelW:"Layer label strip width",
    fontBase:"Body font size", fontTitle:"Title font size",
    rowMin:"Minimum row height", margin:"Margin", enabled:"On", name:"Name", layerCode:"Code",
    addLayer:"+ Layer", newLayer:"New layer", deleteLayer:"Delete layer",
    confirmLayerDelete:"Delete this layer and all associated content? This action can be undone.",
    invalidLayerCode:"Use 1–16 letters, numbers, _ or -; the code must start with a letter or number.",
    duplicateLayerCode:"Another layer already uses this code.",
    layerHelp:"The code is shown on the map; the internal key stays stable to protect existing data.",
    boxColor:"Box colour", labelColor:"Strip colour", ops:"operations", items:"items",
    confirmDel:"Delete permanently?", saved:"Project saved", exported:"Exported",
    opsCount:"operations", pagesNote:"px", untitled:"Untitled",
    autoCode:"Codes are generated automatically from the operation number.",
    contHelp:"Lines starting with “-” or a space continue the previous item (no new code).",
    newPhase:"New phase", newOp:"New operation", noteOrder:"Use ↑ ↓ to reorder.",
    recovered:"Project recovered automatically", invalidProject:"Invalid project", unsaved:"There are unsaved changes.",
    pdfMode:"PDF format", pdfLarge:"Single page", pdfA4:"A4 tiled", pdfA3:"A3 tiled",
    pdfOrientation:"Orientation", landscape:"Landscape", portrait:"Portrait",
    pdfTextMode:"PDF text", pdfVectorText:"Vector (compatible)", pdfUnicodeText:"Unicode (image)"
  }
};
let LANG = "pt";
const T = k => (I18N[LANG][k] !== undefined ? I18N[LANG][k] : k);

/* ---------------- themes ---------------- */
const THEMES = {
  plum:{
    name:"Ameixa / Plum",
    visual:{family:"classic"},
    title:"#7a2b57", titleTxt:"#ffffff",
    phase:"#173b52", phaseTxt:"#ffffff",
    grid:"#a03a6b", flowLane:"#7a2b57", flowLaneTxt:"#ffffff",
    opHead:"#dba9c4", opHeadTxt:"#1a1a1a", opBody:"#ffffff",
    groupBand:["#7a2b57","#dba9c4"], groupBandTxt:["#ffffff","#1a1a1a"],
    node:"#12b5c9", nodeTxt:"#ffffff", scrap:"#f5c273", scrapTxt:"#5a3d0b",
    decision:"#eaf3d9", decisionStroke:"#5b8c2a", connector:"#1f7fd4",
    layer:{RQ:["#e8f2ee","#cfe4dc"],SW:["#dbead4","#c3ddb8"],EM:["#93c47d","#7ab35f"],
           IP:["#dcdcdc","#c9c9c9"],PP:["#d4d4d4","#c0c0c0"],
           D:["#fce8bd","#f6d68e"],MP:["#fbd9b4","#f7c188"],CMS:["#f6b26b","#ef9c43"],
           SPC:["#d4eeeb","#a8d8d2"],IM:["#dbe3f0","#c3d0e6"],DSET:["#d3ddee","#bccbe4"],DSS:["#d3ddee","#bccbe4"]}
  },
  greenblue:{
    name:"Verde / azul (E3.2A)",
    visual:{family:"classic"},
    title:"#eef7ee", titleTxt:"#1c6b33",
    phase:"#eef7ee", phaseTxt:"#1c6b33",
    grid:"#3aa655", flowLane:"#1c9c4b", flowLaneTxt:"#ffffff",
    opHead:"#bfe3c6", opHeadTxt:"#123", opBody:"#ffffff",
    groupBand:["#1c9c4b","#bfe3c6"], groupBandTxt:["#ffffff","#123"],
    node:"#12b5c9", nodeTxt:"#ffffff", scrap:"#f5c273", scrapTxt:"#5a3d0b",
    decision:"#eaf3d9", decisionStroke:"#5b8c2a", connector:"#12a5c9",
    layer:{RQ:["#eaf4fb","#cbe4f5"],SW:["#e6f4ea","#c7e6d2"],EM:["#d7efdc","#b4dfc0"],
           IP:["#eef3f7","#d6e2ec"],PP:["#e9eef2","#cfdae3"],
           D:["#eaf4fb","#cbe4f5"],MP:["#e6f6f7","#c2e8ea"],CMS:["#d8f0e2","#b3e0c6"],
           SPC:["#ddf1ec","#b4ded2"],IM:["#e4eef8","#c6dcf0"],DSET:["#e4eef8","#c6dcf0"],DSS:["#e4eef8","#c6dcf0"]}
  },
  crimson:{
    name:"Carmesim / Crimson",
    visual:{family:"classic"},
    title:"#8B2638", titleTxt:"#ffffff",
    phase:"#3f2d33", phaseTxt:"#ffffff",
    grid:"#b4707d",
    flowLane:"#8B2638", flowLaneTxt:"#ffffff",
    opHead:"#e8c3ca", opHeadTxt:"#2a1116", opBody:"#ffffff",
    groupBand:["#8B2638","#e8c3ca"], groupBandTxt:["#ffffff","#2a1116"],
    node:"#0f8fa8", nodeTxt:"#ffffff", scrap:"#f0b96b", scrapTxt:"#4a2f06",
    decision:"#fbeef0", decisionStroke:"#8B2638", connector:"#1f7fd4",
    layer:{RQ:["#fbeef0","#f1d4d9"],SW:["#f3eef7","#e0d3ec"],EM:["#e7efe4","#cfe0c9"],
           IP:["#efefef","#dcdcdc"],PP:["#e7e7e7","#d2d2d2"],
           D:["#fdf0d9","#f7ddaf"],MP:["#fde6d3","#f8ccae"],CMS:["#f7c69a","#f0a970"],
           SPC:["#e0eeeb","#bdd8d1"],IM:["#e3e9f3","#c9d5e8"],DSET:["#e3e9f3","#c9d5e8"],DSS:["#e3e9f3","#c9d5e8"]}
  },
  mono:{
    name:"Neutro (mono)",
    visual:{family:"classic"},
    title:"#2f3a45", titleTxt:"#ffffff",
    phase:"#4a5a68", phaseTxt:"#ffffff",
    grid:"#7d8b98", flowLane:"#2f3a45", flowLaneTxt:"#ffffff",
    opHead:"#c9d2da", opHeadTxt:"#1a1a1a", opBody:"#ffffff",
    groupBand:["#2f3a45","#c9d2da"], groupBandTxt:["#ffffff","#1a1a1a"],
    node:"#3d7ea6", nodeTxt:"#ffffff", scrap:"#d9b382", scrapTxt:"#3d2a08",
    decision:"#f0f3f5", decisionStroke:"#5c6b78", connector:"#4a5a68",
    layer:{RQ:["#f2f4f6","#dde3e8"],SW:["#eef1f3","#d8dfe4"],EM:["#e6ebef","#cfd8de"],
           IP:["#f0f0f0","#dcdcdc"],PP:["#eaeaea","#d5d5d5"],
           D:["#f4f2ee","#e2ded5"],MP:["#f2efea","#ded9cf"],CMS:["#ece7df","#d6cec1"],
           SPC:["#edf2f0","#d2dfd9"],IM:["#eef1f5","#d9e0e8"],DSET:["#eef1f5","#d9e0e8"],DSS:["#eef1f5","#d9e0e8"]}
  },
  executive:{
    name:"Executive · cartões modernos",
    visual:{family:"cards",canvas:"#f4f6f8",titleMode:"minimal",titleRadius:8,phaseRadius:8,
      cellRadius:7,cellInset:7,cellShadow:true,rowBorders:false,labelMode:"code",opRadius:8,
      stepRadius:4,groupRadius:6,gridDash:"3 4",connectorWidth:1.25},
    title:"#ffffff",titleTxt:"#17212b",accent:"#2563eb",
    phase:"#dbeafe",phaseTxt:"#163b73",
    grid:"#b9c5d2",flowLane:"#e8eef6",flowLaneTxt:"#17365f",
    opHead:"#2563eb",opHeadTxt:"#ffffff",opBody:"#ffffff",
    groupBand:["#17365f","#bfdbfe"],groupBandTxt:["#ffffff","#17365f"],
    node:"#0f766e",nodeTxt:"#ffffff",scrap:"#fff1d6",scrapTxt:"#7c4a03",
    decision:"#fef3c7",decisionStroke:"#d97706",connector:"#2563eb",
    text:"#17212b",subText:"#52606d",cellStroke:"#d4dce5",rowFill:"#eef2f6",shadow:"#0f172a18",
    layer:{RQ:["#ffffff","#dbeafe"],SW:["#ffffff","#e0e7ff"],EM:["#ffffff","#dcfce7"],
           IP:["#ffffff","#e0f2fe"],PP:["#ffffff","#f0f9ff"],D:["#ffffff","#fee2e2"],
           MP:["#ffffff","#fef3c7"],CMS:["#ffffff","#ede9fe"],IM:["#ffffff","#cffafe"],
           SPC:["#ffffff","#99f6e4"],DSET:["#ffffff","#e2e8f0"],DSS:["#ffffff","#fae8ff"]}
  },
  blueprint:{
    name:"Blueprint · desenho técnico",
    visual:{family:"blueprint",canvas:"#071b2b",titleMode:"outline",titleRadius:0,phaseRadius:0,
      cellRadius:0,cellInset:4,cellShadow:false,rowBorders:true,labelMode:"code",opRadius:0,
      stepRadius:0,groupRadius:0,gridDash:"2 3",connectorWidth:1.1},
    title:"#071b2b",titleTxt:"#e0f7ff",accent:"#35d5ff",
    phase:"#0b3048",phaseTxt:"#8ce7ff",
    grid:"#29617a",flowLane:"#09263a",flowLaneTxt:"#8ce7ff",
    opHead:"#0e4c69",opHeadTxt:"#e0f7ff",opBody:"#0a2435",
    groupBand:["#0e4c69","#123d55"],groupBandTxt:["#e0f7ff","#8ce7ff"],
    node:"#0c6177",nodeTxt:"#e0f7ff",scrap:"#593f1e",scrapTxt:"#ffd58a",
    decision:"#14384a",decisionStroke:"#35d5ff",connector:"#35d5ff",
    text:"#d8eef5",subText:"#9cc3d1",cellStroke:"#34708a",rowFill:"#092336",shadow:"#00000000",
    layer:{RQ:["#0b293b","#0e3c54"],SW:["#0a2638","#11364a"],EM:["#0c2e38","#164651"],
           IP:["#0b293b","#12394d"],PP:["#0a2638","#11364a"],D:["#302a27","#5a3d32"],
           MP:["#102d3a","#174557"],CMS:["#102b3d","#16415a"],IM:["#0b293b","#12394d"],
           SPC:["#0a3038","#14535a"],DSET:["#0b293b","#12394d"],DSS:["#0b293b","#12394d"]}
  },
  lean:{
    name:"Lean Board · gestão visual",
    visual:{family:"lean",canvas:"#fffdf7",titleMode:"accent",titleRadius:0,phaseRadius:10,
      cellRadius:3,cellInset:3,cellShadow:false,rowBorders:true,labelMode:"code",opRadius:3,
      stepRadius:2,groupRadius:3,gridDash:null,connectorWidth:1.4},
    title:"#fffdf7",titleTxt:"#202b2f",accent:"#f97316",
    phase:"#263238",phaseTxt:"#ffffff",
    grid:"#b8b3a7",flowLane:"#fff4d6",flowLaneTxt:"#3f3a2e",
    opHead:"#263238",opHeadTxt:"#ffffff",opBody:"#fffef9",
    groupBand:["#f97316","#fed7aa"],groupBandTxt:["#ffffff","#7c2d12"],
    node:"#168aad",nodeTxt:"#ffffff",scrap:"#ffe8cc",scrapTxt:"#8a3b0a",
    decision:"#fff2a8",decisionStroke:"#b7791f",connector:"#e85d04",
    text:"#263238",subText:"#5f6360",cellStroke:"#cbc5b8",rowFill:"#faf7ef",shadow:"#00000000",
    layer:{RQ:["#fffef9","#d8f3dc"],SW:["#fffef9","#dbeafe"],EM:["#fffef9","#d9f99d"],
           IP:["#fffef9","#e0f2fe"],PP:["#fffef9","#fef3c7"],D:["#fffef9","#fecaca"],
           MP:["#fffef9","#fde68a"],CMS:["#fffef9","#ddd6fe"],IM:["#fffef9","#a5f3fc"],
           SPC:["#fffef9","#99f6e4"],DSET:["#fffef9","#e5e7eb"],DSS:["#fffef9","#f5d0fe"]}
  }
};

/* ---------------- default layer set ---------------- */
const DEFAULT_LAYERS = [
  {id:"RQ",   pt:"Requisitos",              en:"Requirements",              on:true},
  {id:"SW",   pt:"Software",                en:"Software",                  on:true},
  {id:"EM",   pt:"Equipamento/Máquinas",    en:"Equipment/Machinery",       on:true},
  {id:"IP",   pt:"Parâmetros de entrada",   en:"Input parameters",          on:true},
  {id:"PP",   pt:"Parâmetros de processo",  en:"Process parameters",        on:true},
  {id:"OP",   pt:"Fluxo do processo",       en:"Process Flow",              on:true, flow:true},
  {id:"D",    pt:"Defeitos",                en:"Defects",                   on:true},
  {id:"MP",   pt:"Parâmetros monitorizados",en:"Monitoring parameters",     on:true},
  {id:"CMS",  pt:"Sistemas de monitorização atuais", en:"Current Monitoring Systems", on:true},
  {id:"SPC",  pt:"Controlo Estatístico do Processo", en:"Statistical Process Control", on:true},
  {id:"IM",   pt:"Monitorização (IM)",      en:"Flash_IM",                  on:true},
  {id:"DSET", pt:"Base de dados (DSET)",    en:"Flash_DSET",                on:false},
  {id:"DSS",  pt:"Ação corretiva (DSS)",    en:"Flash_DSS",                 on:false}
];

const SPC_GUIDANCE = {
  pt:{
    insert:"Inserir modelo SPC",
    help:"CTQ: característica crítica para a qualidade (unidade e método de medição). Cartas por variáveis: Xbar-R / Xbar-S para subgrupos racionais; I-MR para valores individuais. Por atributos: p / np para unidades não conformes (np exige tamanho constante); c / u para contagem de defeitos (c exige oportunidade constante). CL: linha central; UCL/LCL (LSC/LIC): limites de controlo estimados do processo, não tolerâncias. USL/LSL (LSE/LIE): limites de especificação. Cp/Cpk: capacidade com variação intra-subgrupo; Pp/Ppk: desempenho com variação global. Confirmar estabilidade, adequação da distribuição e sistema de medição antes de interpretar os índices. Definir regras de alarme (ex.: Nelson ou Western Electric) e plano de reação. Esta camada documenta o plano; não calcula cartas nem índices.",
    template:[
      "CTQ / característica: [definir]; unidade: [definir]",
      "Medição / MSA: [método, instrumento, calibração e avaliação Gage R&R]",
      "Carta de controlo: [selecionar Xbar-R, Xbar-S, I-MR, p, np, c ou u]",
      "Amostragem: n = [definir]; frequência = [definir]; subgrupo racional = [definir]",
      "CL / UCL / LCL: [definir por carta, a partir de dados de referência estáveis]",
      "USL / LSL / alvo: [definir pela especificação; não usar como limites de controlo]",
      "Cp / Cpk; Pp / Ppk: [registar índice aplicável, período e critério aprovado]",
      "Regras de alarme: [selecionar conjunto e regras aplicáveis]",
      "Plano de reação: [contenção, investigação de causa especial, ação e verificação]",
      "Responsável / registo / rastreabilidade: [definir]"
    ].join("\n")
  },
  en:{
    insert:"Insert SPC template",
    help:"CTQ: critical-to-quality characteristic (unit and measurement method). Variable charts: Xbar-R / Xbar-S for rational subgroups; I-MR for individual values. Attribute charts: p / np for nonconforming units (np requires constant sample size); c / u for defect counts (c requires constant opportunity). CL: centre line; UCL/LCL: control limits estimated from the process, not tolerances. USL/LSL: specification limits. Cp/Cpk: capability using within-subgroup variation; Pp/Ppk: performance using overall variation. Confirm stability, distribution suitability and measurement system adequacy before interpreting indices. Define alarm rules (e.g. Nelson or Western Electric) and a reaction plan. This layer documents the plan; it does not calculate charts or indices.",
    template:[
      "CTQ / characteristic: [define]; unit: [define]",
      "Measurement / MSA: [method, instrument, calibration and Gage R&R assessment]",
      "Control chart: [select Xbar-R, Xbar-S, I-MR, p, np, c or u]",
      "Sampling: n = [define]; frequency = [define]; rational subgroup = [define]",
      "CL / UCL / LCL: [define per chart, using stable baseline data]",
      "USL / LSL / target: [define from specifications; not control limits]",
      "Cp / Cpk; Pp / Ppk: [record applicable index, period and approved criterion]",
      "Alarm rules: [select rule set and applicable rules]",
      "Reaction plan: [containment, special-cause investigation, action and verification]",
      "Owner / record / traceability: [define]"
    ].join("\n")
  }
};

/* ---------------- model ---------------- */
const PROJECT_SCHEMA_VERSION = 2;
let uid = 1; const nid = () => "id" + (uid++) + "_" + Math.floor(performance.now()%100000);

function newModel(){
  return {
    schemaVersion:PROJECT_SCHEMA_VERSION,
    meta:{ title:"Novo mapa de processos", subtitle:"", theme:"plum" },
    settings:{ colW:210, gap:26, phaseGap:44, labelW:34, margin:16,
               fontBase:7, fontTitle:18, fontPhase:11, rowMin:52, stepH:17, lineH:1.32,
               pdfMode:"single", pdfOrientation:"landscape", pdfTextMode:"vector" },
    layers: DEFAULT_LAYERS.map(l=>({id:l.id, code:l.id, name:{pt:l.pt,en:l.en}, on:l.on, flow:!!l.flow,
                                    box:null, strip:null})),
    phases:[]
  };
}
function newPhase(code,name){ return {id:nid(), code:code||"A", name:name||T("newPhase"), groups:[], ops:[]}; }
function newOp(num){
  return {id:nid(), num:num||"1.1", title:T("newOp"), steps:[], group1Id:"", group2Id:"",
          inputs:[], outputs:[], scrap:[], width:0,
          decision:null, cells:{}};
}
function layerCode(layer){ return String(layer?.code||layer?.id||"L").trim(); }
function nextLayerCode(){
  const used=new Set(MODEL.layers.map(layer=>layerCode(layer).toUpperCase()));
  for(let n=1;n<1000;n++) if(!used.has("L"+n)) return "L"+n;
  return "L"+Date.now().toString(36).slice(-4).toUpperCase();
}
function newInfoLayer(code=nextLayerCode()){
  return {id:"layer_"+nid(),code,name:{pt:I18N.pt.newLayer,en:I18N.en.newLayer},on:true,flow:false,
    box:null,strip:null};
}
function phaseGroup(phase,id){ return id?(phase.groups||[]).find(group=>group.id===id)||null:null; }
function operationGroup(phase,op,level){ return phaseGroup(phase,op[level===1?"group1Id":"group2Id"]); }
function cleanupPhaseGroups(phase){
  const used=new Set();
  phase.ops.forEach(op=>{if(op.group1Id)used.add(op.group1Id);if(op.group2Id)used.add(op.group2Id);});
  phase.groups=(phase.groups||[]).filter(group=>used.has(group.id));
}
function setOperationGroupName(phase,op,level,value){
  const key=level===1?"group1Id":"group2Id",name=String(value||"").trim();
  const parentId=level===2?(op.group1Id||null):null;
  const current=operationGroup(phase,op,level);
  if(!name){
    op[key]="";
    if(level===1) op.group2Id="";
    cleanupPhaseGroups(phase);
    return null;
  }
  if(level===2&&!op.group1Id){op.group2Id="";cleanupPhaseGroups(phase);return null;}
  if(current){current.name=name;return current;}
  const index=phase.ops.indexOf(op);
  const adjacent=[phase.ops[index-1],phase.ops[index+1]].filter(Boolean)
    .map(other=>operationGroup(phase,other,level))
    .find(group=>group&&group.name===name&&(level===1||group.parentId===parentId));
  const group=adjacent||{id:nid(),level,name,parentId,inputs:[],outputs:[]};
  if(!adjacent) phase.groups.push(group);
  op[key]=group.id;
  return group;
}

let MODEL = newModel();
let SEL = null;                 // {phaseId, opId} | {phaseId}
let LAST = null;                // last layout result
const AUTOSAVE_KEY = "processMapBuilder.autosave.v2";
const HISTORY_LIMIT = 80;
let HISTORY = [], HISTORY_INDEX = -1, HISTORY_TIMER = 0, AUTOSAVE_TIMER = 0;
let HISTORY_SUSPENDED = true, LAST_SAVED_SIGNATURE = "";

function serializeModel(model=MODEL){
  return JSON.stringify(model,(k,v)=>k.startsWith("__")?undefined:v);
}
function modelSnapshot(){ return serializeModel(); }
function resetHistory(markSaved=false){
  clearTimeout(HISTORY_TIMER);
  HISTORY=[modelSnapshot()]; HISTORY_INDEX=0; HISTORY_SUSPENDED=false;
  if(markSaved) LAST_SAVED_SIGNATURE=HISTORY[0];
  updateHistoryButtons();
}
function scheduleCheckpoint(){
  if(HISTORY_SUSPENDED) return;
  clearTimeout(HISTORY_TIMER);
  HISTORY_TIMER=setTimeout(commitCheckpoint,350);
  clearTimeout(AUTOSAVE_TIMER);
  AUTOSAVE_TIMER=setTimeout(saveRecovery,500);
}
function commitCheckpoint(){
  if(HISTORY_SUSPENDED) return;
  const snap=modelSnapshot();
  if(HISTORY[HISTORY_INDEX]===snap) return;
  HISTORY=HISTORY.slice(0,HISTORY_INDEX+1);
  HISTORY.push(snap);
  if(HISTORY.length>HISTORY_LIMIT) HISTORY.shift(); else HISTORY_INDEX++;
  if(HISTORY_INDEX>=HISTORY.length) HISTORY_INDEX=HISTORY.length-1;
  updateHistoryButtons();
}
function restoreHistory(index){
  if(index<0||index>=HISTORY.length) return;
  clearTimeout(HISTORY_TIMER);
  HISTORY_SUSPENDED=true; HISTORY_INDEX=index;
  MODEL=normalizeProject(JSON.parse(HISTORY[index]));
  SEL=null; $("#themeSel").value=MODEL.meta.theme;
  renderAll(); HISTORY_SUSPENDED=false; updateHistoryButtons(); saveRecovery();
}
function updateHistoryButtons(){
  const u=$("#btnUndo"), r=$("#btnRedo");
  if(u) u.disabled=HISTORY_INDEX<=0;
  if(r) r.disabled=HISTORY_INDEX<0||HISTORY_INDEX>=HISTORY.length-1;
}
function saveRecovery(){
  try{ localStorage.setItem(AUTOSAVE_KEY,JSON.stringify({savedAt:Date.now(),dirty:isDirty(),model:JSON.parse(modelSnapshot())})); }
  catch(err){ console.warn("Autosave unavailable:",err); }
}
function isDirty(){ return modelSnapshot()!==LAST_SAVED_SIGNATURE; }

const theme = () => THEMES[MODEL.meta.theme] || THEMES.plum;
function visualTheme(th=theme()){
  return Object.assign({family:"classic",canvas:"#ffffff",titleMode:"band",titleRadius:0,phaseRadius:0,
    cellRadius:0,cellInset:4,cellShadow:false,rowBorders:true,labelMode:"full",opRadius:0,
    stepRadius:0,groupRadius:0,gridDash:null,connectorWidth:.9},th.visual||{});
}
const activeLayers = () => MODEL.layers.filter(l=>l.on);
function layerColors(l){
  const th = theme(); const d = th.layer[l.id] || ["#f0f0f0","#d8d8d8"];
  return { box:l.box||d[0], strip:l.strip||d[1] };
}

/* ============================================================
   TEXT MEASUREMENT
   ============================================================ */
const FONT_FAMILY = "Helvetica, Arial, sans-serif";
const _mc = document.createElement("canvas").getContext("2d");
const _cache = new Map();
function fontStr(size,bold){ return (bold?"bold ":"") + size + "px " + FONT_FAMILY; }
function measure(s,size,bold){
  const k = (bold?"b":"n") + size + "|" + s;
  let v = _cache.get(k);
  if(v===undefined){ _mc.font = fontStr(size,bold); v = _mc.measureText(s).width; _cache.set(k,v); }
  return v;
}
/* wrap a list of runs [{s,bold}] into lines of merged segments */
function wrapRuns(runs, maxW, size){
  const lines = []; let cur = []; let cx = 0;
  for(const run of runs){
    const words = String(run.s).split(/\s+/).filter(w=>w.length);
    for(const w of words){
      const ww = measure(w,size,run.bold);
      const sw = cx>0 ? measure(" ",size,run.bold) : 0;
      if(cx>0 && cx+sw+ww > maxW){ lines.push(cur); cur=[{s:w,bold:run.bold,x:0,w:ww}]; cx=ww; }
      else { cur.push({s:w,bold:run.bold,x:cx+sw,w:ww}); cx += sw+ww; }
    }
  }
  if(cur.length) lines.push(cur);
  // merge adjacent segments with same weight
  return lines.map(line=>{
    const out=[];
    for(const sg of line){
      const p = out[out.length-1];
      if(p && p.bold===sg.bold){ p.s += " " + sg.s; p.w = measure(p.s,size,p.bold); }
      else out.push({...sg});
    }
    return out;
  });
}
function wrapPlain(s,maxW,size,bold){ return wrapRuns([{s,bold:!!bold}],maxW,size); }
function wrapTextBlock(s,maxW,size,bold){
  const out=[];
  String(s||"").replace(/\r/g,"").split("\n").forEach(raw=>{
    if(!raw.trim()){out.push("");return;}
    const wrapped=wrapPlain(raw,maxW,size,bold);
    if(!wrapped.length) out.push("");
    else wrapped.forEach(line=>out.push(line.map(segment=>segment.s).join(" ")));
  });
  return out.length?out:[""];
}

/* ============================================================
   DISPLAY LIST  (backend-agnostic primitives)
   ============================================================ */
class DL{
  constructor(){ this.o=[]; }
  rect(x,y,w,h,o={}){ this.o.push({t:"r",x,y,w,h,f:o.fill||null,s:o.stroke||null,sw:o.sw||0.6,rx:o.rx||0,dash:o.dash||null}); }
  line(x1,y1,x2,y2,o={}){ this.o.push({t:"l",x1,y1,x2,y2,s:o.stroke||"#000",sw:o.sw||0.6,dash:o.dash||null}); }
  poly(pts,o={}){ this.o.push({t:"p",pts,f:o.fill||null,s:o.stroke||null,sw:o.sw||0.6,close:o.close!==false}); }
  text(x,y,s,o={}){
    if(s===undefined||s===null||s==="") return;
    const size=o.size||7, bold=!!o.bold;
    const w = measure(String(s),size,bold);
    this.o.push({t:"t",x,y,s:String(s),size,bold,f:o.fill||"#000",anchor:o.anchor||"start",rot:o.rot||0,w});
  }
}
/* arrow helpers */
const AR = 3.2;
function arrowHead(dl,x,y,dir,color,size=AR){ // dir: 'r','l','u','d'
  let p;
  if(dir==="r") p=[[x,y],[x-size*1.6,y-size],[x-size*1.6,y+size]];
  else if(dir==="l") p=[[x,y],[x+size*1.6,y-size],[x+size*1.6,y+size]];
  else if(dir==="d") p=[[x,y],[x-size,y-size*1.6],[x+size,y-size*1.6]];
  else p=[[x,y],[x-size,y+size*1.6],[x+size,y+size*1.6]];
  dl.poly(p,{fill:color,stroke:null});
}
function arrow(dl,pts,color,sw,options={}){
  const width=sw||0.9,headSize=options.headSize||AR;
  const a=pts[pts.length-2], b=pts[pts.length-1];
  let dir = Math.abs(b[0]-a[0])>Math.abs(b[1]-a[1]) ? (b[0]>a[0]?"r":"l") : (b[1]>a[1]?"d":"u");
  if(options.halo){
    for(let i=0;i<pts.length-1;i++)
      dl.line(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],{stroke:options.halo,sw:width+(options.haloWidth||1.8)});
    arrowHead(dl,b[0],b[1],dir,options.halo,headSize+1.25);
  }
  for(let i=0;i<pts.length-1;i++) dl.line(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],{stroke:color,sw:width});
  arrowHead(dl,b[0],b[1],dir,color,headSize);
}

/* ============================================================
   CELL CONTENT PARSING
   ============================================================ */
/* raw text -> items [{code,runs:[{s,bold}]}] */
function parseCell(raw, layerId, opNum){
  const out=[]; if(!raw) return out;
  const lines = String(raw).replace(/\r/g,"").split("\n");
  let n=0;
  for(const ln of lines){
    if(!ln.trim()) continue;
    const cont = /^[\s\-•·]/.test(ln);
    if(cont && out.length){ out[out.length-1].extra.push(ln.replace(/^[\s]*/,"")); }
    else { n++; out.push({code:`${layerId} ${opNum}.${n}`, text:ln.trim(), extra:[]}); }
  }
  return out;
}
function measureCellItems(items, maxW, size, lh){
  let h = 0; const laid=[];
  for(const it of items){
    const lines = wrapRuns([{s:it.code+" ",bold:true},{s:it.text,bold:false}], maxW, size);
    const ex = it.extra.map(e=>wrapPlain(e, maxW-6, size)).flat();
    laid.push({lines,ex});
    h += (lines.length+ex.length)*lh + 1.5;
  }
  return {laid,h};
}

/* ============================================================
   LAYOUT + DRAW
   ============================================================ */
function buildDiagram(){
  const S = MODEL.settings, th = theme(), dl = new DL();
  const V = visualTheme(th);
  const layers = activeLayers();
  const flowLayer = layers.find(l=>l.flow);
  const size = S.fontBase, lh = S.fontBase*S.lineH;
  const PAD = V.cellInset;

  /* ---- columns ---- */
  const cols=[]; const phaseSpans=[];
  let x = S.margin + S.labelW + 4;
  MODEL.phases.forEach((ph,pi)=>{
    const start = x; const first = cols.length;
    ph.ops.forEach((op,oi)=>{
      const w = op.width>0 ? op.width : S.colW;
      const gapAfter = op.decision ? Math.max(S.gap, 86) : S.gap;
      cols.push({x, w, op, ph, gapAfter, idx:cols.length});
      x += w + gapAfter;
    });
    if(ph.ops.length){ x -= cols[cols.length-1].gapAfter; }
    phaseSpans.push({ph, x0:start-8, x1:x+8, first, last:cols.length-1});
    x += S.phaseGap;
  });
  if(MODEL.phases.length) x -= S.phaseGap;
  const totalW = Math.max(x + S.margin + 8, 420);
  const contentX0 = S.margin, contentX1 = totalW - S.margin;

  /* ---- rows ---- */
  const contentW=contentX1-contentX0;
  const titleText=MODEL.meta.title||T("untitled"), subtitleText=MODEL.meta.subtitle||"";
  const hasSubtitle=!!subtitleText.trim();
  const titleRegionW=hasSubtitle?contentW*.6:contentW;
  const subtitleRegionW=contentW-titleRegionW;
  const titleLines=wrapTextBlock(titleText,Math.max(20,titleRegionW-28),S.fontTitle,true);
  const subtitleSize=S.fontTitle*.62;
  const subtitleLines=hasSubtitle?wrapTextBlock(subtitleText,Math.max(20,subtitleRegionW-28),subtitleSize,false):[];
  const titleLineH=S.fontTitle*1.18, subtitleLineH=subtitleSize*1.25;
  const titleH=Math.max(S.fontTitle*1.9,titleLines.length*titleLineH+12,subtitleLines.length*subtitleLineH+12);
  const phaseH = S.fontPhase*1.9;
  let y = S.margin;
  const yTitle = y; y += titleH;
  const yPhase = y; y += phaseH;

  const rows=[];
  for(const L of layers){
    let h;
    if(L.flow){ h = flowLaneHeight(cols,S,size,lh); }
    else{
      h = S.rowMin;
      for(const c of cols){
        const items = parseCell(c.op.cells[L.id], layerCode(L), c.op.num);
        if(!items.length) continue;
        const m = measureCellItems(items, c.w-2*PAD-2, size, lh);
        h = Math.max(h, m.h + 2*PAD + 6);
      }
    }
    rows.push({L,y,h}); y += h;
  }
  const totalH = y + S.margin;

  /* ---- title band ---- */
  if(V.titleMode==="minimal"){
    dl.rect(contentX0, yTitle, contentX1-contentX0, titleH, {fill:th.title,stroke:th.cellStroke||th.grid,sw:.5,rx:V.titleRadius});
    dl.rect(contentX0, yTitle, 5, titleH, {fill:th.accent||th.connector,rx:V.titleRadius});
  }else if(V.titleMode==="outline"){
    dl.rect(contentX0, yTitle, contentX1-contentX0, titleH, {fill:th.title,stroke:th.accent||th.connector,sw:1.2});
    dl.line(contentX0,yTitle+titleH-3,contentX1,yTitle+titleH-3,{stroke:th.accent||th.connector,sw:1});
  }else if(V.titleMode==="accent"){
    dl.rect(contentX0, yTitle, contentX1-contentX0, titleH, {fill:th.title,stroke:null});
    dl.rect(contentX0, yTitle+titleH-5, contentX1-contentX0, 5, {fill:th.accent||th.connector});
  }else{
    dl.rect(contentX0, yTitle, contentX1-contentX0, titleH, {fill:th.title, stroke:th.title,rx:V.titleRadius});
  }
  let titleY=yTitle+(titleH-titleLines.length*titleLineH)/2+S.fontTitle*.86;
  titleLines.forEach(line=>{
    dl.text(contentX0+14,titleY,line,{size:S.fontTitle,bold:true,fill:th.titleTxt});
    titleY+=titleLineH;
  });
  let subtitleY=yTitle+(titleH-subtitleLines.length*subtitleLineH)/2+subtitleSize*.86;
  subtitleLines.forEach(line=>{
    dl.text(contentX1-14,subtitleY,line,{size:subtitleSize,bold:false,fill:th.titleTxt,anchor:"end"});
    subtitleY+=subtitleLineH;
  });

  /* ---- phase band ---- */
  for(const sp of phaseSpans){
    if(sp.first>sp.last) continue;
    const w = sp.x1-sp.x0;
    const phaseInset=V.family==="cards"?3:0;
    dl.rect(sp.x0+phaseInset, yPhase+phaseInset, w-2*phaseInset, phaseH-2*phaseInset,
      {fill:th.phase,stroke:V.family==="blueprint"?th.accent:th.phase,sw:V.family==="blueprint"?.8:.6,rx:V.phaseRadius});
    dl.text(sp.x0+w/2, yPhase+phaseH*0.7, (sp.ph.code?sp.ph.code+". ":"") + (sp.ph.name||"").toUpperCase(),
            {size:S.fontPhase, bold:true, fill:th.phaseTxt, anchor:"middle"});
  }

  /* ---- rows: strips, separators, cells ---- */
  const gridColor = th.grid;
  rows.forEach((r,ri)=>{
    const cl = layerColors(r.L);
    if(th.rowFill&&ri%2===0)
      dl.rect(S.margin+S.labelW,r.y,contentX1-(S.margin+S.labelW),r.h,{fill:th.rowFill,stroke:null});
    // label strip
    dl.rect(S.margin+1,r.y+2,S.labelW-2,r.h-4,
      {fill:r.L.flow?th.flowLane:cl.strip,stroke:gridColor,sw:.7,
        rx:V.labelMode==="code"&&V.family!=="blueprint"?Math.min(6,S.labelW/4):0});
    if(V.labelMode==="code"){
      dl.text(S.margin+S.labelW/2,r.y+r.h/2+S.fontBase*.42,layerCode(r.L),
        {size:S.fontBase*(r.L.flow?1.3:1.05),bold:true,fill:r.L.flow?th.flowLaneTxt:(th.text||"#1a1a1a"),anchor:"middle"});
    }else{
      drawRotLabel(dl,S.margin+S.labelW/2,r.y+r.h/2,r.h-8,S.labelW-3,
        r.L.name[LANG]||r.L.name.en,r.L.flow?S.fontBase*1.35:S.fontBase*1.05,!!r.L.flow,
        r.L.flow?th.flowLaneTxt:(th.text||"#1a1a1a"));
    }
    // outer border of the row
    if(V.rowBorders) dl.rect(S.margin+S.labelW,r.y,contentX1-(S.margin+S.labelW),r.h,
      {fill:null,stroke:gridColor,sw:.7,dash:V.gridDash});
    if(r.L.flow) return;
    // cells
    for(const c of cols){
      const items = parseCell(c.op.cells[r.L.id], layerCode(r.L), c.op.num);
      if(!items.length) continue;
      const bx=c.x, by=r.y+PAD, bw=c.w, bh=r.h-2*PAD;
      if(V.cellShadow) dl.rect(bx+2,by+2,bw,bh,{fill:th.shadow||"#00000018",stroke:null,rx:V.cellRadius});
      dl.rect(bx,by,bw,bh,{fill:cl.box,stroke:th.cellStroke||"#5b6470",sw:V.family==="blueprint"?.8:.5,rx:V.cellRadius});
      const m = measureCellItems(items, bw-2*PAD-2, size, lh);
      let ty = by+PAD+size*0.92;
      m.laid.forEach(it=>{
        it.lines.forEach(line=>{
          line.forEach(sg=>dl.text(bx+PAD+sg.x,ty,sg.s,{size,bold:sg.bold,fill:th.text||"#111"}));
          ty += lh;
        });
        it.ex.forEach(line=>{
          line.forEach(sg=>dl.text(bx+PAD+5+sg.x,ty,sg.s,{size,bold:sg.bold,fill:th.subText||"#333"}));
          ty += lh;
        });
        ty += 1.5;
      });
    }
  });
  /* phase separators (vertical) */
  const yTop = rows.length?rows[0].y:yPhase+phaseH;
  const yBot = rows.length?rows[rows.length-1].y+rows[rows.length-1].h:yTop;
  for(let i=1;i<phaseSpans.length;i++){
    const xs = phaseSpans[i].x0 - S.phaseGap/2 + 4;
    dl.line(xs,yTop,xs,yBot,{stroke:gridColor,sw:1.1,dash:V.gridDash});
  }

  /* ---- process flow lane ---- */
  const flowRow = rows.find(r=>r.L.flow);
  if(flowRow) drawFlow(dl, cols, flowRow, S, th, size, lh);

  return {dl,w:totalW,h:totalH,cols,rows,phaseSpans,background:V.canvas,
    titleLayout:{y:yTitle,h:titleH,subtitleX:hasSubtitle?contentX0+titleRegionW:Infinity}};
}

/* --- flow lane metrics --- */
function groupSpans(cols,level){
  const key=level===1?"group1Id":"group2Id",spans=[];
  let i=0;
  while(i<cols.length){
    const id=cols[i].op[key],group=phaseGroup(cols[i].ph,id);
    if(!group){i++;continue;}
    let j=i;
    while(j+1<cols.length&&cols[j+1].ph===cols[i].ph&&cols[j+1].op[key]===id) j++;
    spans.push({group,first:i,last:j,x0:cols[i].x-6,x1:cols[j].x+cols[j].w+6});
    i=j+1;
  }
  return spans;
}
function nodeStackHeight(nodes,gap){
  return nodes.length?nodes.reduce((sum,node)=>sum+node.h,0)+(nodes.length-1)*gap:0;
}
function groupSpanLayouts(cols,level,size,nodeGap){
  return groupSpans(cols,level).map(span=>{
    const width=span.x1-span.x0,inputs=span.group.inputs||[],outputs=span.group.outputs||[];
    const split=inputs.length&&outputs.length;
    const nodeW=Math.max(30,Math.min(180,split?(width-18)/2:width*.58));
    const inputLayouts=inputs.map(text=>nodeLayout(text,nodeW,size));
    const outputLayouts=outputs.map(text=>nodeLayout(text,nodeW,size));
    return {...span,inputs:inputLayouts,outputs:outputLayouts,
      ioH:Math.max(nodeStackHeight(inputLayouts,nodeGap),nodeStackHeight(outputLayouts,nodeGap))};
  });
}
function flowMetrics(cols,S,size,lh){
  const hasTop = cols.some(c=>(c.op.inputs&&c.op.inputs.length)||(c.op.outputs&&c.op.outputs.length));
  const hasBot = cols.some(c=>c.op.scrap&&c.op.scrap.length);
  const nodeGap = 3;
  const nodes = cols.map(c=>{
    const inputs=c.op.inputs||[], outputs=c.op.outputs||[], scrap=c.op.scrap||[];
    const splitTop=inputs.length&&outputs.length;
    const topW=Math.max(30,splitTop?(c.w-18)/2:Math.min(c.w-12,c.w*.72));
    const scrapW=Math.max(30,Math.min(c.w-12,c.w*.72));
    const inputLayouts=inputs.map(text=>nodeLayout(text,topW,size));
    const outputLayouts=outputs.map(text=>nodeLayout(text,topW,size));
    const scrapLayouts=scrap.map(text=>nodeLayout(text,scrapW,size));
    return {inputs:inputLayouts,outputs:outputLayouts,scrap:scrapLayouts,
      topH:Math.max(nodeStackHeight(inputLayouts,nodeGap),nodeStackHeight(outputLayouts,nodeGap)),
      botH:nodeStackHeight(scrapLayouts,nodeGap)};
  });
  const topNodes = hasTop ? Math.max(0,...nodes.map(n=>n.topH)) + 14 : 0;
  const botNodes = hasBot ? Math.max(0,...nodes.map(n=>n.botH)) + 14 : 0;
  const groups=[groupSpanLayouts(cols,1,size,nodeGap),groupSpanLayouts(cols,2,size,nodeGap)];
  const groupIoHeights=groups.map(layouts=>Math.max(0,...layouts.map(group=>group.ioH)));
  const groupOffsets=groupIoHeights.map(height=>height?height+6:0);
  const groupHeight=(layouts,bandH,index)=>layouts.length?groupOffsets[index]+bandH+4:0;
  const g1H=groupHeight(groups[0],15,0),g2H=groupHeight(groups[1],14,1);
  return {nodeGap,nodes,groups,groupOffsets,topNodes,botNodes,g1H,g2H};
}
function opBoxHeight(op,S,size,lh,w){
  const head = wrapPlain(`OP ${op.__phcode}_${op.num} ${op.title||""}`.trim(), w-8, size*1.05, true);
  const hh = head.length*(size*1.05*1.28) + 6;
  const steps = (op.steps||[]).length;
  return {headH:hh, h: hh + steps*(S.stepH+3) + 6, headLines:head};
}
function flowLaneHeight(cols,S,size,lh){
  const m = flowMetrics(cols,S,size,lh);
  let maxBox = 40;
  cols.forEach(c=>{ c.op.__phcode = c.ph.code; maxBox = Math.max(maxBox, opBoxHeight(c.op,S,size,lh,c.w).h); });
  return m.g1H + m.g2H + m.topNodes + maxBox + m.botNodes + 18;
}
function decisionTargetIndex(currentIndex,back){
  return Math.max(0,currentIndex-Math.max(1,back||1));
}
function mapContextAt(x,y,res){
  if(!res||!res.cols?.length) return {phase:null,col:null,row:null};
  const col=res.cols.reduce((best,candidate)=>{
    const distance=Math.abs(x-(candidate.x+candidate.w/2));
    return !best||distance<best.distance?{candidate,distance}:best;
  },null)?.candidate||null;
  const row=res.rows.find(candidate=>y>=candidate.y&&y<=candidate.y+candidate.h)||null;
  return {phase:col?.ph||null,col,row};
}
function mapEditTarget(x,y,res){
  if(!res) return null;
  const S=MODEL.settings;
  const firstRowY=res.rows.length?res.rows[0].y:Infinity;
  if(res.titleLayout&&y>=res.titleLayout.y&&y<res.titleLayout.y+res.titleLayout.h){
    if(x>=res.titleLayout.subtitleX) return {type:"subtitle",label:T("subt")};
    return {type:"title",label:T("title")};
  }
  const col=res.cols.find(c=>x>=c.x&&x<=c.x+c.w);
  if(!col) return null;
  if(y<firstRowY)
    return {type:"phase",phase:col.ph,label:T("phaseName")};
  const row=res.rows.find(r=>y>=r.y&&y<=r.y+r.h);
  if(!row) return null;
  if(row.L.flow){
    const m=flowMetrics(res.cols,S,S.fontBase,S.fontBase*S.lineH);
    const boxTop=row.y+8+m.g1H+m.g2H+m.topNodes;
    const met=opBoxHeight(col.op,S,S.fontBase,S.fontBase*S.lineH,col.w);
    if(y<boxTop||y>boxTop+met.h) return null;
    return {type:"operation",phase:col.ph,op:col.op,label:T("opTitle")+" + "+T("steps")};
  }
  return {type:"cell",phase:col.ph,op:col.op,layer:row.L,label:`${layerCode(row.L)} · ${row.L.name[LANG]||row.L.name.en}`};
}

/* --- draw flow lane --- */
function drawFlow(dl, cols, row, S, th, size, lh){
  const V=visualTheme(th);
  const flowArrow=(pts,color=th.connector)=>arrow(dl,pts,color,V.connectorWidth);
  const operationArrow=pts=>arrow(dl,pts,th.connector,Math.max(1.15,V.connectorWidth),
    {headSize:4,halo:th.opBody,haloWidth:2});
  const m = flowMetrics(cols,S,size,lh);
  const laneTop = row.y, laneBot = row.y + row.h;
  const boxTop = laneTop + 8 + m.g1H + m.g2H + m.topNodes;
  const conn = th.connector;
  const boxes = [];

  cols.forEach(c=>{ c.op.__phcode = c.ph.code; });

  /* group containers (drawn first, behind) */
  const group1Top=laneTop+5+m.groupOffsets[0];
  const group2Top=laneTop+5+m.g1H+m.groupOffsets[1];
  drawGroups(dl,m.groups[0],group1Top,boxTop,laneBot-6-m.botNodes+4,th,size,0);
  drawGroups(dl,m.groups[1],group2Top,boxTop,laneBot-11-m.botNodes+4,th,size,1);

  /* boxes */
  cols.forEach(c=>{
    const op=c.op, w=c.w, bx=c.x, met=opBoxHeight(op,S,size,lh,w);
    if(V.cellShadow) dl.rect(bx+2,boxTop+2,w,met.h,{fill:th.shadow||"#00000018",stroke:null,rx:V.opRadius});
    dl.rect(bx,boxTop,w,met.h,{fill:th.opBody,stroke:th.cellStroke||"#3b4a5c",sw:.7,rx:V.opRadius});
    dl.rect(bx,boxTop,w,met.headH,{fill:th.opHead,stroke:th.cellStroke||"#3b4a5c",sw:.7,rx:V.opRadius});
    let ty = boxTop + size*1.05*1.15 + 1;
    met.headLines.forEach(line=>{
      const tw = line.reduce((a,s)=>a+s.w,0);
      let cx0 = bx + w/2 - tw/2;
      line.forEach(sg=>{ dl.text(cx0+sg.x - line[0].x, ty, sg.s, {size:size*1.05,bold:true,fill:th.opHeadTxt}); });
      ty += size*1.05*1.28;
    });
    let sy = boxTop + met.headH + 3;
    (op.steps||[]).forEach(st=>{
      dl.rect(bx+5,sy,w-10,S.stepH,{fill:th.opBody,stroke:th.cellStroke||"#2b3745",sw:.6,rx:V.stepRadius});
      dl.text(bx+w/2,sy+S.stepH/2+size*.36,st,{size,fill:th.text||"#111",anchor:"middle"});
      sy += S.stepH+3;
    });
    boxes.push({c, top:boxTop, h:met.h, mid:boxTop+met.headH/2, bot:boxTop+met.h});
  });

  drawGroupIO(dl,m.groups[0],group1Top,th,m.nodeGap,flowArrow);
  drawGroupIO(dl,m.groups[1],group2Top,th,m.nodeGap,flowArrow);

  /* connectors between consecutive operations */
  for(let i=0;i<boxes.length-1;i++){
    const a=boxes[i], b=boxes[i+1];
    const ya = a.top + a.h/2, yb = b.top + b.h/2;
    const x0 = a.c.x + a.c.w, x1 = b.c.x;
    const dec = a.c.op.decision;
    if(dec){
      const cxm = (x0+x1)/2, dw = Math.min(64, (x1-x0)-16), dh = 30;
      operationArrow([[x0,ya],[cxm-dw/2-1.5,ya]]);
      dl.poly([[cxm,ya-dh/2],[cxm+dw/2,ya],[cxm,ya+dh/2],[cxm-dw/2,ya]],
              {fill:th.decision, stroke:th.decisionStroke, sw:0.7});
      wrapPlain(dec.text||"?", dw-8, size*0.9).slice(0,3).forEach((line,k,arr)=>{
        const tw=line.reduce((s,g)=>s+g.w,0);
        dl.text(cxm-tw/2, ya - (arr.length-1)*size*0.55 + k*size*1.15 + size*0.32,
                line.map(g=>g.s).join(" "), {size:size*0.9, fill:"#123"});
      });
      operationArrow([[cxm+dw/2,ya],[x1-1.5,ya]]);
      if(dec.yes) dl.text((cxm+dw/2+x1)/2, ya-3.5, dec.yes, {size:size*0.85, fill:"#123", anchor:"middle"});
      // no-branch: down and back
      const back = Math.max(1, dec.back||1);
      const tgt = boxes[decisionTargetIndex(i,back)];
      const yLoop = laneBot - 6 - m.botNodes - 2;
      flowArrow([[cxm,ya+dh/2],[cxm,yLoop],[tgt.c.x+10,yLoop],[tgt.c.x+10,tgt.bot]],conn);
      if(dec.no) dl.text(cxm+3, ya+dh/2+size*1.3, dec.no, {size:size*0.85, fill:"#123"});
    } else if(Math.abs(ya-yb)<0.5){
      operationArrow([[x0,ya],[x1-1.5,yb]]);
    } else {
      const xm=(x0+x1)/2;
      operationArrow([[x0,ya],[xm,ya],[xm,yb],[x1-1.5,yb]]);
    }
  }

  /* input / output / scrap nodes */
  boxes.forEach(b=>{
    const op=b.c.op, w=b.c.w, bx=b.c.x;
    const layouts=m.nodes[b.c.idx];
    let iy=laneTop+8+m.g1H+m.g2H;
    layouts.inputs.forEach(node=>{
      const nx=bx+6;
      drawNode(dl,nx,iy,node,th.node,th.nodeTxt);
      flowArrow([[nx+node.w/2,iy+node.h],[nx+node.w/2,b.top]]);
      iy+=node.h+m.nodeGap;
    });
    let oy=laneTop+8+m.g1H+m.g2H;
    layouts.outputs.forEach(node=>{
      const nx=bx+w-6-node.w;
      drawNode(dl,nx,oy,node,th.node,th.nodeTxt);
      flowArrow([[nx+node.w/2,b.top],[nx+node.w/2,oy+node.h]]);
      oy+=node.h+m.nodeGap;
    });
    let sy=laneBot-m.botNodes+6;
    layouts.scrap.forEach(node=>{
      const nx=bx+w-6-node.w;
      drawNode(dl,nx,sy,node,th.scrap,th.scrapTxt);
      flowArrow([[nx+node.w/2,b.bot],[nx+node.w/2,sy]]);
      sy+=node.h+m.nodeGap;
    });
  });
}
/* rotated (-90) label that shrinks / wraps to fit the strip */
function drawRotLabel(dl, cx, cy, avail, thick, text, fs, bold, color){
  let size = fs, lines = [String(text)];
  const fits = (ls,s) => ls.every(l=>measure(l,s,bold) <= avail) && ls.length*(s*1.18) <= thick;
  while(size > 3.6 && !fits(lines,size)){
    if(lines.length===1 && measure(lines[0],size,bold) > avail && (2*(size*1.18) <= thick)){
      const w = lines[0].split(/\s+/);
      if(w.length>1){
        let best=null, bd=1e9;
        for(let i=1;i<w.length;i++){
          const a=w.slice(0,i).join(" "), b=w.slice(i).join(" ");
          const d=Math.abs(measure(a,size,bold)-measure(b,size,bold));
          if(d<bd){bd=d;best=[a,b];}
        }
        lines=best; continue;
      }
    }
    size -= 0.3;
  }
  if(!fits(lines,size)){ // hard truncate
    lines = lines.map(l=>{ let s=l; while(s.length>3 && measure(s+"…",size,bold)>avail) s=s.slice(0,-1); return s.length<l.length? s+"…" : s; });
  }
  const lh = size*1.18;
  const x0 = cx - (lines.length-1)*lh/2;
  lines.forEach((l,i)=>{
    dl.text(x0 + i*lh + size*0.35, cy, l, {size, bold, fill:color, anchor:"middle", rot:-90});
  });
}
function nodeTextLines(txt,maxW,size){
  const words=String(txt).toUpperCase().trim().split(/\s+/).filter(Boolean);
  const chunks=[];
  words.forEach(word=>{
    if(measure(word,size,true)<=maxW){chunks.push(word);return;}
    let part="";
    for(const ch of word){
      if(part&&measure(part+ch,size,true)>maxW){chunks.push(part);part=ch;}
      else part+=ch;
    }
    if(part) chunks.push(part);
  });
  const lines=[];let line="";
  chunks.forEach(chunk=>{
    const candidate=line?line+" "+chunk:chunk;
    if(line&&measure(candidate,size,true)>maxW){lines.push(line);line=chunk;}
    else line=candidate;
  });
  if(line) lines.push(line);
  return lines.length?lines:[""];
}
function nodeLayout(txt,w,size){
  const fs=Math.min(size,size*1.0),lines=nodeTextLines(txt,Math.max(1,w-10),fs),lineH=fs*1.15;
  return {text:String(txt),w,h:Math.max(15,lines.length*lineH+6),fs,lineH,lines};
}
function drawNode(dl,x,y,node,fill,txtc){
  const V=visualTheme();
  dl.rect(x,y,node.w,node.h,{fill,stroke:"#00000033",sw:.5,rx:V.family==="blueprint"?0:(V.family==="lean"?3:Math.min(node.h/2,8))});
  const textH=node.lines.length*node.lineH;
  let ty=y+(node.h-textH)/2+node.fs*.88;
  node.lines.forEach(line=>{
    dl.text(x+node.w/2,ty,line,{size:node.fs,bold:true,fill:txtc,anchor:"middle"});
    ty+=node.lineH;
  });
}
function drawGroups(dl,groups,top,boxTop,bottom,th,size,level){
  const V=visualTheme(th);
  groups.forEach(group=>{
    const x0=group.x0,x1=group.x1;
    const bandH = level===0?15:14;
    dl.rect(x0,top,x1-x0,bottom-top,{fill:null,stroke:th.groupBand[level],sw:.8,rx:V.groupRadius});
    dl.rect(x0,top,x1-x0,bandH,{fill:th.groupBand[level],stroke:th.groupBand[level],rx:V.groupRadius});
    dl.text((x0+x1)/2,top+bandH*.7,group.group.name,{size:size*1.0,bold:true,fill:th.groupBandTxt[level],anchor:"middle"});
  });
}
function drawGroupIO(dl,groups,groupTop,th,nodeGap,flowArrow){
  groups.forEach(group=>{
    let iy=groupTop-6-nodeStackHeight(group.inputs,nodeGap);
    group.inputs.forEach(node=>{
      const x=group.x0+6,cx=x+node.w/2;
      flowArrow([[cx,iy+node.h],[cx,groupTop]]);
      drawNode(dl,x,iy,node,th.node,th.nodeTxt);
      iy+=node.h+nodeGap;
    });
    let oy=groupTop-6-nodeStackHeight(group.outputs,nodeGap);
    group.outputs.forEach(node=>{
      const x=group.x1-6-node.w,cx=x+node.w/2;
      flowArrow([[cx,groupTop],[cx,oy+node.h]]);
      drawNode(dl,x,oy,node,th.node,th.nodeTxt);
      oy+=node.h+nodeGap;
    });
  });
}

function migrateLegacyGroups(phase){
  for(const level of [1,2]){
    const idKey=level===1?"group1Id":"group2Id",legacyKey=level===1?"__group1":"__group2";
    let i=0;
    while(i<phase.ops.length){
      const op=phase.ops[i],name=op[legacyKey];
      if(op[idKey]||!name){i++;continue;}
      const parentId=level===2?(op.group1Id||null):null;
      let j=i;
      while(j+1<phase.ops.length&&!phase.ops[j+1][idKey]&&phase.ops[j+1][legacyKey]===name&&
            (level===1||(phase.ops[j+1].group1Id||null)===parentId)) j++;
      const group={id:nid(),level,name,parentId,inputs:[],outputs:[]};
      phase.groups.push(group);
      for(let k=i;k<=j;k++) phase.ops[k][idKey]=group.id;
      i=j+1;
    }
  }
  phase.ops.forEach(op=>{delete op.__group1;delete op.__group2;});
}

/* Project schema validation and migration */
function normalizeProject(raw){
  if(!raw||typeof raw!=="object"||Array.isArray(raw)) throw new Error(T("invalidProject")+": raiz JSON inválida");
  if(!Array.isArray(raw.phases)||!Array.isArray(raw.layers)) throw new Error(T("invalidProject")+": faltam phases/layers");
  if(raw.phases.length>200||raw.layers.length>50) throw new Error(T("invalidProject")+": demasiadas fases/camadas");
  const sourceSchema=raw.schemaVersion===undefined?1:raw.schemaVersion;
  if(!Number.isInteger(sourceSchema)||sourceSchema<1||sourceSchema>PROJECT_SCHEMA_VERSION)
    throw new Error(T("invalidProject")+": versão de formato não suportada");
  const str=(v,path,max=10000)=>{
    if(v===undefined||v===null) return "";
    if(typeof v!=="string") throw new Error(`${T("invalidProject")}: ${path} deve ser texto`);
    if(v.length>max) throw new Error(`${T("invalidProject")}: ${path} excede ${max} caracteres`);
    return v;
  };
  const arr=(v,path,max=500)=>{
    if(v===undefined) return [];
    if(!Array.isArray(v)||v.length>max) throw new Error(`${T("invalidProject")}: ${path} deve ser uma lista válida`);
    return v.map((x,i)=>str(x,`${path}[${i}]`,2000));
  };
  const finite=(v,fallback,min,max,path)=>{
    if(v===undefined) return fallback;
    if(typeof v!=="number"||!Number.isFinite(v)||v<min||v>max) throw new Error(`${T("invalidProject")}: ${path} fora dos limites`);
    return v;
  };
  const base=newModel(), meta=raw.meta||{}, settings=raw.settings||{};
  if(typeof meta!=="object"||Array.isArray(meta)||typeof settings!=="object"||Array.isArray(settings))
    throw new Error(T("invalidProject")+": meta/settings inválidos");
  base.meta={
    title:str(meta.title,"meta.title",500)||base.meta.title,
    subtitle:str(meta.subtitle,"meta.subtitle",500),
    theme:THEMES[meta.theme]?meta.theme:"plum"
  };
  const ranges={colW:[60,900],gap:[0,300],phaseGap:[0,400],labelW:[16,120],margin:[0,120],
    fontBase:[4,24],fontTitle:[8,60],fontPhase:[4,30],rowMin:[20,400],stepH:[8,80],lineH:[0.8,3]};
  Object.keys(ranges).forEach(k=>base.settings[k]=finite(settings[k],base.settings[k],ranges[k][0],ranges[k][1],"settings."+k));
  base.settings.pdfMode=["single","a4","a3"].includes(settings.pdfMode)?settings.pdfMode:"single";
  base.settings.pdfOrientation=["portrait","landscape"].includes(settings.pdfOrientation)?settings.pdfOrientation:"landscape";
  base.settings.pdfTextMode=["vector","unicode"].includes(settings.pdfTextMode)?settings.pdfTextMode:"vector";
  const layerIds=new Set(),layerCodes=new Set();
  base.layers=raw.layers.map((l,i)=>{
    if(!l||typeof l!=="object"||Array.isArray(l)) throw new Error(`${T("invalidProject")}: layers[${i}] inválida`);
    const id=str(l.id,`layers[${i}].id`,100);
    if(!id||layerIds.has(id)) throw new Error(`${T("invalidProject")}: ID de camada vazio ou duplicado`);
    layerIds.add(id);
    const fallback=DEFAULT_LAYERS.find(x=>x.id===id);
    const code=(str(l.code,`layers[${i}].code`,16)||(fallback?.id||id)).toUpperCase();
    if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,15}$/.test(code))
      throw new Error(`${T("invalidProject")}: ${T("invalidLayerCode")}`);
    const codeKey=code.toUpperCase();
    if(layerCodes.has(codeKey)) throw new Error(`${T("invalidProject")}: ${T("duplicateLayerCode")}`);
    layerCodes.add(codeKey);
    const name=l.name&&typeof l.name==="object"?l.name:{};
    const color=(v,path)=>{
      if(v===undefined||v===null||v==="") return null;
      if(typeof v!=="string"||!/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`${T("invalidProject")}: ${path} inválida`);
      return v;
    };
    return {id,code,name:{pt:str(name.pt,`layers[${i}].name.pt`,200)||(fallback?.pt||code),
      en:str(name.en,`layers[${i}].name.en`,200)||(fallback?.en||code)},on:l.on!==false,flow:!!l.flow,
      box:color(l.box,`layers[${i}].box`),strip:color(l.strip,`layers[${i}].strip`)};
  });
  if(base.layers.filter(l=>l.flow).length!==1) throw new Error(T("invalidProject")+": deve existir uma camada de fluxo");
  if(sourceSchema<2&&!layerIds.has("SPC")){
    const spc=newModel().layers.find(l=>l.id==="SPC");
    const monitoringIndex=base.layers.findIndex(l=>l.id==="CMS");
    base.layers.splice(monitoringIndex<0?base.layers.length:monitoringIndex+1,0,spc);
    layerIds.add("SPC");
  }
  base.schemaVersion=PROJECT_SCHEMA_VERSION;
  let opCount=0;
  base.phases=raw.phases.map((p,pi)=>{
    if(!p||typeof p!=="object"||Array.isArray(p)||!Array.isArray(p.ops))
      throw new Error(`${T("invalidProject")}: phases[${pi}] inválida`);
    opCount+=p.ops.length; if(opCount>2000) throw new Error(T("invalidProject")+": demasiadas operações");
    const rawGroups=p.groups===undefined?[]:p.groups;
    if(!Array.isArray(rawGroups)||rawGroups.length>500)
      throw new Error(`${T("invalidProject")}: phases[${pi}].groups deve ser uma lista válida`);
    const groupIds=new Set();
    const groups=rawGroups.map((group,gi)=>{
      if(!group||typeof group!=="object"||Array.isArray(group))
        throw new Error(`${T("invalidProject")}: groups[${gi}] inválido`);
      const id=str(group.id,`groups[${gi}].id`,100)||nid();
      if(groupIds.has(id)) throw new Error(`${T("invalidProject")}: ID de grupo duplicado`);
      groupIds.add(id);
      const level=group.level===2?2:1;
      return {id,level,name:str(group.name,`groups[${gi}].name`,300),
        parentId:level===2?(str(group.parentId,`groups[${gi}].parentId`,100)||null):null,
        inputs:arr(group.inputs,`groups[${gi}].inputs`),outputs:arr(group.outputs,`groups[${gi}].outputs`)};
    });
    const phase={id:str(p.id,`phases[${pi}].id`,100)||nid(),code:str(p.code,`phases[${pi}].code`,30),
      name:str(p.name,`phases[${pi}].name`,300),groups,ops:p.ops.map((o,oi)=>{
        if(!o||typeof o!=="object"||Array.isArray(o)) throw new Error(`${T("invalidProject")}: operação ${pi}.${oi} inválida`);
        const cells={};
        if(o.cells!==undefined&&(!o.cells||typeof o.cells!=="object"||Array.isArray(o.cells)))
          throw new Error(`${T("invalidProject")}: cells ${pi}.${oi} inválido`);
        for(const [k,v] of Object.entries(o.cells||{})){
          if(layerIds.has(k)) cells[k]=str(v,`cells.${k}`,50000);
        }
        let decision=null;
        if(o.decision){
          if(typeof o.decision!=="object"||Array.isArray(o.decision)) throw new Error(`${T("invalidProject")}: decisão inválida`);
          decision={text:str(o.decision.text,"decision.text",500),yes:str(o.decision.yes,"decision.yes",100),
            no:str(o.decision.no,"decision.no",100),back:finite(o.decision.back,1,1,200,"decision.back")};
        }
        return {id:str(o.id,`ops[${oi}].id`,100)||nid(),num:str(o.num,`ops[${oi}].num`,50),
          title:str(o.title,`ops[${oi}].title`,500),steps:arr(o.steps,`ops[${oi}].steps`),
          group1Id:str(o.group1Id,`ops[${oi}].group1Id`,100),group2Id:str(o.group2Id,`ops[${oi}].group2Id`,100),
          __group1:str(o.group1,`ops[${oi}].group1`,300),__group2:str(o.group2,`ops[${oi}].group2`,300),
          inputs:arr(o.inputs,`ops[${oi}].inputs`),outputs:arr(o.outputs,`ops[${oi}].outputs`),
          scrap:arr(o.scrap,`ops[${oi}].scrap`),width:finite(o.width,0,0,900,`ops[${oi}].width`),
          decision,cells};
      })};
    const byId=new Map(phase.groups.map(group=>[group.id,group]));
    phase.groups.forEach(group=>{
      if(group.level===2&&(!group.parentId||byId.get(group.parentId)?.level!==1)) group.parentId=null;
    });
    phase.ops.forEach(op=>{
      if(byId.get(op.group1Id)?.level!==1) op.group1Id="";
      const subgroup=byId.get(op.group2Id);
      if(!subgroup||subgroup.level!==2||(subgroup.parentId&&subgroup.parentId!==op.group1Id)) op.group2Id="";
    });
    migrateLegacyGroups(phase);
    cleanupPhaseGroups(phase);
    return phase;
  });
  return base;
}
const migrate=normalizeProject;

/* Phase and operation numbering */
function nextPhaseCode(){
  const used = new Set(MODEL.phases.map(p=>p.code));
  for(let n=1;n<1000;n++){
    let x=n,c="";
    while(x){x--;c=String.fromCharCode(65+x%26)+c;x=Math.floor(x/26);}
    if(!used.has(c)) return c;
  }
  return String(MODEL.phases.length+1);
}
function autoNum(phase){
  let maxMajor = 0;
  MODEL.phases.forEach(p=>p.ops.forEach(o=>{ const m=parseInt(String(o.num).split(".")[0],10); if(!isNaN(m)) maxMajor=Math.max(maxMajor,m); }));
  if(!phase.ops.length) return (maxMajor+1)+".1";
  const last = phase.ops[phase.ops.length-1].num.split(".");
  return last[0] + "." + ((parseInt(last[1],10)||0)+1);
}
