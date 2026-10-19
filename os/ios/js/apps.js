const $=(s,e=document)=>e.querySelector(s);
const hdr=t=>`<div class="ttl">${t}</div>`;
const G=(a,b)=>`linear-gradient(${a},${b})`;
window.APPS=[
{id:'messages',name:'Messages',bg:G('#6be36f','#1fb83a'),icon:'💬',render(e){
 e.innerHTML=hdr('Messages')+'<div class="body" id="ch"></div><div style="padding:8px 16px 28px"><input id="mi" placeholder="iMessage"></div>';
 const add=(t,m)=>{const c=$('#ch',e);c.insertAdjacentHTML('beforeend',`<div class="bub ${m?'me':''}"></div>`);c.lastChild.textContent=t;c.scrollTop=1e5};
 add('Hey! Welcome to iOS (Virtual) 👋');
 $('#mi',e).onkeydown=k=>{if(k.key==='Enter'&&k.target.value){add(k.target.value,1);k.target.value='';setTimeout(()=>add(['Nice!','Got it 👍','Haha ok','Tell me more'][Math.random()*4|0]),700)}}}},
{id:'calendar',name:'Calendar',bg:'#fff',icon:'📅',render(e){
 const d=new Date(),y=d.getFullYear(),m=d.getMonth(),f=new Date(y,m,1).getDay(),n=new Date(y,m+1,0).getDate();
 let h='';'SMTWTFS'.split('').forEach(c=>h+=`<b>${c}</b>`);for(let i=0;i<f;i++)h+='<i></i>';
 for(let i=1;i<=n;i++)h+=`<div class="${i===d.getDate()?'t':''}" style="padding:8px 0">${i}</div>`;
 e.innerHTML=hdr(d.toLocaleString('en',{month:'long',year:'numeric'}))+`<div class="body"><div class="cal">${h}</div></div>`}},
{id:'photos',name:'Photos',bg:'#fff',icon:'🌸',render(e){
 let h='';for(let i=0;i<30;i++)h+=`<div style="background:hsl(${i*37%360},70%,${55+i%3*8}%)"></div>`;
 e.innerHTML=hdr('Photos')+`<div class="body" style="padding:0"><div class="ph">${h}</div></div>`}},
{id:'camera',name:'Camera',bg:G('#8e8e93','#48484a'),icon:'📷',render(e){
 e.style.background='#000';e.innerHTML='<video autoplay playsinline style="flex:1;width:100%;object-fit:cover"></video><div style="height:120px;display:grid;place-items:center"><i style="width:68px;height:68px;border-radius:50%;border:4px solid #fff;background:#fff3"></i></div>';
 navigator.mediaDevices?.getUserMedia({video:true}).then(s=>{$('video',e).srcObject=s;e._s=s}).catch(()=>e.insertAdjacentHTML('afterbegin','<p style="padding:20px;color:#fff">Camera not available</p>'))},
 close(e){e._s?.getTracks().forEach(t=>t.stop());e.style.background=''}},
{id:'weather',name:'Weather',bg:G('#4aa3ff','#1c6fe0'),icon:'⛅',render(e){
 e.style.background=G('#4aa3ff','#1c6fe0');e.style.color='#fff';e.innerHTML='<div style="text-align:center;padding-top:50px"><div style="font-size:30px">My Location</div><div style="font-size:96px;font-weight:200">28°</div><div>Partly Cloudy</div></div><div class="body" style="margin-top:30px">'+['Now ⛅ 28°','1 PM ☀️ 30°','3 PM ☀️ 31°','5 PM ⛅ 29°','8 PM 🌙 25°'].map(x=>`<div class="row" style="background:#fff2;color:#fff">${x}</div>`).join('')+'</div>'},
 close(e){e.style.background='';e.style.color=''}},
{id:'clock',name:'Clock',bg:'#000',icon:'🕒',render(e){
 e.innerHTML=hdr('Clock')+'<div class="body" style="text-align:center"><div id="ct" style="font-size:64px;font-weight:200;margin:20px"></div><div id="sw" style="font-size:44px;font-weight:200">00:00.0</div><button id="sb" style="margin-top:12px;padding:12px 30px;border-radius:30px;border:0;background:#34c759;color:#fff;font-size:18px">Start</button></div>';
 let t0=0,run=0,acc=0;const tick=()=>{$('#ct',e).textContent=new Date().toLocaleTimeString();if(run)acc=Date.now()-t0;const s=acc/1e3|0;$('#sw',e).textContent=String(s/60|0).padStart(2,'0')+':'+String(s%60).padStart(2,'0')+'.'+(acc/100%10|0)};
 e._i=setInterval(tick,100);tick();$('#sb',e).onclick=function(){run=!run;if(run)t0=Date.now()-acc;this.textContent=run?'Stop':'Start';this.style.background=run?'#ff3b30':'#34c759'}},
 close(e){clearInterval(e._i)}},
{id:'notes',name:'Notes',bg:G('#ffe27a','#ffc300'),icon:'📝',render(e){
 e.innerHTML=hdr('Notes')+'<div class="body"><textarea id="nt" style="height:70%;background:#fff" placeholder="Start typing…"></textarea></div>';
 const t=$('#nt',e);t.value=localStorage.getItem('ios-note')||'';t.oninput=()=>localStorage.setItem('ios-note',t.value)}},
{id:'calculator',name:'Calculator',bg:'#333',icon:'🧮',render(e){
 e.style.background='#000';let x='';
 const keys=['AC','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','='];
 e.innerHTML='<div class="scr" id="d">0</div><div class="calc">'+keys.map(k=>`<button class="${'÷×−+='.includes(k)?'o':['AC','±','%'].includes(k)?'f':''}" style="${k==='0'?'grid-column:span 2':''}">${k}</button>`).join('')+'</div>';
 const d=$('#d',e),ev=s=>+eval(s.replace(/÷/g,'/').replace(/×/g,'*').replace(/−/g,'-')).toFixed(8);
 e.querySelectorAll('button').forEach(b=>b.onclick=()=>{const k=b.textContent;
  try{if(k==='AC')x='';else if(k==='±')x=x?String(-ev(x)):x;else if(k==='%')x=x?String(ev(x)/100):x;else if(k==='=')x=x?String(ev(x)):x;else x+=k}catch{x='Error'}
  d.textContent=x||'0';d.style.fontSize=x.length>8?'44px':'76px'})},
 close(e){e.style.background=''}},
{id:'settings',name:'Settings',bg:G('#a0a0a5','#636366'),icon:'⚙️',render(e){
 const t=(n,on)=>`<div class="row">${n}<div class="tg ${on?'on':''}" data-k="${n}"></div></div>`;
 e.innerHTML=hdr('Settings')+`<div class="body"><div class="grp">${t('Airplane Mode')}${t('Wi‑Fi',1)}${t('Bluetooth',1)}</div><div class="grp">${t('Dark Mode',document.body.classList.contains('dark'))}<div class="row">Brightness<input type="range" id="br" min="40" max="100" value="100" style="width:50%;padding:0"></div></div><div class="grp"><div class="row">Name<span>iPhone</span></div><div class="row">Software Version<span>iOS (Virtual)</span></div></div></div>`;
 e.querySelectorAll('.tg').forEach(g=>g.onclick=()=>{g.classList.toggle('on');if(g.dataset.k==='Dark Mode')document.body.classList.toggle('dark')});
 $('#br',e).oninput=k=>$('#screen').style.filter=`brightness(${k.target.value}%)`}},
{id:'phone',name:'Phone',bg:G('#6be36f','#1fb83a'),icon:'📞',dock:1,render(e){
 e.innerHTML='<div class="scr" id="pn" style="color:#000;background:none;font-size:40px;min-height:140px"></div><div class="calc" style="background:none">'+'123456789*0#'.split('').map(k=>`<button style="background:#d1d1d6;color:#000">${k}</button>`).join('')+'<button id="cl" style="grid-column:2;background:#34c759">📞</button></div>';
 e.querySelectorAll('.calc button:not(#cl)').forEach(b=>b.onclick=()=>$('#pn',e).textContent+=b.textContent);
 $('#cl',e).onclick=()=>{$('#pn',e).textContent='Calling…'}}},
{id:'safari',name:'Safari',bg:'#fff',icon:'🧭',dock:1,render(e){
 e.innerHTML=hdr('Safari')+'<div class="body"><input id="u" placeholder="Search or enter website"><p style="margin-top:14px;color:#666">Press Enter to open in a new tab.</p></div>';
 $('#u',e).onkeydown=k=>{if(k.key==='Enter'){const v=k.target.value.trim();window.open(/^[\w-]+\.[\w.-]+/.test(v)&&!v.includes(' ')?(v.startsWith('http')?v:'https://'+v):'https://www.google.com/search?q='+encodeURIComponent(v),'_blank')}}}},
{id:'maps',name:'Maps',bg:G('#7bd88f','#3b9dff'),icon:'🗺️',render(e){e.innerHTML=hdr('Maps')+'<div class="body"><input id="q" placeholder="Search Maps"></div>';$('#q',e).onkeydown=k=>{if(k.key==='Enter')window.open('https://www.openstreetmap.org/search?query='+encodeURIComponent(k.target.value))}}}
];
