export function mountStages(milestones){
  const hero=document.querySelector('.hero'),exhibit=document.querySelector('.exhibit'),closing=document.querySelector('.closing');
  const nodes=[...document.querySelectorAll('.milestone')],chapters=[...document.querySelectorAll('.chapter')];
  nodes.forEach(node=>{
    const panel=document.createElement('div');panel.className='story-panel';
    [...node.children].filter(el=>!el.classList.contains('lab')).forEach(el=>panel.append(el));
    node.prepend(panel);node.classList.toggle('has-lab',!!node.querySelector('.lab'));
    node.querySelector('h3').tabIndex=-1;
  });
  // Historical background remains available within the relevant screen.
  document.querySelectorAll('.context-panel').forEach(panel=>{
    const details=document.createElement('details');details.className='context-details';
    const summary=document.createElement('summary');summary.textContent=panel.querySelector('h3').textContent;
    details.append(summary);[...panel.children].filter(el=>el.tagName!=='H3').forEach(el=>details.append(el));
    panel.closest('.chapter').querySelector('.story-panel').append(details);panel.remove();
  });
  const previous=document.querySelector('#previous-stage'),next=document.querySelector('#next-stage');
  let current=-1,animations=[],motionEnabled=true;
  const motionToggle=document.querySelector('#motion-toggle');
  try{motionEnabled=localStorage.getItem('ai-evolution-motion')!=='off';}catch{}
  function showMotionPreference(){motionToggle.textContent=motionEnabled?'转场：开':'转场：关';motionToggle.setAttribute('aria-pressed',String(motionEnabled));}
  showMotionPreference();
  motionToggle.onclick=()=>{motionEnabled=!motionEnabled;showMotionPreference();if(!motionEnabled)cancelTransition();try{localStorage.setItem('ai-evolution-motion',motionEnabled?'on':'off');}catch{}};
  const light=document.createElement('div');light.className='stage-light';light.setAttribute('aria-hidden','true');document.querySelector('main').append(light);
  function cancelTransition(){animations.forEach(animation=>animation.cancel());animations=[];}
  function transition(screen,direction){
    const compact=matchMedia('(max-width: 800px)').matches;
    const timing={duration:680,easing:'cubic-bezier(.16,1,.3,1)'};
    animations.push(screen.animate([
      {opacity:0,transform:`perspective(1200px) translate3d(${direction*36}px,12px,0) rotateY(${-direction*2}deg) scale(.975)`,filter:compact?'none':'blur(4px)'},
      {opacity:1,transform:'perspective(1200px) translate3d(0,0,0) rotateY(0deg) scale(1)',filter:compact?'none':'blur(0px)'}
    ],timing));
    const layers=screen.classList.contains('milestone')?[...screen.querySelectorAll('.story-panel > .milestone-heading,.story-panel > .tagline,.story-panel > .story,.lab')]:[...screen.children].filter(el=>el!==light);
    layers.slice(0,6).forEach((layer,i)=>animations.push(layer.animate([
      {opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}
    ],{...timing,duration:520,delay:Math.min(i*45,180),fill:'backwards'})));
    animations.push(light.animate([
      {opacity:0,transform:`translateX(${-direction*75}%) skewX(${-direction*12}deg)`},
      {opacity:.6,offset:.25},
      {opacity:0,transform:`translateX(${direction*100}%) skewX(${-direction*12}deg)`}
    ],{duration:760,easing:'cubic-bezier(.4,0,.2,1)'}));
  }
  function indexFromHash(){let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return 0}if(id==='timeline')return 1;if(id==='about')return nodes.length+1;const i=milestones.findIndex(m=>m.id===id);return i<0?0:i+1;}
  function render(index,animate=true){
    index=Math.max(0,Math.min(nodes.length+1,index));if(index===current)return;
    const direction=index>current?1:-1;
    if(current>0&&current<=nodes.length)nodes[current-1].querySelectorAll('.lab-content').forEach(el=>el.dispatchEvent(new Event('stageleave')));
    cancelTransition();current=index;
    hero.hidden=index!==0;closing.hidden=index!==nodes.length+1;exhibit.hidden=index===0||index===nodes.length+1;
    nodes.forEach((node,i)=>node.hidden=i!==index-1);
    const data=milestones[index-1];
    chapters.forEach(chapter=>chapter.hidden=chapter.dataset.era!==data?.era);
    document.querySelectorAll('.era-link').forEach(link=>{const active=link.dataset.era===data?.era;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    document.querySelector('#reading-progress').textContent=data?`${String(index).padStart(2,'0')} / 18`:index===0?'序章':'尾声';
    document.querySelector('#progress-bar').style.width=`${Math.min(index,nodes.length)/nodes.length*100}%`;
    document.querySelector('#stage-counter').textContent=data?`${String(index).padStart(2,'0')} / 18`:index===0?'序章':'尾声';
    document.querySelector('#stage-title').textContent=data?`${data.year} · ${data.title}`:index===0?'智能，是怎样发生的？':'想象开始有了回声';
    previous.disabled=index===0;next.textContent=index===nodes.length+1?'回到开场':'下一阶段';
    const screen=index===0?hero:index===nodes.length+1?closing:nodes[index-1];
    hero.scrollTop=0;closing.scrollTop=0;document.querySelector('.chapters').scrollTop=0;exhibit.scrollTop=0;
    if(animate&&motionEnabled&&screen.animate)transition(screen,direction);
    const active=document.querySelector('.era-link.active'),nav=document.querySelector('#era-navigation');
    if(active&&matchMedia('(max-width: 800px)').matches)nav.scrollLeft=Math.max(0,active.offsetLeft-nav.clientWidth/2+active.clientWidth/2);
  }
  function go(index){const id=index===0?'top':index===nodes.length+1?'about':milestones[index-1].id;history.pushState(null,'',`#${id}`);render(index);}
  previous.onclick=()=>go(current-1);next.onclick=()=>go(current===nodes.length+1?0:current+1);
  document.addEventListener('click',e=>{
    const link=e.target.closest('a[href^="#"]');if(!link||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    const hash=link.getAttribute('href'),id=hash.slice(1);const i=milestones.findIndex(m=>m.id===id);
    if(i<0&&!['top','timeline','about'].includes(id))return;
    e.preventDefault();go(id==='top'?0:id==='timeline'?1:id==='about'?nodes.length+1:i+1);
  });
  window.addEventListener('popstate',()=>render(indexFromHash()));window.addEventListener('hashchange',()=>render(indexFromHash()));
  render(indexFromHash(),false);
}
