import { predict, perceptronStep, convolve, softmax, weightedContext, elizaReply, qStep, diffusionStep } from './algorithms.js';

const colors={bg:'#08121c',line:'#243647',ink:'#d7e4ed',muted:'#71879a',mint:'#62e0c8',amber:'#e9b769',violet:'#b7a0ef'};
const definitions={
  perceptron:['01','移动一条分类边界','修改数据或训练一次，观察参数怎样改变。','真实感知机更新 · 二维教学数据'],
  eliza:['02','拆开一句机器回复','输入一句话，再揭开它匹配到的规则。','中文版规则式教学改编 · 不复现原始全部脚本'],
  convolution:['03','让图像露出边缘','切换滤镜，点击像素，观察局部计算的结果。','真实二维互相关运算 · CNN 常用约定 · 非完整 AlexNet'],
  reinforcement:['04','奖励怎样改变行动','让智能体反复试错，再观察它学到的路线。','真实 Q-learning · 简化迷宫 · 非 AlphaGo 复现'],
  attention:['05','看见上下文的权重','选一个词，改变匹配强度，观察信息怎样汇聚。','人工构造的分数与向量 · 真实 softmax 和加权汇总'],
  diffusion:['06','从噪声中找回结构','拖动步骤，观察同一个样本逐步去噪。','有限数字数据上的精确贝叶斯去噪＋DDIM 式更新 · 非 Stable Diffusion']
};

export function mountExperiment(root,kind){
  const [index,title,description,caption]=definitions[kind];
  root.innerHTML=`<div class="lab-header"><span class="lab-label">LAB ${index}<strong>${title}</strong></span><span class="lab-badge">交互实验</span></div><div class="lab-body"><p class="lab-description">${description}</p><div class="lab-content"></div></div><div class="lab-caption">${caption}</div>`;
  const mount={perceptron:mountPerceptron,eliza:mountEliza,convolution:mountConvolution,reinforcement:mountReinforcement,attention:mountAttention,diffusion:mountDiffusion}[kind];
  mount(root.querySelector('.lab-content'));
}

function rng(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;}}
function clear(ctx,w,h){ctx.fillStyle=colors.bg;ctx.fillRect(0,0,w,h);}
function grid(ctx,w,h,spacing=40){ctx.strokeStyle=colors.line;ctx.lineWidth=.6;for(let x=spacing;x<w;x+=spacing){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=spacing;y<h;y+=spacing){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}}
function pixelDraw(canvas,values,w,h,{signed=false}={}){
  const ctx=canvas.getContext('2d');const data=ctx.createImageData(w,h);
  values.forEach((v,i)=>{
    const t=Math.max(0,Math.min(1,signed?Math.abs(v):v));
    const c=signed?(v>=0?[98,224,200]:[233,183,105]):[184,229,217];
    data.data[i*4]=8+t*(c[0]-8);data.data[i*4+1]=18+t*(c[1]-18);data.data[i*4+2]=28+t*(c[2]-28);data.data[i*4+3]=255;
  });ctx.putImageData(data,0,0);
}

