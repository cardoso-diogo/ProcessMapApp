/* ============================================================
   BACKEND 1 — SVG
   ============================================================ */
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function download(name,data,mime){
  const blob=new Blob([data],{type:mime});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},600);
}
async function saveProjectDocument(filename,contents){
  const invoke=window.__TAURI__?.core?.invoke;
  if(invoke){
    const path=await invoke("save_project",{defaultName:filename,contents});
    return {saved:!!path,path:path||null,method:"native"};
  }
  if(window.showSaveFilePicker){
    try{
      const handle=await window.showSaveFilePicker({
        suggestedName:filename,
        types:[{description:"Process Map Builder project",accept:{"application/json":[".json"]}}]
      });
      const writable=await handle.createWritable();
      await writable.write(contents);
      await writable.close();
      return {saved:true,path:handle.name||filename,method:"picker"};
    }catch(error){
      if(error?.name==="AbortError") return {saved:false,path:null,method:"picker"};
      throw error;
    }
  }
  download(filename,contents,"application/json");
  return {saved:true,path:filename,method:"download"};
}
function toSVG(res){
  const {dl,w,h} = res; const p=[];
  p.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}" font-family="${FONT_FAMILY}">`);
  p.push(`<rect width="100%" height="100%" fill="${res.background||"#ffffff"}"/>`);
  for(const o of dl.o){
    if(o.t==="r"){
      p.push(`<rect x="${f(o.x)}" y="${f(o.y)}" width="${f(o.w)}" height="${f(o.h)}"${o.rx?` rx="${f(o.rx)}"`:""} fill="${o.f||"none"}"${o.s?` stroke="${o.s}" stroke-width="${o.sw}"`:` stroke="none"`}${o.dash?` stroke-dasharray="${o.dash}"`:""}/>`);
    } else if(o.t==="l"){
      p.push(`<line x1="${f(o.x1)}" y1="${f(o.y1)}" x2="${f(o.x2)}" y2="${f(o.y2)}" stroke="${o.s}" stroke-width="${o.sw}"${o.dash?` stroke-dasharray="${o.dash}"`:""}/>`);
    } else if(o.t==="p"){
      p.push(`<polygon points="${o.pts.map(q=>f(q[0])+","+f(q[1])).join(" ")}" fill="${o.f||"none"}"${o.s?` stroke="${o.s}" stroke-width="${o.sw}"`:""}/>`);
    } else if(o.t==="t"){
      const tr = o.rot ? ` transform="rotate(${o.rot} ${f(o.x)} ${f(o.y)})"` : "";
      const an = o.anchor!=="start" ? ` text-anchor="${o.anchor}"` : "";
      p.push(`<text x="${f(o.x)}" y="${f(o.y)}" font-size="${f(o.size)}"${o.bold?` font-weight="bold"`:""} fill="${o.f}"${an}${tr}>${esc(o.s)}</text>`);
    }
  }
  p.push("</svg>");
  return p.join("\n");
}
const f = n => (Math.round(n*100)/100);

/* ============================================================
   BACKEND 2 — CANVAS (PNG)
   ============================================================ */
