/* «Личное дело»: общая карточка серии тестов.
   Собирается из результатов обоих тестов (localStorage на одном домене):
   krov-primarhov-last  — {id, n}  («Кровь примархов»)
   imperium-last        — {id, n}  («Твоя роль в Империуме»)
   Подключение: <script src="/delo.js"></script>, затем DELO.mount(элемент). */
(function(){
"use strict";

var BASE=(function(){ var s=document.currentScript; return s&&s.src?s.src.replace(/[^\/]*$/,""):"/"; })();
var KROV_KEY="krov-primarhov-last", IMP_KEY="imperium-last";
var LIVE=/github\.io$/.test(location.hostname);

var ROLE_ART={adept:"01-adept",guard:"02-guard",commissar:"03-commissar",techpriest:"04-techpriest",inquisitor:"05-inquisitor",sororitas:"06-sister-battle",preacher:"07-preacher",trader:"08-rogue-trader",navigator:"09-navigator",astropath:"10-astropath",arbitrator:"11-arbitrator",assassin:"12-assassin",governor:"13-governor",hospitaller:"14-hospitaller",underhive:"15-underhive",navy:"16-navy-officer",psyker:"17-psyker",genecult:"18-genecult",ogryn:"19-ogryn",ratling:"20-ratling",silence:"21-sister-silence",knight:"22-knight",agri:"23-agriworld",chronicler:"24-chronicler",custodian:"25-custodian",servitor:"26-servitor",skitarius:"27-skitarius"};
var BLOOD_IDS=["lion","fulgrim","perturabo","khan","russ","dorn","curze","sanguinius","ferrus","angron","guilliman","mortarion","magnus","horus","lorgar","vulkan","corax","alpharius","emperor"];

function bloodArt(id){ return BASE+"krov-primarhov/art/"+id+".jpg"; }
function roleArt(id){ return BASE+"imperium/art/"+ROLE_ART[id]+".jpg"; }
function ls(k){ try{ return JSON.parse(localStorage.getItem(k)||"null"); }catch(e){ return null; } }
function track(n){ try{ if(window.ym&&LIVE) ym(113669793,"reachGoal","delo_"+n); }catch(e){} }

/* ---------- Передача связки между тестами через ссылку ----------
   localStorage не переживает смену браузера (встроенный браузер Пикабу, ВК, Телеграма → обычный),
   поэтому кровь и ответы первого теста едут в ссылке: ?k=lion&p=m5.3-m13.0.2
   k — id примарха; p — ответы первого теста (вопрос.вариант[.вариант]), нужны для отсылок во втором. */
var KA_KEY="krov-answers2";
var BLOOD_NAME={lion:"Лев Эль’Джонсон",fulgrim:"Фулгрим",perturabo:"Пертурабо",khan:"Джагатай-хан",russ:"Леман Русс",dorn:"Рогал Дорн",curze:"Конрад Кёрз",sanguinius:"Сангвиний",ferrus:"Феррус Манус",angron:"Ангрон",guilliman:"Робаут Жиллиман",mortarion:"Мортарион",magnus:"Магнус Красный",horus:"Хорус Луперкаль",lorgar:"Лоргар Аврелиан",vulkan:"Вулкан",corax:"Коракс",alpharius:"Альфарий Омегон",emperor:"Император Человечества"};
function encodeAnswers(ka){
  if(!ka||typeof ka!=="object"||Array.isArray(ka)) return "";
  var out=[];
  Object.keys(ka).forEach(function(k){
    var v=ka[k];
    if(!/^[a-z]\d{1,3}$/.test(k)||!Array.isArray(v)||!v.length||v.length>2) return;
    if(!v.every(function(x){ return typeof x==="number"&&x>=0&&x<=9&&x%1===0; })) return;
    out.push(k+"."+v.join("."));
  });
  return out.slice(0,40).join("-");
}
function decodeAnswers(s){
  var ka={};
  if(typeof s!=="string"||s.length>400) return ka;
  s.split("-").forEach(function(part){
    var a=part.split("."), k=a[0], v=a.slice(1);
    if(!/^[a-z]\d{1,3}$/.test(k)||v.length<1||v.length>2) return;
    var nums=v.map(function(x){ return /^\d$/.test(x)?parseInt(x,10):-1; });
    if(nums.some(function(x){ return x<0; })) return;
    ka[k]=nums;
  });
  return ka;
}
/* Строка запроса для перехода ко второму тесту: "" если крови ещё нет */
function carry(){
  var b=ls(KROV_KEY); if(!b||!b.id||BLOOD_IDS.indexOf(b.id)<0) return "";
  var q="?k="+encodeURIComponent(b.id), p=encodeAnswers(ls(KA_KEY));
  if(p) q+="&p="+p;
  return q;
}
/* Принять связку из ссылки: ссылка новее и надёжнее, чем то, что лежит в этом браузере */
function adopt(){
  try{
    var sp=new URLSearchParams(location.search), k=sp.get("k");
    if(!k||BLOOD_IDS.indexOf(k)<0) return false;
    var cur=ls(KROV_KEY);
    if(!cur||cur.id!==k) localStorage.setItem(KROV_KEY,JSON.stringify({id:k,n:BLOOD_NAME[k],d:Date.now()}));
    var inc=decodeAnswers(sp.get("p")), keys=Object.keys(inc);
    if(keys.length){
      var ka=ls(KA_KEY); if(!ka||typeof ka!=="object"||Array.isArray(ka)) ka={};
      keys.forEach(function(x){ ka[x]=inc[x]; });
      ka._t=Date.now();
      localStorage.setItem(KA_KEY,JSON.stringify(ka));
    }
    if(window.history&&history.replaceState) history.replaceState(null,"",location.pathname+location.hash);
    track("adopt");
    return true;
  }catch(e){ return false; }
}
adopt();

/* ---------- Заключения инспектора: отдельные тексты для пар «кровь + роль» ---------- */
var PAIRS={
  "sanguinius:hospitaller":"Лечит всех подряд и без очереди. Себе приём не назначил ни разу.",
  "sanguinius:knight":"Благородство в двойном размере и в тяжёлой броне. Крылья уставом не предусмотрены, но их ждут.",
  "sanguinius:adept":"Улыбается даже на пятом круге согласований. Инспектор подозревает, что внутри всё не так радостно.",
  "sanguinius:preacher":"Слова добрые, взгляд тёплый, очередь на исповедь с утра.",
  "sanguinius:psyker":"Знает, что будет, и всё равно улыбается. Врачи предлагали отдых.",
  "corax:assassin":"Приходит бесшумно, уходит ещё тише. Свидетелей не найдено, жалоб тоже.",
  "corax:agri":"Урожай растёт в тени и никому не показывается. Соседи считают поле заброшенным, налоги при этом платятся.",
  "corax:navigator":"Проходит там, где нет карты, и выходит там, где не ждали. Третий глаз в отчёте не упомянут.",
  "alpharius:assassin":"Личность подтверждена частично. Вторая половина дела где-то гуляет отдельно.",
  "alpharius:adept":"Подписывает документы за себя и ещё за кого-то. Кого именно, выясняет отдельная комиссия.",
  "alpharius:chronicler":"В архиве две версии одного события. Обе правдивы, обе записаны одним почерком.",
  "alpharius:inquisitor":"Видит всех насквозь, а его самого пока видно в двух экземплярах. Протокол осмотра не сходится.",
  "alpharius:genecult":"Агент под прикрытием обнаружил, что прикрытие стало семьёй. Никто не удивился.",
  "curze:assassin":"График работы ночной, отзывы о работе спорные. Пророчества сбываются по расписанию.",
  "curze:silence":"Видит будущее у всех, кроме тех, кто рядом. Рядом тихо, и это впервые устраивает.",
  "curze:underhive":"Вырос там, где свет выключают первым. Привык, что справедливость приходит ночью.",
  "magnus:chronicler":"Записывает всё, в том числе то, что ещё не произошло. Предупреждения на полях игнорируются.",
  "magnus:ratling":"Прицел с небольшим колдовским расширением. Попадания случаются раньше выстрелов.",
  "magnus:astropath":"Слышит всех сразу, а ещё то, чего слышать не стоило. Инспектор просит не вдаваться.",
  "magnus:psyker":"Талант есть, разрешение есть, рекомендация «не лезть в запретные книги» тоже есть. Читается как вызов.",
  "lorgar:chronicler":"Пишет с таким чувством, что читатели начинают верить написанному. Редактор просит умерить пыл.",
  "lorgar:adept":"Любую инструкцию превращает в священный текст. Теперь на неё ссылаются все, а читал никто.",
  "lorgar:preacher":"Проповедует так, что слушатели записываются на следующую. Остановиться после первой не получается.",
  "lorgar:sororitas":"Вера плюс огнемёт даёт хорошую статистику. Инспектор на всякий случай крестится.",
  "horus:guard":"Лучший в роте, любимец командира, пример для всех. Досье пухнет от грамот, инспектор листает с тревогой.",
  "horus:knight":"Первый среди равных и всегда рядом с командованием. Иногда стоит проверять, о чём там шепчутся.",
  "horus:commissar":"Вся рота за него горой, комиссар тоже. Рапорт о благонадёжности подписан сразу и без вопросов, и это как раз настораживает.",
  "dorn:adept":"Каждую форму заполняет и подшивает лично. Стол защищён лучше среднего форпоста.",
  "dorn:agri":"Огород обнесён стеной в три ряда. Урожай в безопасности, соседи тоже: подойти они не могут.",
  "dorn:arbitrator":"Закон есть закон, стена есть стена. Нарушителей встречают оба.",
  "guilliman:adept":"На каждый случай есть параграф, на каждый параграф есть приложение. Начальство довольно, подчинённые носят очки.",
  "guilliman:guard":"Командует по уставу, который сам написал. Спорить неудобно и, увы, бесполезно.",
  "guilliman:governor":"Правит так, что налоги платят с удовольствием. Это подозрительно.",
  "guilliman:navy":"План на пять лет, запасной план на двадцать, чай по расписанию.",
  "lion:knight":"Верен присяге и долго помнит обиды. Разговор по душам запланирован на следующий век.",
  "lion:guard":"Стоит на позиции дольше всех и молчит о причинах. Начальство уверено, что причины есть.",
  "fulgrim:knight":"Доспех блестит, герб сверкает, поза безупречна. Бой отложен до конца фотосессии.",
  "fulgrim:adept":"Формы заполнены каллиграфическим почерком. Принять нельзя: слишком красиво для печати.",
  "fulgrim:trader":"Лучшие вещи, лучшие сделки, лучшие манеры. Патент выдан на всё красивое.",
  "perturabo:adept":"Работает без ошибок и без благодарностей. Обиды подшиты в приложении с четвёртого по девятое.",
  "perturabo:guard":"Окоп вырыт идеально. Остальные окопы выглядят хуже, что вызывает у автора глубокое неудовольствие.",
  "perturabo:techpriest":"Строит, чинит, улучшает. Благодарности не ждёт, улучшения принимает.",
  "russ:ogryn":"Громок, весел и очень надёжен. Соседи просили вести себя потише, но не слишком настойчиво.",
  "russ:agri":"Хозяйство процветает, праздники тоже. Урожай идёт на пиво, пиво идёт на урожай.",
  "russ:trader":"Торгует с размахом, шумом и пивом. Договоры подписывает кружкой.",
  "ferrus:knight":"Бронёй гордится больше, чем собой. Любую вмятину воспринимает лично.",
  "ferrus:adept":"Чинит всё, что оказывается рядом, в том числе то, что чинить не просили.",
  "ferrus:techpriest":"Металл любит, живых терпит. Руки как у станка, точность лучше.",
  "angron:ogryn":"Шума много, пользы ещё больше. Спорить не рекомендуется, прятаться тоже.",
  "angron:guard":"В атаку идёт раньше, чем получен приказ. Приказ догоняет в тот же день.",
  "angron:genecult":"Пришёл на тайное собрание и предложил начать восстание прямо сейчас. Кружок согласился, повестка отменена.",
  "mortarion:agri":"Урожай всходит, несмотря на почву. Почва хотела бы возразить, но не может.",
  "mortarion:silence":"Работает без жалоб и без выходных. Тишина в кабинете такая, что слышно, как стареют бумаги.",
  "vulkan:agri":"Выращивает на всех, делится со всеми, чинит соседям инвентарь. Заключение: хороший человек.",
  "vulkan:hospitaller":"Лечит, кормит и чинит то, что ещё не сломалось. Рекомендовано беречь.",
  "vulkan:underhive":"Выживает сам, подкармливает соседей и чинит чужие двери. Район его не отпустит.",
  "khan:ratling":"Стреляет на ходу и всегда попадает. Остановить нельзя, догнать тоже.",
  "khan:guard":"Быстрые вылазки, короткие доклады, длинные степи. Командование не успевает отслеживать маршрут.",
  "khan:trader":"Был везде, ничего не должен. Патент хранится в седле."
};

/* Для остальных пар заключение собирается из двух кусочков: про кровь и про роль */
var BLOOD_LINE={
  sanguinius:"Благородство передалось по крови, усталость тоже.",
  corax:"Тишину любит, лишние вопросы не любит.",
  alpharius:"В деле числится, но не всегда там, где записано.",
  curze:"Справедливость любит строгую, свет в комнате выключает первым.",
  magnus:"Тянется к знаниям, которые лучше не трогать.",
  lorgar:"Верит искренне и убедительно, в том числе в то, во что не стоило.",
  horus:"Умеет вести за собой. Куда именно, проверяют не всегда.",
  dorn:"Держит оборону там, где никто не просил, и не отступает.",
  guilliman:"Планирует на годы вперёд и не скрывает, что план уже готов.",
  lion:"О главном молчит, обиды помнит дольше положенного.",
  fulgrim:"Хочет, чтобы всё было безупречно, и себя в том числе.",
  perturabo:"Работает без ошибок и ждёт, что это заметят.",
  russ:"Громко празднует и крепко держит слово.",
  ferrus:"Металл уважает, честный труд тоже, живых по настроению.",
  angron:"Нрав горячий, спина прямая, терпение на исходе.",
  mortarion:"Терпелив до упрямства, жалуется редко, выносит всё.",
  vulkan:"Помогает, кому нужно, и благодарности не ждёт.",
  khan:"Соображает быстро, двигается быстро, на месте не задерживается.",
  emperor:"Родословная засекречена выше уровня допуска инспектора."
};
var ROLE_LINE={
  adept:"На службе подшивает всё, что движется, и половину того, что нет.",
  guard:"В строю терпелив, в окопе практичен.",
  commissar:"На службе следит за дисциплиной, чужой и собственной.",
  techpriest:"С машинами находит общий язык быстрее, чем с людьми.",
  inquisitor:"Допуск выдан такой, что документы на него хранятся отдельно.",
  sororitas:"Служит верой, огнём и без лишних вопросов.",
  preacher:"С кафедры говорит так, что в зале становится тихо.",
  trader:"Торгует по патенту, договорённости оформляет по настроению.",
  navigator:"Ведёт корабли там, где нет карт. Как именно, объяснить не берётся.",
  astropath:"Принимает чужие мысли и пересказывает самые тихие.",
  arbitrator:"Следит за порядком и знает, где в законе поправки.",
  assassin:"Работает без свидетелей, отчёты сдаёт самые короткие.",
  governor:"Правит планетой, держит отчёты в порядке, чай пьёт по расписанию.",
  hospitaller:"Лечит, выслушивает и сам по ночам не спит.",
  underhive:"Живёт на нижних уровнях и выживает лучше, чем верхние.",
  navy:"На мостике спокоен, в каюте всё записывает в журнал.",
  psyker:"Талантом пользуется по разрешению, хотя иногда забывает спросить.",
  genecult:"Состоит в кружке по интересам, о котором лучше не распространяться.",
  ogryn:"Исполняет приказы дословно, поэтому формулировать их надо осторожно.",
  ratling:"Рост маленький, меткость большая, обед строго по расписанию.",
  silence:"Рядом с таким человеком становится тише, и обычно это к лучшему.",
  knight:"Честь, герб и шагоход размером с дом.",
  agri:"Кормит всех остальных и в благодарностях не нуждается.",
  chronicler:"Хранит историю и свежие сплетни в одном архиве.",
  custodian:"Стоит в золоте и не отступает ни на шаг.",
  servitor:"Вопросов не задаёт, задачи выполняет.",
  skitarius:"Движется быстро, думает по алгоритму."
};
function conclusion(b,r){
  var t=PAIRS[b.id+":"+r.id];
  if(t) return t;
  var p=BLOOD_LINE[b.id], q=ROLE_LINE[r.id];
  if(p&&q) return p+" "+q;
  return q||p||"";
}

/* ---------- Состояние дела ---------- */
function getState(){
  var b=ls(KROV_KEY), r=ls(IMP_KEY);
  b=(b&&b.id&&BLOOD_IDS.indexOf(b.id)>=0)?b:null;
  r=(r&&r.id&&ROLE_ART[r.id])?r:null;
  return {blood:b, role:r, full:!!(b&&r), any:!!(b||r)};
}
function caseNo(st){
  var s=(st.blood?st.blood.id:"-")+"|"+(st.role?st.role.id:"-"), h=7, i;
  for(i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))%9973;
  return "Дело № 77-Б-"+String(1000+h%9000);
}

/* ---------- Шрифты ---------- */
var fontsP=null;
function loadFonts(){
  if(fontsP) return fontsP;
  if(!document.getElementById("delo-fonts")){
    var l=document.createElement("link"); l.id="delo-fonts"; l.rel="stylesheet";
    l.href="https://fonts.googleapis.com/css2?family=Alegreya+SC:wght@800&family=JetBrains+Mono:wght@500&family=PT+Serif:ital@1&display=swap";
    document.head.appendChild(l);
  }
  var tasks=[];
  if(document.fonts&&document.fonts.load){
    ['800 40px "Alegreya SC"','500 28px "JetBrains Mono"','italic 40px "PT Serif"'].forEach(function(f){ tasks.push(document.fonts.load(f,"Аау").catch(function(){})); });
  }
  var timeout=new Promise(function(res){ setTimeout(res,3000); });
  fontsP=Promise.race([Promise.all(tasks),timeout]);
  return fontsP;
}
function loadImg(src){ return new Promise(function(res){ var im=new Image(); im.onload=function(){res(im);}; im.onerror=function(){res(null);}; im.src=src; }); }

/* ---------- Рисование карточки 1080×1920 ---------- */
var SC='"Alegreya SC", Georgia, serif', MONO='"JetBrains Mono", monospace', SERIF='"PT Serif", Georgia, serif';
function wrapLines(x,text,maxW){ var words=text.split(" "),line="",out=[]; words.forEach(function(w){ var t=line?line+" "+w:w; if(x.measureText(t).width>maxW&&line){ out.push(line); line=w; } else line=t; }); out.push(line); return out; }
/* Alegreya SC: малая «у» похожа на латинскую Y — рисуем её уменьшенной заглавной У */
function fillSC(x,t,cx,y,fs){
  var F=function(z){ return "800 "+z+"px "+SC; }, parts=t.split("у"), w=0, i, al=x.textAlign;
  for(i=0;i<parts.length;i++){ x.font=F(fs); w+=x.measureText(parts[i]).width; if(i<parts.length-1){ x.font=F(fs*0.76); w+=x.measureText("У").width; } }
  x.textAlign="left"; var px=cx-w/2;
  for(i=0;i<parts.length;i++){ x.font=F(fs); x.fillText(parts[i],px,y); px+=x.measureText(parts[i]).width; if(i<parts.length-1){ x.font=F(fs*0.76); x.fillText("У",px,y); px+=x.measureText("У").width; } }
  x.textAlign=al; x.font=F(fs);
}
function coverDraw(x,img,rx,ry,rw,rh){ var s=Math.max(rw/img.width,rh/img.height); x.save(); x.beginPath(); x.rect(rx,ry,rw,rh); x.clip(); x.drawImage(img,rx+(rw-img.width*s)/2,ry+(rh-img.height*s)/2,img.width*s,img.height*s); x.restore(); }
function fitName(x,text,maxW,maxLines){
  var fs=50, lines;
  for(;fs>=28;fs-=2){ x.font="800 "+fs+"px "+SC; lines=wrapLines(x,text,maxW); var ok=lines.length<=maxLines; lines.forEach(function(l){ if(x.measureText(l).width>maxW) ok=false; }); if(ok) break; }
  return {fs:fs,lines:lines};
}
function panel(x,rx,ry,pw,ph,img,emptyLabel){
  if(img){
    coverDraw(x,img,rx,ry,pw,ph);
    var g=x.createLinearGradient(0,ry+ph*0.6,0,ry+ph); g.addColorStop(0,"rgba(13,11,9,0)"); g.addColorStop(1,"rgba(13,11,9,.55)"); x.fillStyle=g; x.fillRect(rx,ry,pw,ph);
    x.strokeStyle="#8f6e2c"; x.lineWidth=3; x.strokeRect(rx,ry,pw,ph);
  } else {
    x.fillStyle="#17130f"; x.fillRect(rx,ry,pw,ph);
    x.save(); x.setLineDash([14,12]); x.strokeStyle="#5a4a35"; x.lineWidth=3; x.strokeRect(rx+1.5,ry+1.5,pw-3,ph-3); x.restore();
    x.textAlign="center"; x.fillStyle="#5a4a35"; x.font="800 220px "+SC; x.fillText("?",rx+pw/2,ry+ph/2+60);
    x.fillStyle="#a2967f"; x.font="500 24px "+MONO; x.fillText(emptyLabel,rx+pw/2,ry+ph-60);
  }
}
function caption(x,cx,y,label,name,pw,empty){
  x.textAlign="center"; x.fillStyle="#a2967f"; x.font="500 26px "+MONO; x.fillText(label,cx,y);
  if(empty){ x.fillStyle="#5a4a35"; x.font="800 44px "+SC; fillSC(x,"не определена",cx,y+62,44); return; }
  var f=fitName(x,name,pw,2); x.fillStyle="#ebe1cc";
  f.lines.forEach(function(l,i){ fillSC(x,l,cx,y+62+i*(f.fs*1.08),f.fs); });
}
function makeCard(st,imgB,imgR){
  var W=1080,H=1920,c=document.createElement("canvas"); c.width=W; c.height=H; var x=c.getContext("2d");
  x.fillStyle="#0d0b09"; x.fillRect(0,0,W,H);
  var bg=x.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#17130e"); bg.addColorStop(1,"#0d0b09"); x.fillStyle=bg; x.fillRect(0,0,W,H);
  x.strokeStyle="#8f6e2c"; x.lineWidth=3; x.strokeRect(40,40,W-80,H-80); x.strokeStyle="#3a3027"; x.lineWidth=2; x.strokeRect(56,56,W-112,H-112);
  x.textAlign="center";
  x.fillStyle="#a2967f"; x.font="500 28px "+MONO; x.fillText("АДМИНИСТРАТУМ · ОТДЕЛ РАСПРЕДЕЛЕНИЯ",W/2,136);
  x.fillStyle="#ebe1cc"; x.font="800 124px "+SC; fillSC(x,"Личное дело",W/2,270,124);
  x.fillStyle="#cfa752"; x.font="500 30px "+MONO; x.fillText(caseNo(st).toUpperCase(),W/2,334);
  var pw=424,ph=590,gap=40,x0=(W-2*pw-gap)/2,y0=392;
  panel(x,x0,y0,pw,ph,st.blood?imgB:null,"КРОВЬ НЕ УСТАНОВЛЕНА");
  panel(x,x0+pw+gap,y0,pw,ph,st.role?imgR:null,"РОЛЬ НЕ УКАЗАНА");
  var cy=y0+ph+62;
  caption(x,x0+pw/2,cy,"КРОВЬ ПРИМАРХА",st.blood?st.blood.n:"",pw,!st.blood);
  caption(x,x0+pw+gap+pw/2,cy,"РОЛЬ",st.role?st.role.n:"",pw,!st.role);
  /* разделитель */
  x.strokeStyle="#3a3027"; x.lineWidth=2; x.beginPath(); x.moveTo(96,1216); x.lineTo(W-96,1216); x.stroke();
  x.fillStyle="#cfa752"; x.font="500 28px "+MONO; x.fillText("ЗАКЛЮЧЕНИЕ ИНСПЕКТОРА",W/2,1282);
  var txt=st.full?conclusion(st.blood,st.role)
    :(st.blood?"Заключение не составлено: в деле нет роли. Её определяет вторая часть серии."
              :"Заключение не составлено: в деле нет крови. Её определяет первая часть серии.");
  var fs=52, lines, maxW=W-200;
  for(;fs>=34;fs-=2){ x.font="italic "+fs+"px "+SERIF; lines=wrapLines(x,txt,maxW); if(lines.length<=5) break; }
  x.fillStyle="#ebe1cc"; x.font="italic "+fs+"px "+SERIF;
  var lh=Math.round(fs*1.42), ty=1368;
  lines.forEach(function(l,i){ x.fillText(l,W/2,ty+i*lh); });
  /* низ карточки: заполненность и призыв */
  var done=(st.blood?1:0)+(st.role?1:0), by=1712, bw=120, bx=W/2-bw-12;
  for(var i=0;i<2;i++){ x.fillStyle=i<done?"#cfa752":"#2a231b"; x.fillRect(bx+i*(bw+24),by,bw,10); }
  x.fillStyle="#a2967f"; x.font="500 26px "+MONO; x.fillText("ДЕЛО ЗАПОЛНЕНО: "+done+" ИЗ 2",W/2,by+54);
  x.fillStyle="#b8342c"; x.font="500 30px "+MONO; x.fillText(st.full?"А что в твоём деле?":"Собери дело целиком",W/2,H-92);
  return c;
}
function buildCard(st){
  return loadFonts().then(function(){
    return Promise.all([st.blood?loadImg(bloodArt(st.blood.id)):null, st.role?loadImg(roleArt(st.role.id)):null]);
  }).then(function(im){ return makeCard(st,im[0],im[1]); });
}

/* ---------- Блок на странице ---------- */
function injectCSS(){
  if(document.getElementById("delo-css")) return;
  var s=document.createElement("style"); s.id="delo-css";
  s.textContent=
  ".delo{margin:34px 0 22px;border:1px solid #8f6e2c;background:rgba(29,25,19,.92);padding:20px 20px 22px;color:#ebe1cc}"+
  ".delo[hidden]{display:none}"+
  ".delo-eyebrow{font:500 13px/1.4 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#a2967f}"+
  ".delo h3{font:800 32px/1.05 'Alegreya SC',Georgia,serif;margin:6px 0 10px;color:#ebe1cc}"+
  ".delo p{margin:0 0 14px;font-size:17px;line-height:1.5}"+
  ".delo-row{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start}"+
  ".delo-img{display:block;width:min(100%,300px);aspect-ratio:9/16;background:#14110d;border:1px solid #3a3027;object-fit:contain}"+
  ".delo-side{flex:1 1 240px;min-width:0}"+
  ".delo-btns{display:flex;flex-wrap:wrap;gap:10px;align-items:center}"+
  ".delo-btn{display:inline-flex;align-items:center;border:1px solid #cfa752;background:#cfa752;color:#1a140a;font:700 17px/1 'Alegreya SC',Georgia,serif;letter-spacing:.04em;padding:12px 22px 13px;cursor:pointer;text-decoration:none}"+
  ".delo-btn.ghost{background:transparent;color:#cfa752}"+
  ".delo-btn:focus-visible{outline:2px solid #cfa752;outline-offset:3px}"+
  ".delo-note{font-size:14px;color:#a2967f;margin-top:12px}";
  document.head.appendChild(s);
}
function mk(tag,cls,txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }
function canShareFiles(){ try{ return !!(window.matchMedia&&matchMedia("(pointer: coarse)").matches)&&!!navigator.canShare&&navigator.canShare({files:[new File([""],"a.png",{type:"image/png"})]}); }catch(e){ return false; } }

var mountSeq=0;
function mount(el,opts){
  if(!el) return;
  opts=opts||{};
  var st=getState();
  if(!st.any){ el.hidden=true; el.innerHTML=""; return; }
  injectCSS();
  var seq=++mountSeq;
  el.hidden=false; el.className="delo"; el.innerHTML="";
  el.appendChild(mk("div","delo-eyebrow","Серия тестов · общее дело"));
  el.appendChild(mk("h3",null,"Личное дело"));
  var lead=st.full?"Кровь и роль собраны в одном деле. Сохрани карточку и отправь тем, кто ещё не проходил."
    :(st.blood?"Дело заполнено наполовину: кровь установлена, а роли в нём нет. Пройди вторую часть, и инспектор составит заключение."
              :"Дело заполнено наполовину: роль есть, а чья в тебе кровь, неизвестно. Пройди первую часть, и инспектор составит заключение.");
  el.appendChild(mk("p",null,lead));
  var row=mk("div","delo-row"), img=mk("img","delo-img"); img.alt="Карточка «Личное дело»"; row.appendChild(img);
  var side=mk("div","delo-side"), btns=mk("div","delo-btns"), save=mk("button","delo-btn","Сохранить карточку"); save.type="button"; save.disabled=true;
  btns.appendChild(save);
  if(!st.full){
    var a=mk("a","delo-btn ghost",st.blood?"Пройти вторую часть":"Пройти первую часть");
    a.href=BASE+(st.blood?"imperium/"+carry():"krov-primarhov/"); a.addEventListener("click",function(){ track("to_"+(st.blood?"imperium":"krov")); });
    btns.appendChild(a);
  }
  side.appendChild(btns);
  var note=mk("p","delo-note","Собираю дело…"); side.appendChild(note);
  row.appendChild(side); el.appendChild(row);
  buildCard(st).then(function(canvas){
    if(seq!==mountSeq) return;
    var url=canvas.toDataURL("image/png"); img.src=url; note.textContent="Картинка 9:16 для сторис. На телефоне можно нажать на неё и удерживать.";
    save.disabled=false;
    save.addEventListener("click",function(){
      track("save");
      canvas.toBlob(function(b){
        if(!b) return;
        var file=null; try{ file=new File([b],"lichnoe-delo.png",{type:"image/png"}); }catch(e){}
        if(file&&canShareFiles()){ navigator.share({files:[file]}).catch(function(){}); return; }
        var u=URL.createObjectURL(b), dl=document.createElement("a"); dl.href=u; dl.download="lichnoe-delo.png"; document.body.appendChild(dl); dl.click(); dl.remove(); setTimeout(function(){ URL.revokeObjectURL(u); },4000);
      },"image/png");
    });
    if(opts.onReady) opts.onReady(st);
  }).catch(function(){ if(seq===mountSeq) note.textContent="Не удалось собрать картинку. Обнови страницу."; });
}

window.DELO={mount:mount,carry:carry,state:getState,conclusion:conclusion,pairs:PAIRS,bloodLine:BLOOD_LINE,roleLine:ROLE_LINE,build:buildCard};
})();
