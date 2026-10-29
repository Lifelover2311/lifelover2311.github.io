/* Импорт личного дела: перенос пройденных тестов между устройствами.
   Все данные серии лежат в localStorage этого сайта (один origin на все тесты).
   Экспорт: ключи серии -> JSON -> deflate -> base64url -> ссылка https://lifelover2311.github.io/#delo-import=...
   Импорт: открытие такой ссылки на витрине (или вставка ссылки в поле).
   Ключи новых тестов (например, теста 5) добавлять в PREFIX. */
(function(){
"use strict";
var PREFIX=/^(krov|imperium|chaos|xenos|heresy|delo)[-_]/;
var HASH="delo-import=";
var BASE="https://lifelover2311.github.io/";
var QR_SRC="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";
var LIVE=location.hostname==="lifelover2311.github.io";
function track(n){ try{ if(window.ym&&LIVE) ym(113669793,"reachGoal","delo_move_"+n); }catch(e){} }

/* ---------- данные ---------- */
function keys(){ var a=[]; try{ for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); if(k&&PREFIX.test(k)) a.push(k); } }catch(e){} return a.sort(); }
function hasAny(){ return keys().length>0; }
/* значения кладём объектами (без экранирования кавычек — ссылка короче), невалидный JSON — строкой с пометкой */
function collect(){ var o={}; keys().forEach(function(k){ try{ var v=localStorage.getItem(k); if(v==null) return; try{ o[k]=JSON.parse(v); }catch(e){ o[k]={"$s":v}; } }catch(e){} }); return o; }
function raw(v){ return (v&&typeof v==="object"&&!Array.isArray(v)&&typeof v.$s==="string"&&Object.keys(v).length===1)?v.$s:JSON.stringify(v); }

function b64u(bytes){ var s="", CH=0x8000; for(var i=0;i<bytes.length;i+=CH) s+=String.fromCharCode.apply(null,bytes.subarray(i,i+CH)); return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }
function unb64u(str){ str=str.replace(/-/g,"+").replace(/_/g,"/"); while(str.length%4) str+="="; var s=atob(str), b=new Uint8Array(s.length); for(var i=0;i<s.length;i++) b[i]=s.charCodeAt(i); return b; }
function pipe(bytes,stream){ return new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer().then(function(b){ return new Uint8Array(b); }); }

function pack(){
  var json=JSON.stringify({v:2,d:Date.now(),k:collect()}), raw=new TextEncoder().encode(json);
  if(window.CompressionStream){ return pipe(raw,new CompressionStream("deflate-raw")).then(function(z){ return "z"+b64u(z); }).catch(function(){ return "j"+b64u(raw); }); }
  return Promise.resolve("j"+b64u(raw));
}
function unpack(code){
  return Promise.resolve().then(function(){
    var t=code.charAt(0), bytes=unb64u(code.slice(1));
    if(t==="j") return bytes;
    if(t==="z"){ if(!window.DecompressionStream) throw new Error("old"); return pipe(bytes,new DecompressionStream("deflate-raw")); }
    throw new Error("bad");
  }).then(function(b){ var o=JSON.parse(new TextDecoder().decode(b)); if(!o||(o.v!==1&&o.v!==2)||!o.k||typeof o.k!=="object") throw new Error("bad"); return o; });
}
function codeFrom(text){
  text=String(text||"").trim(); var i=text.indexOf(HASH);
  if(i>=0) text=text.slice(i+HASH.length);
  text=text.split(/[\s&]/)[0];
  return /^[zj][A-Za-z0-9_-]{8,}$/.test(text)?text:null;
}
/* история прохождений склеивается, остальное берётся из ссылки */
function mergeHist(mine,theirs){
  var a=[], seen={};
  function add(list){ (Array.isArray(list)?list:[]).forEach(function(x){ if(!x) return; var id=x.c+"|"+x.d; if(seen[id]) return; seen[id]=1; a.push(x); }); }
  add(theirs); add(mine);
  a.sort(function(x,y){ return (y.d||0)-(x.d||0); });
  return a.slice(0,10);
}
function apply(o){
  Object.keys(o.k).forEach(function(k){
    if(!PREFIX.test(k)) return; var v=o.v===1?o.k[k]:raw(o.k[k]); if(typeof v!=="string") return;
    try{
      if(/-hist$/.test(k)){ var mine=JSON.parse(localStorage.getItem(k)||"null"); if(mine){ v=JSON.stringify(mergeHist(mine,JSON.parse(v))); } }
      localStorage.setItem(k,v);
    }catch(e){ try{ localStorage.setItem(k,v); }catch(e2){} }
  });
}
function names(k){ /* что есть в деле: для подтверждения */
  var out=[]; function n(key,label){ try{ var x=k[key]; if(typeof x==="string") x=JSON.parse(x); if(x&&x.n) out.push(label+": "+x.n); }catch(e){} }
  n("krov-primarhov-last","Кровь"); n("imperium-last","Роль"); n("chaos-last","Метка"); n("xenos-last","Связь");
  return out;
}

