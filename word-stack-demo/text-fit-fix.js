(()=>{
  const canvas=document.createElement('canvas');
  const ctx=canvas.getContext('2d');
  let raf=0;

  function isCJK(text){return /[\u3400-\u9fff]/.test(text)}

  function fitOne(span){
    const box=span.parentElement;
    if(!box)return;
    const isSlot=box.classList.contains('slot');
    const text=(span.textContent||'').trim();
    if(!text)return;

    // slot 原本是 static。内部文字使用 absolute 时必须先建立自己的定位上下文，
    // 否则文字会相对 gameStage 定位，点击卡片后就会“飘”到棋盘中央。
    if(isSlot)box.style.setProperty('position','relative','important');

    box.style.setProperty('overflow','hidden','important');
    box.style.setProperty('padding','0','important');
    span.style.setProperty('position','absolute','important');
    span.style.setProperty('inset',isSlot?'3px':'12px','important');
    span.style.setProperty('display','flex','important');
    span.style.setProperty('align-items','center','important');
    span.style.setProperty('justify-content','center','important');
    span.style.setProperty('text-align','center','important');
    span.style.setProperty('box-sizing','border-box','important');
    span.style.setProperty('max-width','none','important');
    span.style.setProperty('width','auto','important');
    span.style.setProperty('height','auto','important');
    span.style.setProperty('margin','0','important');
    span.style.setProperty('padding','0','important');
    span.style.setProperty('overflow','hidden','important');
    span.style.setProperty('line-height','1.02','important');
    span.style.setProperty('pointer-events','none','important');

    const rect=box.getBoundingClientRect();
    const available=Math.max(16,(box.clientWidth||rect.width)-(isSlot?6:24));
    const max=isSlot?13:21;
    const min=isSlot?7:9;
    const style=getComputedStyle(box);
    const family=style.fontFamily||'sans-serif';
    const weight=style.fontWeight||'900';

    // Canvas 精确测量文字宽度，直接计算字号，不再依赖 scrollWidth。
    ctx.font=`${weight} ${max}px ${family}`;
    const measured=Math.max(1,ctx.measureText(text).width);
    let size=Math.min(max,max*(available/measured)*0.93);

    // 中文短词保持正常字号；英文/音标按实际宽度计算。
    if(isCJK(text)&&text.length<=4)size=Math.min(max,Math.max(size,17));

    if(size>=min){
      span.style.setProperty('font-size',`${Math.floor(size*10)/10}px`,'important');
      span.style.setProperty('white-space','nowrap','important');
      span.style.setProperty('word-break','normal','important');
      span.style.setProperty('overflow-wrap','normal','important');
      return;
    }

    // 超长内容兜底为最多两行，任何情况下都不允许越出卡片。
    span.style.setProperty('font-size',`${min}px`,'important');
    span.style.setProperty('white-space','normal','important');
    span.style.setProperty('word-break','break-all','important');
    span.style.setProperty('overflow-wrap','anywhere','important');
  }

  function applyAll(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{
      document.querySelectorAll('.tile .fitText,.slot .fitText').forEach(fitOne);
    });
  }

  const observer=new MutationObserver(applyAll);
  observer.observe(document.body,{subtree:true,childList:true});
  window.addEventListener('resize',applyAll,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(applyAll,120),{passive:true});
  document.addEventListener('click',()=>setTimeout(applyAll,0),true);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(applyAll);
  applyAll();
})();