function toCanvas(res, scale, region=null){
  const {dl,w,h}=res;
  const rx=region?.x||0, ry=region?.y||0, rw=region?.w||w, rh=region?.h||h;
  const cv=document.createElement("canvas");
  cv.width=Math.max(1,Math.round(rw*scale)); cv.height=Math.max(1,Math.round(rh*scale));
  const c=cv.getContext("2d");
  c.fillStyle=res.background||"#fff"; c.fillRect(0,0,cv.width,cv.height);
  c.scale(scale,scale); c.translate(-rx,-ry); c.lineJoin="miter"; c.textBaseline="alphabetic";
  for(const o of dl.o){
    if(o.t==="r"){
      pathRect(c,o.x,o.y,o.w,o.h,o.rx);
      if(o.f){ c.fillStyle=o.f; c.fill(); }
      if(o.s){ c.strokeStyle=o.s; c.lineWidth=o.sw; c.stroke(); }
    } else if(o.t==="l"){
      c.beginPath(); c.moveTo(o.x1,o.y1); c.lineTo(o.x2,o.y2);
      c.strokeStyle=o.s; c.lineWidth=o.sw; c.stroke();
    } else if(o.t==="p"){
      c.beginPath(); o.pts.forEach((q,i)=> i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1])); c.closePath();
      if(o.f){ c.fillStyle=o.f; c.fill(); }
      if(o.s){ c.strokeStyle=o.s; c.lineWidth=o.sw; c.stroke(); }
    } else if(o.t==="t"){
      c.save(); c.font=fontStr(o.size,o.bold); c.fillStyle=o.f;
      c.textAlign = o.anchor==="middle"?"center":(o.anchor==="end"?"right":"left");
      if(o.rot){ c.translate(o.x,o.y); c.rotate(o.rot*Math.PI/180); c.fillText(o.s,0,0); }
      else c.fillText(o.s,o.x,o.y);
      c.restore();
    }
  }
  return cv;
}
function pathRect(c,x,y,w,h,r){
  c.beginPath();
  if(!r){ c.rect(x,y,w,h); return; }
  r=Math.min(r,w/2,h/2);
  c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r);
  c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  c.lineTo(x+r,y+h); c.quadraticCurveTo(x,y+h,x,y+h-r);
  c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath();
}

/* ============================================================
   BACKEND 3 — PDF  (vector, no external library)
   ============================================================ */
function hex2rgb(h){
  h=String(h).replace("#","");
  if(h.length===3) h=h.split("").map(c=>c+c).join("");
  if(h.length>6) h=h.slice(0,6);
  const n=parseInt(h,16);
  if(isNaN(n)) return [0,0,0];
  return [((n>>16)&255)/255, ((n>>8)&255)/255, (n&255)/255];
}
const p3 = n => (Math.round(n*1000)/1000);
function pdfEscape(s){
  let out="";
  for(const ch of String(s)){
    const c=ch.charCodeAt(0);
    if(ch==="("||ch===")"||ch==="\\") out+="\\"+ch;
    else if(c<32) out+=" ";
    else if(c<256) out+=ch;
    else out += winAnsiFallback(ch);
  }
  return out;
}
/* map a few common typographic characters to their WinAnsi code points */
const WINANSI_HI = {"€":128,"‚":130,"ƒ":131,"„":132,"…":133,"†":134,"‡":135,"ˆ":136,"‰":137,
  "Š":138,"‹":139,"Œ":140,"Ž":142,"‘":145,"’":146,"“":147,"”":148,"•":149,"–":150,"—":151,
  "˜":152,"™":153,"š":154,"›":155,"œ":156,"ž":158,"Ÿ":159};