function mountPerceptron(root){
  root.innerHTML=`<div class="lab-grid"><div><canvas class="experiment-canvas" width="500" height="340" role="img" aria-label="二维样本和感知机分类边界"></canvas><div class="chart-legend"><span><i class="legend-square"></i>类别 A</span><span><i class="legend-square amber"></i>类别 B</span></div></div><div class="lab-controls"><label>数据集<select class="dataset-select" aria-label="感知机数据集"><option value="linear">可线性分开</option><option value="xor">XOR · 交错的两类</option></select></label><div class="button-row"><button class="train-epoch" type="button">训练一轮</button><button class="train-many" type="button">训练 20 轮</button><button class="reset" type="button">重置</button></div><label>点击加入<select class="class-select" aria-label="新增样本类别"><option value="1">类别 A</option><option value="-1">类别 B</option></select></label><p class="lab-hint">点击空白处添加样本；拖动点改变位置。按钮与选择框也可通过键盘操作。</p><div class="lab-status" aria-live="polite"></div></div></div>`;
  const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),status=root.querySelector('.lab-status');
  let samples,model,epoch,dragged=null;
  const toPixel=p=>[250+p[0]*145,170-p[1]*115];
  function draw(){
    clear(ctx,500,340);grid(ctx,500,340,40);
    // Shade the model's predicted half-planes so bias-only states remain visible.
    for(let y=0;y<340;y+=8)for(let x=0;x<500;x+=8){ctx.fillStyle=predict(model,[(x-250)/145,(170-y)/115])===1?'#62e0c808':'#e9b76908';ctx.fillRect(x,y,8,8)}
    ctx.strokeStyle='#536b80';ctx.beginPath();ctx.moveTo(250,15);ctx.lineTo(250,325);ctx.moveTo(15,170);ctx.lineTo(485,170);ctx.stroke();
    ctx.save();ctx.beginPath();ctx.rect(0,0,500,340);ctx.clip();ctx.strokeStyle=colors.ink;ctx.lineWidth=1.5;ctx.setLineDash([5,5]);
    if(Math.abs(model.w[1])>.00001){const a=-2,b=2;const p=toPixel([a,-(model.w[0]*a+model.b)/model.w[1]]),q=toPixel([b,-(model.w[0]*b+model.b)/model.w[1]]);ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.stroke()}
    else if(Math.abs(model.w[0])>.00001){const x=toPixel([-model.b/model.w[0],0])[0];ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,340);ctx.stroke()}ctx.restore();
    samples.forEach(s=>{const p=toPixel(s.p);ctx.beginPath();ctx.arc(...p,7,0,Math.PI*2);ctx.fillStyle=s.label===1?colors.mint:colors.amber;ctx.fill();if(predict(model,s.p)!==s.label){ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.beginPath();ctx.arc(...p,11,0,Math.PI*2);ctx.stroke()}});
    ctx.fillStyle=colors.muted;ctx.font='11px monospace';ctx.fillText('x₁',470,188);ctx.fillText('x₂',261,23);ctx.fillText('白色外圈：当前分错',15,321);
    const correct=samples.filter(s=>predict(model,s.p)===s.label).length;
    status.textContent=`轮次 ${epoch} · 正确 ${correct}/${samples.length}\nw=[${model.w.map(v=>v.toFixed(2)).join(', ')}]\nb=${model.b.toFixed(2)}`;
  }
  function reset(){epoch=0;model={w:[.18,-.12],b:0};samples=root.querySelector('select').value==='xor'?[{p:[-.8,-.8],label:1},{p:[.8,.8],label:1},{p:[-.8,.8],label:-1},{p:[.8,-.8],label:-1}]:[{p:[-.95,-.55],label:-1},{p:[-.5,-.9],label:-1},{p:[-.85,.1],label:-1},{p:[-.2,-.5],label:-1},{p:[.6,.75],label:1},{p:[.95,.2],label:1},{p:[.25,.9],label:1},{p:[.7,-.1],label:1}];draw();}
  function train(times){for(let i=0;i<times;i++){samples.forEach(s=>model=perceptronStep(model,s.p,s.label));epoch++}draw()}
  root.querySelector('.train-epoch').onclick=()=>train(1);root.querySelector('.train-many').onclick=()=>train(20);root.querySelector('.reset').onclick=reset;root.querySelector('.dataset-select').onchange=reset;
  const point=e=>{const r=canvas.getBoundingClientRect();return[(e.clientX-r.left)/r.width*500,(e.clientY-r.top)/r.height*340]};
  const toData=p=>[Math.max(-1.5,Math.min(1.5,(p[0]-250)/145)),Math.max(-1.25,Math.min(1.25,(170-p[1])/115))];
  canvas.addEventListener('pointerdown',e=>{const p=point(e);dragged=samples.find(s=>{const q=toPixel(s.p);return Math.hypot(p[0]-q[0],p[1]-q[1])<18});if(!dragged){samples.push({p:toData(p),label:Number(root.querySelector('.class-select').value)});draw()}else canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(dragged){dragged.p=toData(point(e));draw()}});canvas.addEventListener('pointerup',()=>dragged=null);canvas.addEventListener('pointercancel',()=>dragged=null);reset();
}