/* ---------- QR ---------- */
var qrP=null;
function loadQR(){ if(window.qrcode) return Promise.resolve(); if(qrP) return qrP; qrP=new Promise(function(ok,no){ var s=document.createElement("script"); s.src=QR_SRC; s.onload=ok; s.onerror=function(){ qrP=null; no(); }; document.head.appendChild(s); }); return qrP; }
function drawQR(cv,text){
  var q=qrcode(0,"L"); q.addData(text,"Byte"); q.make();
  var n=q.getModuleCount(), quiet=4, px=Math.max(2,Math.floor(560/(n+quiet*2))), size=px*(n+quiet*2);
  cv.width=cv.height=size; var c=cv.getContext("2d"); c.fillStyle="#fff"; c.fillRect(0,0,size,size); c.fillStyle="#000";
  for(var r=0;r<n;r++) for(var col=0;col<n;col++) if(q.isDark(r,col)) c.fillRect((col+quiet)*px,(r+quiet)*px,px,px);
}

/* ---------- интерфейс ---------- */
var CSS=
".mv{margin:22px 0 0;padding:16px 20px;border:1px solid var(--rule,#3a3027);background:rgba(26,22,18,.9);display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;justify-content:space-between}"+
".mv p{margin:0;color:var(--dust,#a2967f);max-width:34em}"+
".mv-b{font:500 15px/1.2 'Alegreya Sans',sans-serif;color:var(--ink,#0d0b09);background:var(--gilt,#cfa752);border:0;padding:11px 18px;cursor:pointer;letter-spacing:.02em}"+
".mv-b:hover{background:#e0bb68}.mv-b.alt{background:transparent;color:var(--gilt,#cfa752);border:1px solid #8f6e2c}.mv-b.alt:hover{border-color:var(--gilt,#cfa752);background:rgba(207,167,82,.08)}"+
".mv-b:disabled{opacity:.5;cursor:default}"+
".mv-o{position:fixed;inset:0;z-index:50;background:rgba(6,5,4,.86);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:24px 16px;opacity:0;transition:opacity .25s}"+
".mv-o.on{opacity:1}"+
".mv-m{position:relative;width:100%;max-width:560px;margin:auto 0;background:#15120e;border:1px solid var(--rule,#3a3027);box-shadow:0 20px 60px -20px #000;padding:26px 22px 22px;color:var(--bone,#ebe1cc)}"+
".mv-m h3{font-family:'Alegreya SC',Georgia,serif;font-weight:800;font-size:30px;line-height:1.05;margin:4px 0 6px;padding-right:30px}"+
".mv-m .lead2{margin:0 0 18px;color:var(--dust,#a2967f)}"+
".mv-x{position:absolute;top:10px;right:10px;width:38px;height:38px;border:0;background:none;color:var(--dust,#a2967f);font-size:26px;line-height:1;cursor:pointer}.mv-x:hover{color:var(--bone,#ebe1cc)}"+
".mv-s{border-top:1px solid var(--rule,#3a3027);padding:16px 0 4px}"+
".mv-s .eb{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--gilt,#cfa752);margin:0 0 8px}"+
".mv-s p{margin:0 0 12px}.mv-m .dim{color:var(--dust,#a2967f);font-size:14px}"+
".mv-qr{display:block;width:min(100%,340px);height:auto;margin:4px auto 14px;image-rendering:pixelated;border:6px solid #fff}"+
".mv-row{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 12px}"+
".mv-in{flex:1 1 220px;min-width:0;font:15px/1.3 'JetBrains Mono',monospace;color:var(--bone,#ebe1cc);background:#0d0b09;border:1px solid var(--rule,#3a3027);padding:10px 12px}"+
".mv-in:focus{outline:none;border-color:var(--gilt,#cfa752)}"+
".mv-st{min-height:1.4em;margin:0 0 6px;font-size:14px;color:var(--dust,#a2967f)}.mv-st.ok{color:#9fbf7a}.mv-st.err{color:#e07a6e}"+
".mv-list{margin:0 0 14px;padding:10px 14px;border-left:2px solid var(--gilt,#cfa752);background:rgba(207,167,82,.06)}"+
".mv-list div{margin:2px 0}"+
".mv-toast{position:fixed;left:50%;bottom:24px;width:max-content;transform:translate(-50%,20px);z-index:60;background:#15120e;border:1px solid var(--gilt,#cfa752);color:var(--bone,#ebe1cc);padding:12px 18px;max-width:calc(100% - 32px);opacity:0;transition:opacity .3s,transform .3s}"+
".mv-toast.on{opacity:1;transform:translate(-50%,0)}";

