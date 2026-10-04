export function mountStages(milestones){
  const hero=document.querySelector('.hero'),exhibit=document.querySelector('.exhibit'),closing=document.querySelector('.closing');
  closing.append(document.querySelector('footer'));
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
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let current=-1,animation=null;
  function indexFromHash(){let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return 0}if(id==='timeline')return 1;if(id==='about')return nodes.length+1;const i=milestones.findIndex(m=>m.id===id);return i<0?0:i+1;}
  function render(index,animate=true){
    index=Math.max(0,Math.min(nodes.length+1,index));if(index===current)return;
    const direction=index>current?1:-1;
    if(current>0&&current<=nodes.length)nodes[current-1].querySelectorAll('.lab-content').forEach(el=>el.dispatchEvent(new Event('stageleave')));
    animation?.cancel();current=index;
    hero.hidden=index!==0;closing.hidden=index!==nodes.length+1;exhibit.hidden=index===0||index===nodes.length+1;
    nodes.forEach((node,i)=>node.hidden=i!==index-1);
    const data=milestones[index-1];
    chapters.forEach(chapter=>chapter.hidden=chapter.dataset.era!==data?.era);
    document.querySelectorAll('.era-link').forEach(link=>{const active=link.dataset.era===data?.era;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    document.querySelector('#reading-progress').textContent=data?`${String(index).padStart(2,'0')} / 18`:index===0?'序章':'尾声';
    document.querySelector('#progress-bar').style.width=`${Math.min(index,nodes.length)/nodes.length*100}%`;
    document.querySelector('#stage-counter').textContent=data?`${String(index).padStart(2,'0')} / 18`:index===0?'序章':'尾声';
    document.querySelector('#stage-title').textContent=data?`${data.year} · ${data.title}`:index===0?'智能，是怎样发生的？':'历史没有终点';
    previous.disabled=index===0;next.textContent=index===nodes.length+1?'回到开场':'下一阶段';
    const screen=index===0?hero:index===nodes.length+1?closing:nodes[index-1];
    hero.scrollTop=0;closing.scrollTop=0;document.querySelector('.chapters').scrollTop=0;exhibit.scrollTop=0;
    if(animate&&!reduced.matches&&screen.animate)animation=screen.animate([{opacity:0,transform:`translateX(${direction*22}px)`},{opacity:1,transform:'translateX(0)'}],{duration:300,easing:'cubic-bezier(.2,.7,.2,1)'});
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