function mountEliza(root){
  root.innerHTML=`<div class="chat-log" role="log" aria-live="polite" aria-label="规则式对话记录"></div><form class="chat-form"><label class="hidden" for="eliza-input">给 ELIZA 的一句话</label><input id="eliza-input" aria-label="给 ELIZA 的一句话" maxlength="200" placeholder="试试：我觉得学习新东西很难" autocomplete="off"><button type="submit">发送</button></form><button class="rule-toggle" type="button" aria-expanded="false">查看匹配规则</button><div class="rule-panel hidden"><strong>最近匹配：</strong><span></span></div>`;
  const log=root.querySelector('.chat-log'),input=root.querySelector('input'),panel=root.querySelector('.rule-panel');let last='等待输入。';
  function message(text,speaker){const div=document.createElement('div');div.className=`chat-message ${speaker==='ELIZA'?'bot':''}`;const label=document.createElement('span');label.className='speaker';label.textContent=speaker;div.append(label,document.createTextNode(text));log.append(div);while(log.childElementCount>30)log.firstElementChild.remove();log.scrollTop=log.scrollHeight;}
  message('你好。试着告诉我一句“我觉得……”开头的话。','ELIZA');
  root.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const text=input.value.trim();const result=elizaReply(text);if(text)message(text,'YOU');message(result.reply,'ELIZA');last=result.match;panel.querySelector('span').textContent=last;input.value='';input.focus()});
  root.querySelector('.rule-toggle').onclick=e=>{const hidden=panel.classList.toggle('hidden');e.currentTarget.setAttribute('aria-expanded',String(!hidden));e.currentTarget.textContent=hidden?'查看匹配规则':'收起匹配规则';panel.querySelector('span').textContent=last;};
}

