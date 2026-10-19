(()=>{const A=window.APPS,$=s=>document.querySelector(s);
let cur=null,locked=true;
const icon=a=>`<div class="ic" data-id="${a.id}"><i style="background:${a.bg}">${a.icon}</i><span>${a.name}</span></div>`;
const dock=['phone','safari','messages','notes'];
$('#grid').innerHTML=A.filter(a=>!dock.includes(a.id)).map(icon).join('');
$('#dock').innerHTML=dock.map(i=>icon(A.find(a=>a.id===i))).join('');
document.querySelectorAll('.ic').forEach(el=>el.onclick=()=>open(el.dataset.id));
function open(id){const a=A.find(x=>x.id===id),e=$('#app');cur=a;e.innerHTML='';e.style.background='';a.render(e);e.classList.add('open');$('#home').classList.add('away')}
function home(){if(cur){cur.close?.($('#app'));cur=null}$('#app').classList.remove('open');$('#home').classList.remove('away')}
function lock(v){locked=v;$('#lock').classList.toggle('up',!v);if(v)home()}
function clock(){const d=new Date();$('#sbT').textContent=d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}).replace(/ ?[AP]M/i,'');
 $('#lTime').textContent=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false});$('#lDate').textContent=d.toLocaleDateString('en',{weekday:'long',day:'numeric',month:'long'})}
setInterval(clock,1000);clock();
$('#lock').onclick=()=>lock(false);$('#bar').onclick=()=>locked?lock(false):home();
const fit=()=>{const r=$('#phone').classList.contains('land');$('#phone').style.setProperty('--s',Math.min(1,(innerHeight-30)/(r?390:844),(innerWidth-110)/(r?844:390)))};
addEventListener('resize',fit);fit();
const act={switch:()=>location.href='../../index.html',rotate:()=>{$('#phone').classList.toggle('land');fit()},
 full:()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen(),power:()=>lock(true)};
document.querySelectorAll('#ctl button').forEach(b=>b.onclick=()=>act[b.dataset.a]());
addEventListener('keydown',e=>{if(/INPUT|TEXTAREA/.test(e.target.tagName))return;
 const k=e.key.toLowerCase();if(k==='r')act.rotate();else if(k==='h')locked?lock(false):home();else if(k==='escape'&&cur)home()});
})();
