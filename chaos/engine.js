/* Тест 3 «Твоя метка Хаоса»: выбор вопросов и подсчёт результата.
   Один и тот же код работает на странице и в симуляции баланса (Node). */
(function(root){
"use strict";
var GODS=["K","T","N","S"];
/* Ручки баланса. Подбираются симуляцией (sim.js), потом по Метрике. */
var CFG={
  bias:{K:1,T:1,N:1,S:1},      // множитель к доле бога
  pen:1,                        // сколько снимает каждый ответ Ч или В
  clean:0,                      // порог «чистоты»: хаос ниже — «Чист»/«Верен»
  loyal:0,                      // «Верен», если В − Ч >= loyal
  depth:{K:[.4,.55,.7],T:[.4,.55,.7],N:[.4,.55,.7],S:[.4,.55,.7]}, // пороги След/Метка/Зов
  gork:3,                       // сколько орочьих ответов нужно для Горкаморки
  near:.06                      // разрыв, при котором «рядом слышен ещё голос»
};

function shuffle(a,rnd){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(rnd()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

/* 14 вопросов: по одному из каждого слота, слоты по порядку (1 — первый, 14 — последний).
   Пары для сверки показаний: 9 берёт ту же букву, что 4; 11 — ту же, что 7. */
function pickQuestions(pool,rnd){
  var lt={}, out=[];
  pool.forEach(function(s){
    var L = s.n===9 ? lt[4] : s.n===11 ? lt[7] : (rnd()<.5?0:1);
    lt[s.n]=L;
    var q=s.qs[L];
    out.push({id:q.id,slot:s.n,e:s.e,tm:s.tm,t:q.t,a:shuffle(q.a.slice(),rnd)});
  });
  return out;
}

/* picks[i] — выбранный ответ (объект из q.a) или null (не успел на таймере). */
function score(qs,picks){
  var raw={K:0,T:0,N:0,S:0}, max={K:0,T:0,N:0,S:0}, n={C:0,L:0,U:0,G:0,miss:0};
  qs.forEach(function(q,i){
    q.a.forEach(function(a){ if(a.w&&a.w>max[a.g]) max[a.g]=a.w; });
    var p=picks[i];
    if(!p){ n.miss++; return; }
    if(a_isGod(p.g)) raw[p.g]+=p.w; else n[p.g]++;
  });
  function a_isGod(g){ return GODS.indexOf(g)>=0; }
  var norm={}, total=0, best=null, second=null;
  GODS.forEach(function(g){ norm[g]=max[g]?raw[g]/max[g]:0; total+=raw[g]; });
  var ranked=GODS.slice().sort(function(a,b){ return norm[b]*CFG.bias[b]-norm[a]*CFG.bias[a] || raw[b]-raw[a]; });
  best=ranked[0]; second=ranked[1];
  var purity=n.C+n.L, chaos=total-CFG.pen*purity;
  var r={raw:raw,norm:norm,n:n,chaos:chaos,loyalty:n.L};
  if(n.G>=CFG.gork){ r.id="gork"; return r; }
  if(chaos<CFG.clean){ r.id=(n.L-n.C>=CFG.loyal)?"loyal":"clean"; return r; }
  var d=norm[best]*CFG.bias[best]+.01*chaos+.001*raw[best], t=CFG.depth[best], lvl=0;
  while(lvl<3&&d>=t[lvl]) lvl++;
  r.god=best; r.lvl=lvl; r.id=best+lvl;
  if(norm[best]*CFG.bias[best]-norm[second]*CFG.bias[second]<CFG.near) r.echo=second;
  return r;
}

Object.assign(CFG,{"bias": {"K": 0.785, "T": 0.569, "N": 0.616, "S": 0.626}, "pen": 1, "clean": 6, "loyal": 0, "depth": {"K": [2.0283, 2.6136, 3.5641], "T": [1.786, 2.388, 3.09], "N": [1.7595, 2.3981, 3.1266], "S": [1.8066, 2.3057, 3.104]}, "gork": 3, "near": 0.06}); /* подобрано симуляцией 26.10.2026 */
root.CHAOS={GODS:GODS,CFG:CFG,pickQuestions:pickQuestions,score:score,shuffle:shuffle};
})(typeof window!=="undefined"?window:globalThis);
