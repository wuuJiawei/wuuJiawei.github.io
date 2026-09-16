const screens=[...document.querySelectorAll('.screen')],tabs=[...document.querySelectorAll('.tabs [data-go]')],win=document.getElementById('win');
let selectedChapter=0,currentLevel=1,cards=[],slots=[],removed=new Set(),matchedGroups=0,currentWords=[];
const pile=document.getElementById('pile'),slotbox=document.getElementById('slots'),toast=document.getElementById('toast');

function go(n){screens.forEach(x=>x.classList.toggle('on',x.dataset.screen===n));tabs.forEach(x=>x.classList.toggle('on',x.dataset.go===n));win.classList.remove('show');if(n==='levels')renderLevels();if(n==='words')renderWordBook()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)go(b.dataset.go)});

function imgHTML(w,cls='noto'){return `<img class="${cls}" src="${NOTO}emoji_u${w.cp}.svg" alt="${w.emoji}" onerror="this.replaceWith(document.createTextNode('${w.emoji}'))">`}
function contentHTML(card){if(card.kind==='image')return imgHTML(card.word);return card.text}

// 文本卡片自适应：优先保持单行并缩小字体，仍放不下时再 break-all 换行。
function fitText(el,{max=21,min=11,padding=8,wrapMax=18}={}){
 el.style.overflow='hidden';
 el.style.textAlign='center';
 el.style.lineHeight='1.06';
 el.style.padding=`0 ${padding}px`;
 el.style.whiteSpace='nowrap';
 el.style.wordBreak='normal';
 el.style.overflowWrap='normal';
 let size=max;
 el.style.fontSize=size+'px';
 while(size>min&&el.scrollWidth>el.clientWidth){size--;el.style.fontSize=size+'px'}
 if(el.scrollWidth<=el.clientWidth)return;
 // 极长英文/音标允许断行，保证所有内容严格留在卡片内部。
 el.style.whiteSpace='normal';
 el.style.wordBreak='break-all';
 el.style.overflowWrap='anywhere';
 el.style.padding=`4px ${padding}px`;
 size=Math.min(wrapMax,max);
 el.style.fontSize=size+'px';
 while(size>min&&(el.scrollWidth>el.clientWidth||el.scrollHeight>el.clientHeight)){size--;el.style.fontSize=size+'px'}
}
function renderCardContent(el,card,isSlot=false){
 if(card.kind==='image'){
   el.innerHTML=imgHTML(card.word);
   el.style.overflow='hidden';
   return;
 }
 el.textContent=card.text;
 fitText(el,isSlot?{max:13,min:7,padding:3,wrapMax:11}:{max:21,min:11,padding:8,wrapMax:18});
}

