import { projects } from './projects.js';
const districts = {
  agents: { label: 'Agent infrastructure', color: '#426b56', x: -155, z: -145 },
  systems: { label: 'Applied systems', color: '#895936', x: 170, z: -100 },
  human: { label: 'Human experiences', color: '#725d88', x: 135, z: 185 },
  learning: { label: 'Learning tools', color: '#456b85', x: -170, z: 185 },
};
const byId = new Map(projects.map(p => [p.id, p]));
const canvas = document.querySelector('#city');
const ctx = canvas.getContext('2d');
const media = matchMedia('(prefers-reduced-motion: reduce)');
let paused = media.matches, angle = .55, pitch = .56, zoom = 1;
let w = 0, h = 0, scale = 1, phase = 0, previousTime = 0, dirty = true;
let selected = byId.has(location.hash.slice(1)) ? location.hash.slice(1) : 'repogym';
let filter = 'all', query = '', drag = null, hovered = null;
const hash = text => [...text].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7);
const nodes = projects.map(p => {
  const peers = projects.filter(n => n.district === p.district), i = peers.indexOf(p);
  const columns = peers.length > 9 ? 4 : 3;
  const d = districts[p.district], seed = hash(p.id);
  return { ...p, x: d.x + (i % columns - (columns - 1) / 2) * 60,
    z: d.z + (Math.floor(i / columns) - (Math.ceil(peers.length / columns) - 1) / 2) * 61,
    height: 36 + seed % 95, size: 14 + seed % 9, seed, color: d.color };
});
function matches(p) { return (filter === 'all' || p.district === filter) && `${p.name} ${p.description} ${p.language}`.toLowerCase().includes(query); }
function point(x, y, z) {
  const rx = x * Math.cos(angle) - z * Math.sin(angle);
  const depth = x * Math.sin(angle) + z * Math.cos(angle);
  const perspective = 1150 / (1150 + depth * Math.cos(pitch) + y * Math.sin(pitch));
  const s = scale * zoom * perspective;
  return { x: w * (w < 680 ? .50 : .54) + rx * s,
    y: h * (w < 680 ? .66 : .54) + (depth * Math.sin(pitch) - y * Math.cos(pitch)) * s,
    depth, s };
}
function path(points, color, width = 1, fill = null, close = false) {
  ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  if (close) ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (color) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); }
}
function line(a, b, color, width = 1) { path([point(...a), point(...b)], color, width); }
function ring(x, y, z, radius, color, start = 0, end = Math.PI * 2, width = 1) {
  const points = []; const steps = Math.max(12, Math.ceil((end - start) * 16));
  for (let i = 0; i <= steps; i++) { const t = start + (end - start) * i / steps; points.push(point(x + Math.cos(t) * radius, y, z + Math.sin(t) * radius)); }
  path(points, color, width);
}
function cuboid(x, z, half, base, height, color, active = false) {
  const bottom = [[x-half,base,z-half],[x+half,base,z-half],[x+half,base,z+half],[x-half,base,z+half]];
  const top = bottom.map(([a,,c]) => [a,base+height,c]);
  const faces = [0,1,2,3].map(i => ({i, depth:(point(...bottom[i]).depth+point(...bottom[(i+1)%4]).depth)/2})).sort((a,b)=>b.depth-a.depth);
  for (const {i} of faces) { const j=(i+1)%4;path([point(...bottom[i]),point(...bottom[j]),point(...top[j]),point(...top[i])],color+(active?'bf':'66'),.7,'#eee8ddef',true); }
  path(top.map(p=>point(...p)),color+(active?'ff':'bb'),1.1,color+(active?'4a':'24'),true);
  const floors = Math.floor(height/12);
  for(let f=1;f<floors;f++) for(let i=0;i<4;i++) {
    const j=(i+1)%4;if(point(...bottom[i]).depth+point(...bottom[j]).depth<2*point(x,base,z).depth) {
      const a=[bottom[i][0],base+f*12,bottom[i][2]],b=[bottom[j][0],base+f*12,bottom[j][2]];
      line(a,b,color+'46',.6);
    }
  }
}
function render() {
  if (!ctx) return;
  ctx.clearRect(0,0,w,h);
  const mist=ctx.createRadialGradient(w*.54,h*.51,10,w*.54,h*.51,w*.4);mist.addColorStop(0,'#a2b69a26');mist.addColorStop(1,'#f5f1e900');ctx.fillStyle=mist;ctx.fillRect(0,0,w,h);
  for(let i=0;i<90;i++){const x=(hash(`s${i}`)*.6180339%1)*w,y=(hash(`y${i}`)*.41421%1)*h;ctx.fillStyle=i%7===0?'#7a8b6c5c':'#7d8d7727';ctx.fillRect(x,y,i%7===0?1.5:1,1);}
  for(let x=-450;x<=450;x+=30)line([x,-8,-450],[x,-8,450],'#89927e22',.6);
  for(let z=-450;z<=450;z+=30)line([-450,-8,z],[450,-8,z],'#89927e22',.6);
  for(const radius of [350,390,425])ring(0,-6,0,radius,'#89957c40');
  for(let i=0;i<100;i++){let a=i/100*Math.PI*2;line([Math.cos(a)*425,-6,Math.sin(a)*425],[Math.cos(a)*(i%5===0?437:430),-6,Math.sin(a)*(i%5===0?437:430)],'#72886d55',.8);}
  for(const [key,d] of Object.entries(districts)) {
    const opacity=filter==='all'||filter===key?'':'20';
    ring(d.x,-2,d.z,key==='systems'?143:114,d.color+(opacity||'35'));
    ring(d.x,-2,d.z,key==='systems'?146:117,d.color+'18');
    line([0,0,0],[d.x,0,d.z],d.color+'39');
    const label=point(d.x,0,d.z+ (key==='systems'?155:126));
    ctx.font='10px Consolas,monospace';ctx.textAlign='center';ctx.fillStyle=d.color+(opacity||'c4');ctx.fillText(d.label.toUpperCase(),label.x,label.y);
  }
  for(const n of nodes){const d=districts[n.district];line([d.x,0,d.z],[n.x,0,n.z],n.color+(matches(n)?'40':'0d'));}
  // A shared workshop at the center; project-to-district paths express themes.
  for(let i=0;i<4;i++)ring(0,i*7,0,46-i*4,'#426b56'+['32','48','66','9a'][i]);
  const ordered=[...nodes].sort((a,b)=>point(b.x,0,b.z).depth-point(a.x,0,a.z).depth);
  for(const n of ordered) {
    const active=n.id===selected,shown=matches(n);ctx.globalAlpha=shown?1:.1;
    ring(n.x,0,n.z,29,n.color+(active?'c0':'35'),0,Math.PI*2,active?1.5:.7);
    cuboid(n.x,n.z,n.size,0,8,n.color,active);
    cuboid(n.x,n.z,n.size*.69,8,n.height,n.color,active);
    if(n.seed%3!==0)cuboid(n.x+18,n.z-12,6,0,n.height*.34,n.color);
    if(n.seed%2===0)cuboid(n.x,n.z,n.size*.4,n.height+8,13,n.color,active);
    const top=point(n.x,n.height+20,n.z);n.screen=top;
    line([n.x,n.height+8,n.z],[n.x,n.height+25,n.z],n.color+'ae',.8);
    ctx.fillStyle=n.color;ctx.shadowColor=n.color;ctx.shadowBlur=active?5:0;ctx.beginPath();ctx.arc(top.x,top.y,active?3.5:1.6,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    if(active||n.id===hovered){ring(n.x,n.height+26,n.z,12+Math.sin(phase*1.4)*2,n.color+'b0');ctx.font='12px Consolas,monospace';ctx.textAlign='center';const tw=ctx.measureText(n.name).width;ctx.fillStyle='#fbf8f0f2';ctx.fillRect(top.x-tw/2-8,top.y-34,tw+16,23);ctx.fillStyle=n.color;ctx.fillText(n.name,top.x,top.y-18);}
    ctx.globalAlpha=1;
  }
  // Tracers are visual motion, not simulated traffic or fabricated activity.
  for(let i=0;i<16;i++){const a=i*.41+phase*.12,rad=390;const p=point(Math.cos(a)*rad,4,Math.sin(a)*rad);ctx.fillStyle='#426b5688';ctx.beginPath();ctx.arc(p.x,p.y,1.5,0,Math.PI*2);ctx.fill();}
  document.querySelector('#coordinates').textContent=`AZ ${String(Math.round(((angle*180/Math.PI)%360+360)%360)).padStart(3,'0')}° / EL ${String(Math.round(pitch*180/Math.PI)).padStart(2,'0')}°`;
}
function resize(){const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx?.setTransform(dpr,0,0,dpr,0,0);scale=Math.min(w<680?w/780:w/1040,h/690);dirty=true;}
function select(id,{focusMap=false}={}){
  const p=byId.get(id);if(!p)return;selected=id;
  document.querySelector('#project-name').textContent=p.name;
  document.querySelector('#project-description').textContent=p.description;
  document.querySelector('#project-language').textContent=p.language;
  document.querySelector('#project-sector').textContent=districts[p.district].label.toUpperCase();
  document.querySelector('#project-number').textContent=`${String(projects.indexOf(p)+1).padStart(2,'0')} / ${projects.length}`;
  document.querySelector('#project-source').href=p.url;
  document.querySelector('.inspector').style.setProperty('--mint',districts[p.district].color);
  document.querySelectorAll('.project-card').forEach(el=>el.classList.toggle('selected',el.dataset.id===id));
  history.replaceState(null,'',`#${encodeURIComponent(id)}`);dirty=true;
  if(focusMap){document.querySelector('.atlas').scrollIntoView({behavior:media.matches?'instant':'smooth'});document.querySelector('#project-source').focus({preventScroll:true});}
}
function updateList(){
  const list=document.querySelector('#project-list');list.replaceChildren();const shown=projects.filter(matches);
  document.querySelector('#results').textContent=shown.length?`${shown.length} public projects${filter==='all'?'':` · ${districts[filter].label}`}`:'No projects match. Try another term or choose All districts.';
  for(const p of shown){const article=document.createElement('article');article.className='project-card';article.dataset.id=p.id;article.classList.toggle('selected',p.id===selected);
    const label=document.createElement('div');label.className='card-label';const diamond=document.createElement('i');diamond.className=p.district;label.append(diamond,document.createTextNode(districts[p.district].label.toUpperCase()));
    const heading=document.createElement('h3');heading.textContent=p.name;const desc=document.createElement('p');desc.textContent=p.description;
    const links=document.createElement('div');links.className='card-links';const locate=document.createElement('button');locate.textContent='Locate in atlas ↗';locate.setAttribute('aria-label',`Locate ${p.name} in atlas`);locate.addEventListener('click',()=>select(p.id,{focusMap:true}));const source=document.createElement('a');source.href=p.url;source.textContent=`${p.language} · Source`;source.setAttribute('aria-label',`${p.name} source on GitHub`);links.append(locate,source);article.append(label,heading,desc,links);list.append(article);
  }
  document.querySelector('#previous').disabled=shown.length===0;document.querySelector('#next').disabled=shown.length===0;
  if(shown.length&&!shown.some(p=>p.id===selected))select(shown[0].id);
  dirty=true;
}
function updateMotion(){const b=document.querySelector('#motion');b.textContent=paused?'Resume orbit':'Pause orbit';b.setAttribute('aria-pressed',String(paused));dirty=true;}
document.querySelector('#motion').addEventListener('click',()=>{paused=!paused;updateMotion();});
media.addEventListener('change',e=>{paused=e.matches;updateMotion();});
document.querySelector('#zoom-in').addEventListener('click',()=>{zoom=Math.min(1.8,zoom+.15);dirty=true;});
document.querySelector('#zoom-out').addEventListener('click',()=>{zoom=Math.max(.6,zoom-.15);dirty=true;});
document.querySelector('#reset').addEventListener('click',()=>{angle=.55;pitch=.56;zoom=1;dirty=true;});
for(const [id,step] of [['previous',-1],['next',1]])document.querySelector(`#${id}`).addEventListener('click',()=>{const shown=projects.filter(matches);if(!shown.length)return;const index=shown.findIndex(p=>p.id===selected);select(shown[(index+step+shown.length)%shown.length].id);});
document.querySelectorAll('[data-district]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.district;document.querySelectorAll('[data-district]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));updateList();}));
document.querySelector('#search').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();updateList();});
function nearest(x,y){return nodes.filter(matches).map(n=>({id:n.id,d:Math.hypot(x-n.screen?.x,y-n.screen?.y)})).filter(n=>n.d<35).sort((a,b)=>a.d-b.d)[0]?.id;}
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,angle,pitch,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(drag&&e.pointerId===drag.id){angle=drag.angle+(e.clientX-drag.x)*.006;pitch=Math.max(.25,Math.min(1.05,drag.pitch+(e.clientY-drag.y)*.003));dirty=true;}else{const r=canvas.getBoundingClientRect();const next=nearest(e.clientX-r.left,e.clientY-r.top);if(next!==hovered){hovered=next;dirty=true;}}});
canvas.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<8){const r=canvas.getBoundingClientRect();const id=nearest(e.clientX-r.left,e.clientY-r.top);if(id)select(id);}drag=null;});
canvas.addEventListener('pointercancel',()=>{drag=null;});
canvas.addEventListener('lostpointercapture',()=>{drag=null;});
canvas.addEventListener('pointerleave',()=>{hovered=null;dirty=true;});
new ResizeObserver(resize).observe(canvas);
function tick(time){const dt=Math.min((time-previousTime)/1000,.05);previousTime=time;if(!document.hidden){if(!paused&&!drag){angle+=dt*.025;phase+=dt;dirty=true;}if(dirty){render();dirty=false;}}requestAnimationFrame(tick);}
select(selected);updateList();updateMotion();resize();requestAnimationFrame(tick);