function el(tag,cls,html){ var e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
function css(){ if(document.getElementById("mv-css")) return; var s=el("style"); s.id="mv-css"; s.textContent=CSS; document.head.appendChild(s); }
function toast(t){ var d=el("div","mv-toast",t); document.body.appendChild(d); requestAnimationFrame(function(){ d.classList.add("on"); }); setTimeout(function(){ d.classList.remove("on"); setTimeout(function(){ d.remove(); },400); },4200); }

var overlay=null, lastFocus=null;
function close(){ if(!overlay) return; var o=overlay; overlay=null; o.classList.remove("on"); document.body.style.overflow=""; setTimeout(function(){ o.remove(); },250); document.removeEventListener("keydown",onKey); if(lastFocus) try{ lastFocus.focus(); }catch(e){} }
function onKey(e){ if(e.key==="Escape") close(); }
function modal(build){
  close(); css(); lastFocus=document.activeElement;
  var o=el("div","mv-o"), m=el("div","mv-m"); m.setAttribute("role","dialog"); m.setAttribute("aria-modal","true");
  var x=el("button","mv-x","×"); x.setAttribute("aria-label","Закрыть"); x.onclick=close; m.appendChild(x);
  o.appendChild(m); o.addEventListener("click",function(e){ if(e.target===o) close(); });
  build(m); document.body.appendChild(o); document.body.style.overflow="hidden"; overlay=o;
  requestAnimationFrame(function(){ o.classList.add("on"); }); document.addEventListener("keydown",onKey);
  return m;
}

function copyText(t){
  if(navigator.clipboard&&window.isSecureContext) return navigator.clipboard.writeText(t);
  return new Promise(function(ok,no){ var a=el("textarea"); a.value=t; a.style.cssText="position:fixed;top:-1000px"; document.body.appendChild(a); a.select(); try{ document.execCommand("copy")?ok():no(); }catch(e){ no(); } a.remove(); });
}

function openPanel(){
  track("open");
  modal(function(m){
    m.appendChild(el("div","eyebrow","Личное дело"));
    m.appendChild(el("h3","","Импорт личного дела"));
    m.appendChild(el("p","lead2","Для переноса пройденных результатов на другое устройство: например, проходил тесты на телефоне, а дальше хочешь на ноутбуке."));

    /* отсюда */
    var s1=el("div","mv-s"); s1.appendChild(el("div","eb","Перенести с этого устройства"));
    if(!hasAny()){
      s1.appendChild(el("p","dim","На этом устройстве пока нет пройденных тестов. Открой эту страницу там, где проходил тесты, и нажми «Импорт личного дела» там."));
    } else {
      var cv=el("canvas","mv-qr"); cv.hidden=true; cv.setAttribute("aria-label","QR-код со ссылкой на личное дело");
      var hint=el("p","","Наведи камеру другого телефона на код и открой ссылку — дело появится там.");
      hint.hidden=true;
      var hint2=el("p","dim","Перенести на ноутбук проще ссылкой: отправь её себе, например в «Избранное» Телеграма, и открой на ноутбуке.");
      var row=el("div","mv-row"), bc=el("button","mv-b","Скопировать ссылку"), bs=el("button","mv-b alt","Отправить…");
      bc.disabled=bs.disabled=true; row.appendChild(bc); if(navigator.share) row.appendChild(bs);
      var st=el("div","mv-st","Собираю дело…");
      s1.appendChild(cv); s1.appendChild(hint); s1.appendChild(row); s1.appendChild(st); s1.appendChild(hint2);
      pack().then(function(code){
        var url=BASE+"#"+HASH+code;
        bc.disabled=bs.disabled=false; st.textContent="";
        bc.onclick=function(){ copyText(url).then(function(){ st.className="mv-st ok"; st.textContent="Ссылка скопирована. Открой её на другом устройстве."; track("copy"); },function(){ st.className="mv-st err"; st.textContent="Не удалось скопировать. Нажми «Отправить…» или сделай скриншот кода."; }); };
        bs.onclick=function(){ navigator.share({title:"Моё личное дело",text:"Ссылка для переноса личного дела (тесты «Твоя роль»)",url:url}).then(function(){ track("share"); },function(){}); };
        loadQR().then(function(){ try{ drawQR(cv,url); cv.hidden=false; hint.hidden=false; }catch(e){} }).catch(function(){});
      }).catch(function(){ st.className="mv-st err"; st.textContent="Не удалось собрать дело. Обнови страницу и попробуй ещё раз."; });
    }
    m.appendChild(s1);

    /* сюда */
    var s2=el("div","mv-s"); s2.appendChild(el("div","eb","Принять на это устройство"));
    s2.appendChild(el("p","","Открой здесь ссылку с другого устройства или вставь её в поле:"));
    var r2=el("div","mv-row"), inp=el("input","mv-in"), bl=el("button","mv-b","Загрузить");
    inp.type="text"; inp.placeholder="Вставь ссылку"; inp.autocomplete="off"; inp.setAttribute("aria-label","Ссылка на личное дело");
    r2.appendChild(inp); r2.appendChild(bl);
    var st2=el("div","mv-st","");
    s2.appendChild(r2); s2.appendChild(st2);
    s2.appendChild(el("p","dim","Тесты, пройденные внутри ВК, Телеграма или Пикабу, хранятся в их встроенном браузере отдельно. Чтобы перенести их, открой эту страницу там же."));
    function go(){ var c=codeFrom(inp.value); if(!c){ st2.className="mv-st err"; st2.textContent="Это не похоже на ссылку на личное дело. Скопируй её целиком."; return; } st2.className="mv-st"; st2.textContent=""; confirmImport(c); }
    bl.onclick=go; inp.addEventListener("keydown",function(e){ if(e.key==="Enter") go(); });
    m.appendChild(s2);
  });
}

function confirmImport(code){
  unpack(code).then(function(o){
    var list=names(o.k);
    modal(function(m){
      m.appendChild(el("div","eyebrow","Личное дело"));
      m.appendChild(el("h3","","Импорт личного дела"));
      m.appendChild(el("p","lead2","В ссылке — дело с другого устройства. Перенести его сюда?"));
      if(list.length){ var l=el("div","mv-list"); list.forEach(function(t){ var d=el("div"); d.textContent=t; l.appendChild(d); }); m.appendChild(l); }
      if(hasAny()) m.appendChild(el("p","dim","На этом устройстве тоже есть пройденные тесты. Результаты заменятся результатами из ссылки, история прохождений сложится вместе."));
      var row=el("div","mv-row"), ok=el("button","mv-b","Перенести дело"), no=el("button","mv-b alt","Отмена");
      row.appendChild(ok); row.appendChild(no); m.appendChild(row);
      no.onclick=close;
      ok.onclick=function(){ apply(o); track("import"); close(); refresh(); toast("Дело перенесено. Можно продолжать с того места, где остановился."); var d=document.getElementById("delo"); if(d&&!d.hidden) setTimeout(function(){ d.scrollIntoView({behavior:"smooth",block:"start"}); },300); };
    });
  }).catch(function(e){
    modal(function(m){
      m.appendChild(el("h3","","Импорт личного дела"));
      m.appendChild(el("p","lead2",e&&e.message==="old"?"Этот браузер слишком старый, чтобы открыть дело. Обнови его или открой ссылку в другом браузере.":"Ссылка повреждена или скопирована не полностью. Скопируй её ещё раз целиком."));
      var row=el("div","mv-row"), b=el("button","mv-b","Понятно"); b.onclick=close; row.appendChild(b); m.appendChild(row);
    });
  });
}

var box=null;
function refresh(){
  try{ if(window.DELO) DELO.mount(document.getElementById("delo")); }catch(e){}
  if(box) box.querySelector("p").textContent=hasAny()?"Хочешь продолжить на другом устройстве? Перенеси туда пройденные тесты.":"Проходил тесты на другом устройстве? Перенеси результаты сюда.";
}
function mount(where){
  css(); box=el("div","mv"); box.appendChild(el("p",""));
  var b=el("button","mv-b","Импорт личного дела"); b.onclick=openPanel; box.appendChild(b);
  where.parentNode.insertBefore(box,where.nextSibling); refresh();
}
function fromHash(){
  var h=location.hash||""; if(h.indexOf(HASH)<0) return;
  var c=codeFrom(h);
  try{ history.replaceState(null,"",location.pathname+location.search); }catch(e){ location.hash=""; }
  if(c) confirmImport(c);
}
window.DELO_MOVE={mount:mount,open:openPanel,pack:pack,unpack:unpack,apply:apply};
function init(){ var d=document.getElementById("delo"); if(d) mount(d); fromHash(); }
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
window.addEventListener("hashchange",fromHash);
})();