function mountConvolution(root){
  root.innerHTML=`<div class="lab-grid"><div class="pixel-pair"><div><canvas class="experiment-canvas input-canvas" width="240" height="240" role="img" aria-label="输入像素，点击选择计算位置"></canvas><div class="pixel-label"><span>INPUT / 12×12</span><span>点击查看局部</span></div></div><div><canvas class="experiment-canvas output-canvas" width="200" height="200" role="img" aria-label="滤镜输出特征图"></canvas><div class="pixel-label"><span>FEATURE / 10×10</span><span>青 + / 金 −</span></div></div></div><div class="lab-controls"><label>滤镜<select class="filter-select" aria-label="卷积滤镜"><option value="vertical">竖直边缘</option><option value="horizontal">水平边缘</option><option value="blur">均值模糊</option></select></label><div class="kernel-grid" aria-label="滤镜的九个权重"></div><label>查看位置<input class="pixel-position" type="range" min="0" max="99" value="44" aria-label="卷积计算位置"></label><div class="lab-status" aria-live="polite"></div></div></div>`;
  const input=root.querySelector('.input-canvas'),output=root.querySelector('.output-canvas'),filter=root.querySelector('select');
  const image=Array.from({length:12},(_,y)=>Array.from({length:12},(_,x)=>((x>=3&&x<=7&&y>=2&&y<=8)||(x>=7&&x<=10&&y>=7&&y<=9))?1:.04));
  const kernels={vertical:[[-1,0,1],[-1,0,1],[-1,0,1]],horizontal:[[-1,-1,-1],[0,0,0],[1,1,1]],blur:Array.from({length:3},()=>[1/9,1/9,1/9])};
  function draw(){const kernel=kernels[filter.value],result=convolve(image,kernel),position=Number(root.querySelector('input').value),x=position%10,y=Math.floor(position/10);
    const iCtx=input.getContext('2d');clear(iCtx,240,240);image.forEach((row,j)=>row.forEach((v,i)=>{iCtx.fillStyle=`rgb(${8+v*120},${18+v*194},${28+v*170})`;iCtx.fillRect(i*20,j*20,19,19)}));iCtx.strokeStyle=colors.amber;iCtx.lineWidth=2;iCtx.strokeRect(x*20+1,y*20+1,58,58);
    const oCtx=output.getContext('2d');clear(oCtx,200,200);const scale=filter.value==='blur'?1:3;result.forEach((row,j)=>row.forEach((v,i)=>{const t=Math.min(1,Math.abs(v)/scale),c=v>=0?[98,224,200]:[233,183,105];oCtx.fillStyle=`rgb(${8+t*(c[0]-8)},${18+t*(c[1]-18)},${28+t*(c[2]-28)})`;oCtx.fillRect(i*20,j*20,19,19)}));oCtx.strokeStyle=colors.ink;oCtx.strokeRect(x*20+1,y*20+1,18,18);
    root.querySelector('.kernel-grid').innerHTML=kernel.flat().map(v=>`<span>${filter.value==='blur'?'1/9':v}</span>`).join('');root.querySelector('.lab-status').textContent=`位置 [${x}, ${y}]\n加权结果 ${result[y][x].toFixed(2)}`;}
  filter.onchange=draw;root.querySelector('input').oninput=draw;input.onclick=e=>{const r=input.getBoundingClientRect(),x=Math.min(9,Math.floor((e.clientX-r.left)/r.width*12)),y=Math.min(9,Math.floor((e.clientY-r.top)/r.height*12));root.querySelector('input').value=y*10+x;draw()};draw();
}

function mountReinforcement(root){
  root.innerHTML=`<div class="lab-grid"><div><canvas class="experiment-canvas" width="360" height="360" role="img" aria-label="六乘六迷宫、目标和学到的行动方向"></canvas><div class="chart-legend"><span><i class="legend-square"></i>智能体 / 起点</span><span><i class="legend-square amber"></i>目标</span></div></div><div class="lab-controls"><label>探索概率 <output class="epsilon-output">25%</output><input class="epsilon-range" type="range" min="0" max="100" value="25" aria-label="探索概率"></label><div class="button-row"><button class="train-episodes" type="button">学习 100 回合</button><button class="watch-policy" type="button">观察路线</button><button class="reset" type="button">重置</button></div><p class="lab-hint">目标 +1；每步 −0.03；撞墙 −0.15。箭头表示当前估值最高的行动。</p><div class="lab-status" aria-live="polite"></div></div></div>`;
  const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),walls=new Set([7,8,9,15,21,22,26,27]),random=rng(42),goal=35;let table,episodes,successes,agent,path,timer=null;
  const dirs=[[-1,0],[0,1],[1,0],[0,-1]],arrows=['↑','→','↓','←'];
  function next(state,action){const y=Math.floor(state/6),x=state%6,ny=y+dirs[action][0],nx=x+dirs[action][1],n=ny*6+nx;return ny<0||nx<0||ny>=6||nx>=6||walls.has(n)?state:n;}
  function best(s){const max=Math.max(...table[s]),choices=table[s].map((v,i)=>v===max?i:-1).filter(i=>i>=0);return choices[Math.floor(random()*choices.length)];}
  function stop(){if(timer){clearInterval(timer);timer=null}}
  function draw(note=''){clear(ctx,360,360);for(let s=0;s<36;s++){const x=s%6*60,y=Math.floor(s/6)*60;ctx.fillStyle=walls.has(s)?'#233547':path.includes(s)?'#62e0c818':colors.bg;ctx.fillRect(x+2,y+2,56,56);ctx.strokeStyle=colors.line;ctx.strokeRect(x+2,y+2,56,56);if(!walls.has(s)&&s!==goal&&table[s].some(v=>v!==0)){ctx.fillStyle=colors.muted;ctx.font='22px sans-serif';const action=table[s].indexOf(Math.max(...table[s]));ctx.fillText(arrows[action],x+21,y+38)}}ctx.fillStyle=colors.amber;ctx.fillRect(5*60+19,5*60+19,22,22);ctx.beginPath();ctx.arc(agent%6*60+30,Math.floor(agent/6)*60+30,12,0,Math.PI*2);ctx.fillStyle=colors.mint;ctx.fill();root.querySelector('.lab-status').textContent=`回合 ${episodes}\n到达目标 ${successes} 次${note?'\n'+note:''}`;}
  function reset(){stop();table=Array.from({length:36},()=>[0,0,0,0]);episodes=0;successes=0;agent=0;path=[0];draw()}
  root.querySelector('.epsilon-range').oninput=e=>root.querySelector('.epsilon-output').textContent=e.target.value+'%';
  root.querySelector('.train-episodes').onclick=()=>{stop();const epsilon=Number(root.querySelector('.epsilon-range').value)/100;for(let ep=0;ep<100;ep++){let s=0;for(let t=0;t<120;t++){const a=random()<epsilon?Math.floor(random()*4):best(s),n=next(s,a),terminal=n===goal,reward=terminal?1:n===s?-.15:-.03;qStep(table,s,a,reward,n,.25,.93,terminal);s=n;if(terminal){successes++;break}}episodes++}agent=0;path=[0];draw()};
  root.querySelector('.watch-policy').onclick=()=>{stop();agent=0;path=[0];let steps=0;draw();timer=setInterval(()=>{agent=next(agent,best(agent));path.push(agent);steps++;draw(`观察步骤 ${steps}`);if(agent===goal){stop();draw('已到达目标')}else if(steps>=40){stop();draw('40 步内未到达；试试继续学习')}},130)};
  root.querySelector('.reset').onclick=reset;reset();
}