function seeded(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(arr,rnd=Math.random){for(let i=arr.length-1;i>0;i--){let j=Math.floor(rnd()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}

function chapterWords(ch){return words.filter(w=>chapters[ch].cats.includes(w.cat))}
function renderChapters(){
 const box=document.getElementById('chapterTabs');
 box.innerHTML=chapters.map((c,i)=>`<button class="chapterTab ${i===selectedChapter?'on':''}" data-ch="${i}">${c.icon} ${c.short}</button>`).join('');
 box.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>{selectedChapter=+b.dataset.ch;renderLevels()});
}
function renderLevels(){
 renderChapters();
 const ch=chapters[selectedChapter],pool=chapterWords(selectedChapter),cfgs=levelConfigs.filter(l=>l.chapter===selectedChapter);
 document.getElementById('chapterTitle').textContent=ch.name;
 document.getElementById('chapterDesc').textContent=ch.desc;
 document.getElementById('chapterWords').textContent=pool.length;
 document.getElementById('chapterProgressText').textContent='Demo 4/4';
 document.getElementById('chapterProgress').style.width='100%';
 const grid=document.getElementById('grid');
 grid.innerHTML=cfgs.map(c=>`<button class="levelCard ${c.id===currentLevel?'current':''}" data-level="${c.id}"><strong>${c.id}</strong><span class="stars">★★★</span><small>${c.groups}组 · ${c.layers}层</small></button>`).join('');
 grid.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>startLevel(+b.dataset.level));
 const focus=levelConfigs.find(l=>l.id===currentLevel&&l.chapter===selectedChapter)||cfgs[0];
 const pct=[18,34,52,72,90][focus.difficulty];
 document.getElementById('difficultyBar').style.setProperty('--pct',pct+'%');
 document.getElementById('difficultyText').textContent=diffNames[focus.difficulty];
}
function formsFor(cfg,w,index){
 const image={kind:'image',word:w,text:w.emoji};
 const word={kind:'text',word:w,text:w.word.toUpperCase()};
 const meaning={kind:'text',word:w,text:w.meaning};
 const phonetic={kind:'text',word:w,text:w.phonetic};
 if(cfg.difficulty===0)return[image,word,meaning];
 if(cfg.difficulty===1)return index%2?[image,word,phonetic]:[image,word,meaning];
 if(cfg.difficulty===2)return index%3===0?[word,meaning,phonetic]:[image,word,phonetic];
 if(cfg.difficulty===3)return index%2?[word,meaning,phonetic]:[image,meaning,phonetic];
 const pool=[image,word,meaning,phonetic];shuffle(pool,seeded(cfg.seed+index*11));return pool.slice(0,3);
}
const layerPositions=[
 [[18,8],[112,8],[206,8],[300,8],[18,102],[112,102],[206,102],[300,102],[18,196],[112,196],[206,196],[300,196],[18,290],[112,290],[206,290],[300,290],[65,384],[253,384]],
 [[65,55],[159,55],[253,55],[65,149],[159,149],[253,149],[65,243],[159,243],[253,243],[112,337],[206,337]],
 [[112,102],[206,102],[112,196],[206,196],[112,290],[206,290],[159,384]],
 [[159,149],[112,243],[206,243],[159,337]]
];
function buildCards(cfg){
 const rnd=seeded(cfg.seed),pool=shuffle([...chapterWords(cfg.chapter)],rnd).slice(0,cfg.groups);
 currentWords=pool;
 let groupsByLayer=Array.from({length:cfg.layers},()=>[]);
 pool.forEach((w,i)=>{let z=Math.min(cfg.layers-1,Math.floor(i*cfg.layers/pool.length));groupsByLayer[z].push({w,i})});
 let result=[];
 groupsByLayer.forEach((items,z)=>{
   let pos=shuffle([...(layerPositions[Math.min(z,layerPositions.length-1)]||layerPositions[0])],rnd),pi=0;
   items.forEach(({w,i})=>{
     let forms=formsFor(cfg,w,i);
     forms.forEach((f,k)=>{
       let p=pos[pi++ % pos.length];
       result.push({id:`${w.id}-${k}`,group:w.id,word:w,kind:f.kind,text:f.text,x:p[0],y:p[1],z,color:['g','p','y','b','v','be'][(i+k+z)%6]});
     });
   });
 });
 return result;
}
function overlaps(a,b){return !(a.x+80<=b.x+12||b.x+80<=a.x+12||a.y+80<=b.y+12||b.y+80<=a.y+12)}
function isCovered(i){
 const a=cards[i];if(removed.has(i))return false;
 return cards.some((b,j)=>j!==i&&!removed.has(j)&&b.z>a.z&&overlaps(a,b));
}

// 棋盘节点只在换关时创建一次。点击卡片时仅更新状态，避免整棵 DOM 重建导致文字重新缩放和卡片抖动。
function ensureBoardNodes(){
 const stable=pile.children.length===cards.length&&cards.every((c,i)=>pile.children[i]?.dataset.cardId===c.id);
 if(stable)return;
 pile.innerHTML='';
 cards.forEach((c,i)=>{
   const b=document.createElement('button');
   b.dataset.cardId=c.id;
   b.className=`tile ${c.color}`;
   b.onclick=()=>pick(i);
   pile.appendChild(b);
   renderCardContent(b,c,false);
 });
}
function draw(){
 ensureBoardNodes();
 cards.forEach((c,i)=>{
   const b=pile.children[i],covered=isCovered(i);
   const long=c.kind==='text'&&c.text.length>8;
   b.className=`tile ${c.color} ${covered?'covered':''} ${removed.has(i)?'gone':''} ${long?'wordLong':''}`;
   b.style.left=`calc(${c.x}/410 * 100%)`;
   b.style.top=c.y+'px';
   b.style.zIndex=c.z+10;
 });
 slotbox.innerHTML='';
 for(let i=0;i<7;i++){
   let d=document.createElement('div'),idx=slots[i],has=idx!==undefined;
   d.className='slot '+(has?'has ':'')+(has&&cards[idx].kind==='text'&&cards[idx].text.length>7?'long':'');
   slotbox.appendChild(d);if(has)renderCardContent(d,cards[idx],true)
 }
 const cfg=levelConfigs[currentLevel-1],pct=Math.round(matchedGroups/cfg.groups*100);
 document.getElementById('levelProgress').style.width=pct+'%';
 document.getElementById('levelProgressText').textContent=`${matchedGroups}/${cfg.groups}`;
}
function showToast(t){toast.textContent=t;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1200)}
function pick(i){
 if(removed.has(i))return;
 if(isCovered(i)){showToast('这张卡还被上层卡片压住');return}
 if(slots.length>=7){showToast('预选槽已满');return}
 removed.add(i);slots.push(i);draw();match();
 if(slots.length>=7)setTimeout(()=>{if(slots.length>=7){showToast('槽位已满，使用撤回或重新开始');}},120)
}
function match(){
 const count={};slots.forEach(i=>count[cards[i].group]=(count[cards[i].group]||0)+1);
 const hit=Object.keys(count).find(k=>count[k]>=3);if(!hit)return;
 setTimeout(()=>{
   let n=3;slots=slots.filter(i=>{if(cards[i].group===hit&&n){n--;return false}return true});
   matchedGroups++;draw();
   const w=words.find(x=>x.id===hit),s=document.getElementById('success');
   s.textContent=`${w.word.toUpperCase()} × 3  消除成功`;s.classList.add('show');speak(w.word);
   setTimeout(()=>s.classList.remove('show'),1000);
   if(removed.size===cards.length)setTimeout(showWin,600)
 },180)
}
function startLevel(id){
 currentLevel=id;selectedChapter=levelConfigs[id-1].chapter;
 const cfg=levelConfigs[id-1];cards=buildCards(cfg);slots=[];removed=new Set();matchedGroups=0;
 pile.innerHTML='';
 document.getElementById('todayCount').textContent=chapterWords(cfg.chapter).length;
 document.getElementById('levelTitle').textContent=`第 ${id} 关`;
 document.getElementById('goalCount').textContent=cfg.groups;
 document.getElementById('stageTag').textContent=`${['🌱','🌿','🌟','🔥','🏆'][cfg.difficulty]} ${diffNames[cfg.difficulty]}`;
 draw();go('game')
}
function showWin(){
 const cfg=levelConfigs[currentLevel-1];
 document.getElementById('winLevel').textContent=`第 ${currentLevel} 关`;
 document.getElementById('winWords').textContent=cfg.groups;
 win.classList.add('show')
}
document.querySelector('[data-act=undo]').onclick=()=>{let i=slots.pop();if(i===undefined){showToast('当前没有可撤回的卡片');return}removed.delete(i);draw()};
document.querySelector('[data-act=hint]').onclick=()=>{
 const available=cards.map((c,i)=>({c,i})).filter(x=>!removed.has(x.i)&&!isCovered(x.i));
 const by={};available.forEach(x=>(by[x.c.group]??=[]).push(x.i));
 let ids=Object.values(by).sort((a,b)=>b.length-a.length)[0]||[];
 if(!ids.length){showToast('暂无可点击卡片');return}
 [...pile.children].forEach((e,i)=>{if(ids.includes(i))e.classList.add('hint')});
 setTimeout(()=>[...pile.children].forEach(e=>e.classList.remove('hint')),1800)
};
document.querySelector('[data-act=shuffle]').onclick=()=>{
 const zs=[...new Set(cards.filter((_,i)=>!removed.has(i)).map(c=>c.z))];
 zs.forEach(z=>{let ids=cards.map((c,i)=>c.z===z&&!removed.has(i)?i:-1).filter(i=>i>=0),ps=shuffle(ids.map(i=>[cards[i].x,cards[i].y]));ids.forEach((id,k)=>{cards[id].x=ps[k][0];cards[id].y=ps[k][1]})});draw();showToast('已重新排列当前卡片')
};
document.querySelector('[data-act=next]').onclick=()=>{let next=currentLevel>=levelConfigs.length?1:currentLevel+1;win.classList.remove('show');startLevel(next)};