function winAnsiFallback(ch){
  if(WINANSI_HI[ch]!==undefined) return String.fromCharCode(WINANSI_HI[ch]);
  const map={"≤":"<=","≥":">=","×":"x","÷":"/","→":"->","←":"<-","↔":"<->","−":"-","·":"-",
    "√":"sqrt","≈":"~","≠":"!=","∅":"0","Δ":"Delta","δ":"delta","μ":"u","Ω":"Ohm","°":" deg"};
  if(map[ch]) return map[ch];
  const latin=ch.normalize("NFKD").replace(/[\u0300-\u036f]/g,"");
  return latin.length===1&&latin.charCodeAt(0)<256?latin:"?";
}
/* encode a JS string as single-byte (Latin-1 / WinAnsi) values */
function latin1Bytes(str){
  const out = new Uint8Array(str.length);
  for(let i=0;i<str.length;i++){
    const c = str.charCodeAt(i);
    out[i] = c < 256 ? c : 63;
  }
  return out;
}
function pdfDrawing(res,prefix=[]){
  const {dl,w,h}=res;
  const cs=[...prefix];
  cs.push(`1 j 1 J`);
  const bg=hex2rgb(res.background||"#ffffff");
  cs.push(`${p3(bg[0])} ${p3(bg[1])} ${p3(bg[2])} rg 0 0 ${p3(w)} ${p3(h)} re f`);
  let cf=null, cS=null, cwid=null, cdash=null;
  const setFill=c=>{ if(c!==cf){ const r=hex2rgb(c); cs.push(`${p3(r[0])} ${p3(r[1])} ${p3(r[2])} rg`); cf=c; } };
  const setStroke=c=>{ if(c!==cS){ const r=hex2rgb(c); cs.push(`${p3(r[0])} ${p3(r[1])} ${p3(r[2])} RG`); cS=c; } };
  const setW=v=>{ if(v!==cwid){ cs.push(`${p3(v)} w`); cwid=v; } };
  const setDash=d=>{ if(d!==cdash){ cs.push(d?`[${d}] 0 d`:`[] 0 d`); cdash=d; } };

  for(const o of dl.o){
    if(o.t==="r"){
      rectPath(cs,o.x,o.y,o.w,o.h,o.rx);
      paint(cs,o.f,o.s,o.sw,setFill,setStroke,setW,setDash,o.dash);
    } else if(o.t==="l"){
      setDash(o.dash); setStroke(o.s); setW(o.sw);
      cs.push(`${p3(o.x1)} ${p3(o.y1)} m ${p3(o.x2)} ${p3(o.y2)} l S`);
    } else if(o.t==="p"){
      o.pts.forEach((q,i)=>cs.push(`${p3(q[0])} ${p3(q[1])} ${i?"l":"m"}`));
      cs.push("h");
      paint(cs,o.f,o.s,o.sw,setFill,setStroke,setW,setDash,null);
    } else if(o.t==="t"){
      setFill(o.f);
      const fnt = o.bold?"/F2":"/F1";
      let x=o.x, y=o.y;
      if(!o.rot){
        if(o.anchor==="middle") x -= o.w/2; else if(o.anchor==="end") x -= o.w;
        cs.push(`BT ${fnt} ${p3(o.size)} Tf 1 0 0 -1 ${p3(x)} ${p3(y)} Tm (${pdfEscape(o.s)}) Tj ET`);
      } else if(o.rot===-90){
        let yy=y;
        if(o.anchor==="middle") yy += o.w/2; else if(o.anchor==="end") yy += o.w;
        cs.push(`BT ${fnt} ${p3(o.size)} Tf 0 -1 -1 0 ${p3(x)} ${p3(yy)} Tm (${pdfEscape(o.s)}) Tj ET`);
      } else {
        const a=o.rot*Math.PI/180, ca=Math.cos(a), sa=Math.sin(a);
        cs.push(`BT ${fnt} ${p3(o.size)} Tf ${p3(ca)} ${p3(sa)} ${p3(sa)} ${p3(-ca)} ${p3(x)} ${p3(y)} Tm (${pdfEscape(o.s)}) Tj ET`);
      }
    }
  }
  return cs.join("\n");
}
function toPDF(res,settings={}){
  const {w,h}=res, mode=settings.pdfMode||"single";
  if(settings.pdfTextMode==="unicode") return toRasterPDF(res,settings);
  if(mode==="single"){
    const MAXPT=14000, s=Math.min(1,MAXPT/Math.max(w,h)), W=w*s, H=h*s;
    return assemblePDF(pdfDrawing(res,[`${p3(s)} 0 0 ${p3(s)} 0 0 cm`,`1 0 0 -1 0 ${p3(h)} cm`]),W,H);
  }
  let W=mode==="a3"?841.89:595.28, H=mode==="a3"?1190.55:841.89;
  if((settings.pdfOrientation||"landscape")==="landscape") [W,H]=[H,W];
  const margin=24, scale=.75, tileW=(W-2*margin)/scale, tileH=(H-2*margin)/scale;
  const pages=[];
  for(let y=0;y<h;y+=tileH){
    for(let x=0;x<w;x+=tileW){
      pages.push(pdfDrawing(res,["q",`0 0 ${p3(W)} ${p3(H)} re W n`,
        `1 0 0 -1 0 ${p3(H)} cm`,`${scale} 0 0 ${scale} ${margin} ${margin} cm`,
        `1 0 0 1 ${p3(-x)} ${p3(-y)} cm`])+"\nQ");
    }
  }
  return assemblePDFPages(pages,W,H);
}
function jpegBytes(canvas){
  const encoded=canvas.toDataURL("image/jpeg",.94).split(",")[1], binary=atob(encoded);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
  return bytes;
}
function toRasterPDF(res,settings={}){
  const {w,h}=res,mode=settings.pdfMode||"single";
  if(mode==="single"){
    const MAXPT=14000,s=Math.min(1,MAXPT/Math.max(w,h)),renderScale=Math.max(.25,Math.min(2,6000/Math.max(w,h)));
    const canvas=toCanvas(res,renderScale);
    return assembleImagePDF([{bytes:jpegBytes(canvas),pixelW:canvas.width,pixelH:canvas.height,x:0,y:0,w:w*s,h:h*s}],w*s,h*s);
  }
  let W=mode==="a3"?841.89:595.28,H=mode==="a3"?1190.55:841.89;
  if((settings.pdfOrientation||"landscape")==="landscape") [W,H]=[H,W];
  const margin=24,diagramScale=.75,tileW=(W-2*margin)/diagramScale,tileH=(H-2*margin)/diagramScale;
  const count=Math.ceil(w/tileW)*Math.ceil(h/tileH);
  if(count>500) throw new Error("PDF exceeds the 500-page safety limit");
  const pages=[];
  for(let y=0;y<h;y+=tileH){
    for(let x=0;x<w;x+=tileW){
      const canvas=toCanvas(res,1.5,{x,y,w:tileW,h:tileH});
      pages.push({bytes:jpegBytes(canvas),pixelW:canvas.width,pixelH:canvas.height,
        x:margin,y:margin,w:W-2*margin,h:H-2*margin});
    }
  }
  return assembleImagePDF(pages,W,H);
}
function paint(cs,fill,stroke,sw,setFill,setStroke,setW,setDash,dash){
  setDash(dash||null);
  if(fill && stroke){ setFill(fill); setStroke(stroke); setW(sw); cs.push("B"); }
  else if(fill){ setFill(fill); cs.push("f"); }
  else if(stroke){ setStroke(stroke); setW(sw); cs.push("S"); }
  else cs.push("n");
}
function rectPath(cs,x,y,w,h,r){
  if(!r){ cs.push(`${p3(x)} ${p3(y)} ${p3(w)} ${p3(h)} re`); return; }
  r=Math.min(r,w/2,h/2); const k=0.5523*r;
  cs.push(`${p3(x+r)} ${p3(y)} m`);
  cs.push(`${p3(x+w-r)} ${p3(y)} l`);
  cs.push(`${p3(x+w-r+k)} ${p3(y)} ${p3(x+w)} ${p3(y+r-k)} ${p3(x+w)} ${p3(y+r)} c`);
  cs.push(`${p3(x+w)} ${p3(y+h-r)} l`);
  cs.push(`${p3(x+w)} ${p3(y+h-r+k)} ${p3(x+w-r+k)} ${p3(y+h)} ${p3(x+w-r)} ${p3(y+h)} c`);
  cs.push(`${p3(x+r)} ${p3(y+h)} l`);
  cs.push(`${p3(x+r-k)} ${p3(y+h)} ${p3(x)} ${p3(y+h-r+k)} ${p3(x)} ${p3(y+h-r)} c`);
  cs.push(`${p3(x)} ${p3(y+r)} l`);
  cs.push(`${p3(x)} ${p3(y+r-k)} ${p3(x+r-k)} ${p3(y)} ${p3(x+r)} ${p3(y)} c`);
  cs.push("h");
}
function assemblePDF(content, W, H){
  return assemblePDFPages([content],W,H);
}
function assemblePDFPages(contents,W,H){
  const enc = { encode: latin1Bytes };
  const objs = [];
  objs[1] = `<</Type/Catalog/Pages 2 0 R>>`;
  const pageIds=[],contentIds=[];
  let next=3;
  contents.forEach(()=>{pageIds.push(next++);contentIds.push(next++);});
  const font1=next++,font2=next++;
  objs[2] = `<</Type/Pages/Kids[${pageIds.map(i=>i+" 0 R").join(" ")}]/Count ${pageIds.length}>>`;
  contents.forEach((content,i)=>{
    objs[pageIds[i]]=`<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${p3(W)} ${p3(H)}]/Resources<</Font<</F1 ${font1} 0 R/F2 ${font2} 0 R>>/ProcSet[/PDF/Text]>>/Contents ${contentIds[i]} 0 R>>`;
    objs[contentIds[i]]={stream:enc.encode(content)};
  });
  objs[font1] = `<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>`;
  objs[font2] = `<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold/Encoding/WinAnsiEncoding>>`;
  const chunks=[]; let pos=0; const offs=[];
  const push = str => { const b = typeof str==="string"?enc.encode(str):str; chunks.push(b); pos+=b.length; };
  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const order=Array.from({length:next-1},(_,i)=>i+1);
  for(const i of order){
    offs[i]=pos;
    if(objs[i]&&objs[i].stream){
      push(`${i} 0 obj\n<</Length ${objs[i].stream.length}>>\nstream\n`);
      push(objs[i].stream);
      push("\nendstream\nendobj\n");
    } else {
      push(`${i} 0 obj\n${objs[i]}\nendobj\n`);
    }
  }
  const xref=pos;
  let x = `xref\n0 ${next}\n0000000000 65535 f \n`;
  for(let i=1;i<next;i++) x += String(offs[i]).padStart(10,"0") + " 00000 n \n";
  x += `trailer\n<</Size ${next}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;
  push(x);
  let total=0; chunks.forEach(c=>total+=c.length);
  const out=new Uint8Array(total); let o=0;
  chunks.forEach(c=>{ out.set(c,o); o+=c.length; });
  return out;
}
function assembleImagePDF(images,W,H){
  const enc={encode:latin1Bytes},objs=[],pageIds=[],contentIds=[],imageIds=[];
  objs[1]="<</Type/Catalog/Pages 2 0 R>>";
  let next=3;
  images.forEach(()=>{pageIds.push(next++);contentIds.push(next++);imageIds.push(next++);});
  objs[2]=`<</Type/Pages/Kids[${pageIds.map(i=>i+" 0 R").join(" ")}]/Count ${pageIds.length}>>`;
  images.forEach((image,i)=>{
    objs[pageIds[i]]=`<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${p3(W)} ${p3(H)}]/Resources<</XObject<</Im1 ${imageIds[i]} 0 R>>>>/Contents ${contentIds[i]} 0 R>>`;
    const commands=`q ${p3(image.w)} 0 0 ${p3(image.h)} ${p3(image.x)} ${p3(image.y)} cm /Im1 Do Q`;
    objs[contentIds[i]]={stream:enc.encode(commands),dict:""};
    objs[imageIds[i]]={stream:image.bytes,dict:`/Type/XObject/Subtype/Image/Width ${image.pixelW}/Height ${image.pixelH}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode`};
  });
  const chunks=[];let pos=0;const offs=[];
  const push=value=>{const bytes=typeof value==="string"?enc.encode(value):value;chunks.push(bytes);pos+=bytes.length;};
  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  for(let i=1;i<next;i++){
    offs[i]=pos;
    if(objs[i]?.stream){
      push(`${i} 0 obj\n<<${objs[i].dict||""}/Length ${objs[i].stream.length}>>\nstream\n`);
      push(objs[i].stream);push("\nendstream\nendobj\n");
    }else push(`${i} 0 obj\n${objs[i]}\nendobj\n`);
  }
  const xref=pos;
  let trailer=`xref\n0 ${next}\n0000000000 65535 f \n`;
  for(let i=1;i<next;i++) trailer+=String(offs[i]).padStart(10,"0")+" 00000 n \n";
  trailer+=`trailer\n<</Size ${next}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;push(trailer);
  const out=new Uint8Array(pos);let offset=0;
  chunks.forEach(bytes=>{out.set(bytes,offset);offset+=bytes.length;});
  return out;
}