function mountAttention(root){
  const words=['小猫','没有','追上','老鼠','因为','它','太快了'];
  root.innerHTML=`<div class="attention-sentence" aria-label="选择查询词">${words.map((w,i)=>`<button type="button" data-word="${i}" aria-pressed="false">${w}</button>`).join('')}</div><div class="lab-grid"><div><div class="attention-bars"></div><div class="attention-formula"></div></div><div class="lab-controls"><label>匹配分数强度 <output class="strength-output">1.0</output><input type="range" min="0" max="30" value="10" class="strength-range" aria-label="注意力匹配分数强度"></label><p class="lab-hint">强度越大，权重越集中。强度为零时，各位置权重相等。</p><div class="lab-status" aria-live="polite"></div></div></div>`;
  // Toy values and logits are explicitly constructed for instruction, not
  // attention weights extracted from a language model.
  const vectors=[[1,0],[0,0],[.3,.6],[.9,0],[0,.2],[.5,.4],[0,1]];
  const scores=[[3,0,.5,1,0,.2,.1],[.2,3,1,.1,0,.2,.1],[.5,.7,3,1,.2,.1,.7],[1,0,.6,3,.2,.4,1],[.1,.1,.2,.1,3,.8,.8],[1.4,.1,.2,2.4,.3,1,1.2],[.1,.1,.8,1.2,.4,.7,3]];
  let selected=5;
  function draw(){const strength=Number(root.querySelector('input').value)/10,weights=softmax(scores[selected].map(v=>v*strength)),context=weightedContext(vectors,weights);root.querySelector('.strength-output').textContent=strength.toFixed(1);root.querySelectorAll('[data-word]').forEach(button=>{const active=Number(button.dataset.word)===selected;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active))});root.querySelector('.attention-bars').innerHTML=words.map((w,i)=>`<div class="attention-row"><span>${w}</span><div class="attention-bar-track"><div class="attention-bar" style="width:${weights[i]*100}%"></div></div><output>${(weights[i]*100).toFixed(1)}%</output></div>`).join('');root.querySelector('.attention-formula').textContent=`context = Σ weight × value = [${context.map(v=>v.toFixed(3)).join(', ')}]`;root.querySelector('.lab-status').textContent=`查询词：${words[selected]}\n权重总和：${weights.reduce((a,b)=>a+b,0).toFixed(2)}`;}
  root.querySelectorAll('[data-word]').forEach(button=>button.onclick=()=>{selected=Number(button.dataset.word);draw()});root.querySelector('input').oninput=draw;draw();
}

