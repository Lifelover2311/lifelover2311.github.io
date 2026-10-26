/* Симуляция баланса теста 3 (Node): node sim.js
   1) модель аудитории подгоняется так, чтобы текущие ручки воспроизводили долю результатов из Метрики;
   2) ручки engine.js подбираются под целевое распределение на той же аудитории.
   Метрика 26.10.2026, 248 результатов: см. OBS. Цель: см. TARGET. */
"use strict";
const vm=require("vm"),fs=require("fs"),path=require("path");
const dc={}; vm.createContext(dc); vm.runInContext(fs.readFileSync(path.join(__dirname,"data.js"),"utf8"),dc);
const POOL=dc.POOL;
require("./engine.js"); const E=globalThis.CHAOS; const CFG0=JSON.parse(JSON.stringify(E.CFG));

const OUT=["K","T","N","S","clean","loyal","gork"];
const OBS   ={K:.274,T:.234,N:.194,S:.073,clean:.137,loyal:.085,gork:.004};
const TARGET={K:.20, T:.16, N:.19, S:.13, clean:.17, loyal:.14, gork:.01};
const OBS_D=[.594,.234,.135,.036], TGT_D=[.45,.30,.17,.08];
const BLOODS=["horus","angron","fulgrim","perturabo","mortarion","magnus","lorgar","curze","dorn","sanguinius","khan","russ","guilliman","vulkan","corax","ferrus","jonson","alpharius","emperor"];
const ROLES=Object.keys(E.LINK.role.chaos).concat(["adept","agri","servitor","guard","ogryn","knight","skitarius","astropath","navigator","chronicler","ratling"]);

function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function gamma(k,r){ if(k<1){ return gamma(k+1,r)*Math.pow(r(),1/k); } const d=k-1/3,c=1/Math.sqrt(9*d); for(;;){ let x,v; do{ const u1=r(),u2=r(); x=Math.sqrt(-2*Math.log(u1+1e-12))*Math.cos(2*Math.PI*u2); v=1+c*x; }while(v<=0); v=v*v*v; const u=r(); if(Math.log(u+1e-12)<.5*x*x+d-d*v+Math.log(v)) return d*v; } }
const TYPES=["K","T","N","S","G","C","L","U"];

/* заранее готовим респондентов: профиль предпочтений + случайные числа для вопросов */
function makeCrowd(n,pop,seed){
  const r=rng(seed), crowd=[];
  for(let i=0;i<n;i++){
    const q={}; let s=0; TYPES.forEach(t=>{ q[t]=gamma(pop.a[t]*pop.c+1e-3,r); s+=q[t]; }); TYPES.forEach(t=>q[t]/=s);
    crowd.push({q,seed:Math.floor(r()*1e9),blood:r()<.65?BLOODS[Math.floor(r()*BLOODS.length)]:null,role:r()<.55?ROLES[Math.floor(r()*ROLES.length)]:null});
  }
  return crowd;
}
function runOne(p,pop,cfg){
  const r=rng(p.seed); Object.assign(E.CFG,cfg);
  const qs=E.pickQuestions(POOL,r), picks=qs.map(q=>{
    if(q.tm&&r()<.04) return null;
    const w=q.a.map(a=>Math.pow(p.q[a.g]+.02,pop.sharp)); let s=w.reduce((x,y)=>x+y,0), u=r()*s, k=0;
    for(;k<w.length-1;k++){ u-=w[k]; if(u<=0) break; } return q.a[k];
  });
  return E.score(qs,picks,{blood:p.blood,role:p.role});
}
function stats(crowd,pop,cfg){
  const c={}; OUT.forEach(o=>c[o]=0); const d=[0,0,0,0]; let gods=0;
  crowd.forEach(p=>{ const r=runOne(p,pop,cfg); c[r.god||r.id]++; if(r.god){ d[r.lvl]++; gods++; } });
  const n=crowd.length; OUT.forEach(o=>c[o]/=n); return {sh:c,dp:d.map(x=>x/Math.max(gods,1))};
}
function loss(st,tg,td){ let l=0; OUT.forEach(o=>{ l+=Math.pow(st.sh[o]-tg[o],2)*(o==="gork"?.2:1); }); td.forEach((t,i)=>{ l+=.5*Math.pow(st.dp[i]-t,2); }); return l; }

