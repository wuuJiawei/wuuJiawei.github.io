(async function(){
  const root=document.getElementById('pages-root');
  const parts=await Promise.all(['./pages-primary.html','./pages-secondary.html'].map(u=>fetch(u).then(r=>{if(!r.ok) throw new Error(u+' '+r.status); return r.text();})));
  root.innerHTML=parts.join('\n');
  const pages=[...document.querySelectorAll('.page')];
  const jumpBtns=[...document.querySelectorAll('[data-jump]')];
  const stack=['home-reco'];
  function show(name,push=true){
    pages.forEach(p=>p.classList.toggle('active',p.dataset.page===name));
    jumpBtns.forEach(b=>b.classList.toggle('active',b.dataset.jump===name));
    if(push&&stack[stack.length-1]!==name) stack.push(name);
  }
  function back(){if(stack.length>1){stack.pop();show(stack[stack.length-1],false)}}
  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-nav]'); if(nav){show(nav.dataset.nav);return;}
    const j=e.target.closest('[data-jump]'); if(j){show(j.dataset.jump);return;}
    const g=e.target.closest('[data-go]'); if(g){show(g.dataset.go);return;}
    const b=e.target.closest('[data-back]'); if(b){back();return;}
    const t=e.target.closest('[data-top-feed]'); if(t){show(t.dataset.topFeed==='reco'?'home-reco':'home-follow');return;}
  });
  show('home-reco',false);
})().catch(err=>{console.error(err);document.getElementById('pages-root').innerHTML='<div style="padding:80px 24px;font-family:sans-serif">Demo 加载失败，请刷新页面。</div>';});