function mountDiffusion(root){
  root.innerHTML=`<div class="lab-grid"><div><div class="diffusion-screen"><span class="diffusion-step-label">REVERSE PROCESS / 16×16</span><canvas class="main-diffusion" width="16" height="16" role="img" aria-label="当前去噪步骤的数字像素"></canvas></div><div class="diffusion-dataset" aria-label="用于教学的数据分布"></div><p class="snapshot-note">数据分布：十个数字模板。示例展示数学去噪过程，没有训练文生图模型。</p></div><div class="lab-controls"><label>去噪步骤 <output class="step-output">0 / 40</output><input class="step-range" type="range" min="0" max="40" value="0" aria-label="去噪步骤"></label><div class="button-row"><button class="play-diffusion" type="button">播放过程</button><button class="new-seed" type="button">换个随机种子</button><button class="reset" type="button">回到噪声</button></div><div class="lab-status" aria-live="polite"></div><p class="lab-hint">同一个种子可重现同一条轨迹。拖动时间不会重新随机生成样本。</p></div></div>`;
  const canvas=root.querySelector('.main-diffusion'),range=root.querySelector('input');let seed=7,frames=[],timer=null;
  const examples=Array.from({length:10},(_,digit)=>{const c=document.createElement('canvas');c.width=16;c.height=16;const ctx=c.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,16,16);ctx.fillStyle='#fff';ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(digit),8,9);const data=ctx.getImageData(0,0,16,16).data;return Array.from({length:256},(_,i)=>data[i*4]/255*2-1)});
  examples.forEach(values=>{const c=document.createElement('canvas');c.width=16;c.height=16;pixelDraw(c,values.map(v=>(v+1)/2),16,16);root.querySelector('.diffusion-dataset').append(c)});
  function stop(){if(timer){clearInterval(timer);timer=null}root.querySelector('.play-diffusion').textContent='播放过程';}
  function build(){stop();const random=rng(seed);const gaussian=()=>Math.sqrt(-2*Math.log(Math.max(1e-10,random())))*Math.cos(2*Math.PI*random());let x=Array.from({length:256},gaussian);frames=[x];for(let i=0;i<40;i++){const alpha=.002+(.998)*(i/40)**2,nextAlpha=.002+(.998)*((i+1)/40)**2;x=diffusionStep(x,examples,alpha,nextAlpha);frames.push(x)}range.value=0;draw()}
  function draw(){const step=Number(range.value);pixelDraw(canvas,frames[step].map(v=>(v+1)/2),16,16);root.querySelector('.step-output').textContent=`${step} / 40`;root.querySelector('.lab-status').textContent=`种子 ${seed}\n步骤 ${step}/40\n${step===0?'起点：高斯噪声':step===40?'终点：数据分布中的结构':'反向去噪进行中'}`;}
  range.oninput=()=>{stop();draw()};root.querySelector('.new-seed').onclick=()=>{seed++;build()};root.querySelector('.reset').onclick=()=>{stop();range.value=0;draw()};root.querySelector('.play-diffusion').onclick=()=>{if(timer){stop();return}if(Number(range.value)>=40)range.value=0;root.querySelector('.play-diffusion').textContent='暂停';timer=setInterval(()=>{range.value=Number(range.value)+1;draw();if(Number(range.value)>=40)stop()},90)};build();
}
