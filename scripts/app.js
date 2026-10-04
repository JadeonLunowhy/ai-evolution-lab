import { eras, milestones, contexts } from './content.js';
import { mountExperiment } from './experiments.js';
import { mountStages } from './stages.js';

const externalIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10"/></svg>';
const sourceLink = ([label,url]) => `<a class="source-link" href="${url}" target="_blank" rel="noopener noreferrer">${label} ${externalIcon}<span class="hidden">（新窗口）</span></a>`;
const nav = document.querySelector('#era-navigation');
nav.innerHTML = eras.map(era => `<a class="era-link" href="#${milestones.find(m=>m.era===era.id).id}" data-era="${era.id}"><span>${era.years}</span><strong>${era.title}</strong></a>`).join('');

document.querySelector('#chapters').innerHTML = eras.map((era,ei) => {
  const context = contexts[era.id];
  return `<section class="chapter" data-color="${era.color}" data-era="${era.id}" aria-labelledby="chapter-${era.id}">
    <div class="chapter-heading"><div><span class="eyebrow">${era.en} / ${era.years}</span><h2 id="chapter-${era.id}">${era.title}</h2><p>${era.description}</p></div><span class="chapter-number" aria-hidden="true">${String(ei+1).padStart(2,'0')}</span></div>
    ${context?`<aside class="context-panel"><h3>${context.title}</h3><p>${context.text}</p>${sourceLink(context.source)}</aside>`:''}
    ${milestones.filter(m=>m.era===era.id).map(m=>{
      const index = milestones.indexOf(m)+1;
      return `<article class="milestone" id="${m.id}" data-era="${m.era}" data-index="${index}" aria-labelledby="title-${m.id}">
      <div class="milestone-heading"><span class="milestone-year">${m.year}</span><div><h3 id="title-${m.id}">${m.title}</h3><div class="milestone-en">${m.en}</div></div><span class="node-index">NODE ${String(index).padStart(2,'0')}</span></div>
      <p class="tagline">${m.tagline}</p><p class="story">${m.story}</p>
      ${m.lab?`<div class="lab" data-lab="${m.lab}"></div>`:''}
      <details class="knowledge-details"><summary>一分钟科普 · 原理、意义与边界</summary><div class="detail-grid"><div><h4>它怎样工作</h4><p>${m.mechanism}</p></div><div><h4>它改变了什么</h4><p>${m.impact}</p></div><div><h4>理解它的边界</h4><p>${m.limit}</p></div></div></details>
      ${sourceLink(m.source)}
      <details class="quiz"><summary>检验一下你的理解</summary><div class="quiz-box"><p class="quiz-question">${m.quiz[0]}</p><div class="quiz-options">${m.quiz[1].map((option,i)=>`<button type="button" data-option="${i}" aria-pressed="false">${option}</button>`).join('')}</div><p class="quiz-feedback" aria-live="polite"></p></div></details>
      </article>`;
    }).join('')}
  </section>`;
}).join('');

document.querySelectorAll('[data-lab]').forEach(root => mountExperiment(root,root.dataset.lab));
document.querySelectorAll('.quiz').forEach((root,i)=>{
  const data=milestones[i].quiz;
  root.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
    root.querySelectorAll('button').forEach(b=>{ b.classList.remove('correct','incorrect'); b.setAttribute('aria-pressed',String(b===button)); });
    const correct=Number(button.dataset.option)===data[2];
    button.classList.add(correct?'correct':'incorrect');
    root.querySelector('.quiz-feedback').textContent=`${correct?'理解正确。':'再想一想。'}${data[3]}`;
  }));
});

mountStages(milestones);

const ns='http://www.w3.org/2000/svg';
const layers=[[{x:80,y:105},{x:80,y:200},{x:80,y:295}],Array.from({length:5},(_,i)=>({x:225,y:70+i*65})),Array.from({length:5},(_,i)=>({x:365,y:70+i*65})),[{x:515,y:155},{x:515,y:245}]];
for(let l=0;l<layers.length-1;l++)for(const a of layers[l])for(const b of layers[l+1]){
  const line=document.createElementNS(ns,'line');line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);line.classList.add('network-edge');document.querySelector('#network-edges').append(line);
}
layers.flat().forEach((p,i)=>{
  const glow=document.createElementNS(ns,'circle');glow.setAttribute('cx',p.x);glow.setAttribute('cy',p.y);glow.setAttribute('r',24);glow.setAttribute('fill','url(#node-gradient)');
  const circle=document.createElementNS(ns,'circle');circle.setAttribute('cx',p.x);circle.setAttribute('cy',p.y);circle.setAttribute('r',9);circle.classList.add('network-node');
  const pulse=document.createElementNS(ns,'circle');pulse.setAttribute('cx',p.x);pulse.setAttribute('cy',p.y);pulse.setAttribute('r',3);pulse.classList.add('network-pulse');pulse.style.animationDelay=`${i*.27}s`;
  document.querySelector('#network-nodes').append(glow,circle,pulse);
});