function search(f,x0,step,iters,seed){ // простой случайный спуск
  const r=rng(seed); let best=x0.slice(), bl=f(best);
  for(let i=0;i<iters;i++){ const sc=step*(1-i/iters*.8); const y=best.map(v=>v+(r()-.5)*2*sc*Math.max(Math.abs(v),.2)); const l=f(y); if(l<bl){ best=y; bl=l; } }
  return {x:best,l:bl};
}
const fmt=o=>OUT.map(k=>k+" "+(o.sh[k]*100).toFixed(1)).join(" | ")+"  ||  глубина "+o.dp.map(x=>(x*100).toFixed(0)).join("/");

/* 1. подгон аудитории под наблюдаемое при текущих ручках */
const crowdFit=(pop)=>makeCrowd(2500,pop,11);
const unpack=x=>({a:{K:Math.exp(x[0]),T:Math.exp(x[1]),N:Math.exp(x[2]),S:Math.exp(x[3]),G:Math.exp(x[4]),C:Math.exp(x[5]),L:Math.exp(x[6]),U:Math.exp(x[7])},c:Math.exp(x[8]),sharp:Math.exp(x[9])});
const norm=a=>{ const s=Object.values(a).reduce((x,y)=>x+y,0); Object.keys(a).forEach(k=>a[k]/=s); return a; };
const fp=x=>{ const p=unpack(x); norm(p.a); return loss(stats(crowdFit(p),p,CFG0),OBS,OBS_D); };
let fit={x:[0,0,0,0,-1.5,0,0,-1,1.2,.4],l:1}, bestFit=null;
for(let s=1;s<=3;s++){ const r=search(fp,[Math.log(.2),Math.log(.2),Math.log(.2),Math.log(.1),-2,Math.log(.15),Math.log(.1),Math.log(.05),Math.log(6),Math.log(2)].map(v=>v+(s-2)*.3),.35,260,s); if(!bestFit||r.l<bestFit.l) bestFit=r; }
const POP=unpack(bestFit.x); norm(POP.a);
const crowd=makeCrowd(6000,POP,777);
console.log("Аудитория подогнана, loss",bestFit.l.toFixed(5));
console.log("Наблюдалось  :",OUT.map(k=>k+" "+(OBS[k]*100).toFixed(1)).join(" | ")+"  ||  глубина "+OBS_D.map(x=>(x*100).toFixed(0)).join("/"));
console.log("Модель, было :",fmt(stats(crowd,POP,CFG0)));

/* 2. подбор ручек под цель */
const mk=(x,loy)=>{ const c=JSON.parse(JSON.stringify(CFG0));
  c.bias={K:CFG0.bias.K*Math.exp(x[0]),T:CFG0.bias.T*Math.exp(x[1]),N:CFG0.bias.N*Math.exp(x[2]),S:CFG0.bias.S*Math.exp(x[3])};
  c.clean=CFG0.clean+x[4]; c.loyal=loy;
  ["K","T","N","S"].forEach(g=>{ c.depth[g]=CFG0.depth[g].map((t,i)=>t*Math.exp(x[5+i]));});
  return c; };
let res=null;
[-1,0,1].forEach(loy=>{
  const ff=x=>loss(stats(crowd.slice(0,3000),POP,mk(x,loy)),TARGET,TGT_D);
  const r=search(ff,[0,0,0,0,0,0,0,0],.6,420,5+loy); r.loy=loy; if(!res||r.l<res.l) res=r;
});
const NEW=mk(res.x,res.loy);
const st=stats(crowd,POP,NEW);
console.log("Модель, стало:",fmt(st));
console.log("Цель         :",OUT.map(k=>k+" "+(TARGET[k]*100).toFixed(1)).join(" | ")+"  ||  глубина "+TGT_D.map(x=>(x*100).toFixed(0)).join("/"));
const rd=v=>+v.toFixed(4);
const out={bias:{},pen:NEW.pen,clean:rd(NEW.clean),loyal:NEW.loyal,depth:{},gork:NEW.gork,near:NEW.near};
["K","T","N","S"].forEach(g=>{ out.bias[g]=rd(NEW.bias[g]); out.depth[g]=NEW.depth[g].map(rd); });
console.log("CFG:",JSON.stringify(out));
fs.writeFileSync(path.join(__dirname,".sim-out.json"),JSON.stringify(out));