function speak(text){if(!('speechSynthesis'in window))return;speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.86;speechSynthesis.speak(u)}
let wordFilter='全部',wordQuery='';
function renderWordTools(){
 const cats=['全部','动物','颜色','食物','生活','出行','自然'];
 document.getElementById('wordTools').innerHTML=cats.map(c=>`<button class="${c===wordFilter?'on':''}" data-wcat="${c}">${c}</button>`).join('');
 document.querySelectorAll('[data-wcat]').forEach(b=>b.onclick=()=>{wordFilter=b.dataset.wcat;renderWordBook()})
}
function renderWordBook(){
 renderWordTools();
 let list=words.filter(w=>(wordFilter==='全部'||w.cat===wordFilter)&&(!wordQuery||w.word.includes(wordQuery)||w.meaning.includes(wordQuery)));
 document.getElementById('wordCount').textContent=`共 ${list.length} 个词 · Demo 词库 ${words.length} 个`;
 document.getElementById('words').innerHTML=list.length?list.map((w,i)=>`<div class="word"><div class="pic">${imgHTML(w)}</div><div><strong>${w.word}</strong><small>${w.phonetic} · ${w.meaning}</small><span class="cat">${w.cat}</span></div><button class="circle speak" data-speak="${w.word}">🔊</button><button class="circle">${i<8?'⭐':'☆'}</button></div>`).join(''):'<div class="emptyWords">没有找到对应单词</div>';
 document.querySelectorAll('[data-speak]').forEach(b=>b.onclick=()=>speak(b.dataset.speak))
}
document.getElementById('wordSearch').addEventListener('input',e=>{wordQuery=e.target.value.trim().toLowerCase();renderWordBook()});

renderLevels();renderWordBook();startLevel(1);go('home');