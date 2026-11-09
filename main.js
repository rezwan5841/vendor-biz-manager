import {createClient} from '@supabase/supabase-js';
const SB_URL=import.meta.env.VITE_SUPABASE_URL,SB_KEY=import.meta.env.VITE_SUPABASE_ANON_KEY;
const SB=SB_URL&&SB_KEY?createClient(SB_URL,SB_KEY):null;
const S={user:null,loading:false,ready:false,sync:0,err:'',cfg:!SB};
let Q={},META={},SNAP={},flushing=false;
const newId=()=>crypto.randomUUID();
const J=o=>JSON.stringify(o,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(x=>[x,v[x]])):v);

const CATS=['Kos barang / bahan mentah','Kos tapak / sewaan tapak','Kos pengangkutan / minyak','Kos pekerja / upah','Kos penginapan','Kos ais / air / gas','Kos pembungkusan','Kos peralatan / sewaan','Kos promosi','Lain-lain'];
// Kategori lama dikekalkan dalam data. Ia hanya dipetakan ke pilihan baharu apabila rekod diedit.
const LEGACY={'Bahan mentah':CATS[0],'Sewa petak':CATS[1],'Pengangkutan':CATS[2],'Minyak & tol':CATS[2],'Gaji pekerja':CATS[3],'Gas & utiliti':CATS[5],'Pembungkusan':CATS[6]};
const ST={upcoming:'Akan datang',ongoing:'Sedang berlangsung',completed:'Selesai',cancelled:'Dibatalkan'};
const MN=['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogo','Sep','Okt','Nov','Dis'];
let menus=[],events=[],archived=[];
let V={tab:'home',ev:null,fy:'2026',fm:'all',ry:'2026',rm:'all'};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rm=n=>'RM '+n.toLocaleString('ms-MY',{minimumFractionDigits:2,maximumFractionDigits:2});
const fd=i=>i?i.split('-').reverse().join('/'):'';
const today=()=>new Date().toLocaleDateString('sv',{timeZone:'Asia/Kuala_Lumpur'});
const nd=e=>Math.round((new Date(e.end)-new Date(e.start))/864e5)+1;
const money=s=>{s=String(s).trim().replace(',','.');return /^\d{1,9}(\.\d{1,2})?$/.test(s)?+s:null};
const sum=a=>Math.round(a.reduce((x,y)=>x+y,0)*100)/100;
const v=id=>$('#'+id).value;
function dayList(e){const a=[],d=new Date(e.start);for(let i=0;i<nd(e);i++){a.push(new Date(d.getTime()+i*864e5).toISOString().slice(0,10))}return a}
function calc(e){
 const dv=Object.values(e.daily);
 const sales=e.salesMode==='daily'?(dv.length?sum(dv):null):e.total;
 const cost=e.costMode==='A'?(e.exp.length?sum(e.exp.map(x=>x.amt)):null):e.costMode==='B'?e.capital:null;
 const ok=sales!=null&&cost!=null;
 return{sales,cost,profit:ok?Math.round((sales-cost)*100)/100:null,margin:ok&&sales>0?(sales-cost)/sales*100:null,prov:!ok&&e.status!=='cancelled'&&e.status!=='upcoming'};
}
const complete=e=>e.status!=='cancelled'&&calc(e).profit!=null;
function locAgg(list){const o={};list.filter(complete).forEach(e=>{const c=calc(e),k=e.venue||'(Tiada lokasi)';const x=o[k]=o[k]||{n:0,s:0,c:0,p:0};x.n++;x.s=sum([x.s,c.sales]);x.c=sum([x.c,c.cost]);x.p=sum([x.p,c.profit])});return o}
function runTests(){
 const mk=o=>({status:'completed',start:'2026-01-01',end:'2026-01-01',venue:'A',menus:[],salesMode:'total',total:null,daily:{},costMode:null,capital:null,exp:[],...o});
 const ex=a=>a.map((x,i)=>({id:i,cat:'Lain-lain',desc:'',date:'2026-01-01',amt:x}));
 const T=[],t=(n,got,want)=>T.push({n,ok:JSON.stringify(got)===JSON.stringify(want),got,want});
 let c=calc(mk({total:6200,costMode:'A',exp:ex([1800,900,600])}));
 t('Kaedah A: untung',c.profit,2900);t('Kaedah A: margin',c.margin.toFixed(1),'46.8');
 t('Kaedah B: untung',calc(mk({total:1450,costMode:'B',capital:820})).profit,630);
 t('A dipilih, modal B diabaikan',calc(mk({total:500,costMode:'A',exp:ex([100]),capital:999})).profit,400);
 t('B dipilih, kos A diabaikan',calc(mk({total:500,costMode:'B',exp:ex([100]),capital:999})).profit,-499);
 t('Jualan harian dijumlah, jumlah lama diabaikan',calc(mk({salesMode:'daily',total:9999,daily:{a:1500,b:700,c:1900}})).sales,4100);
 c=calc(mk({total:1000,costMode:'A',menus:[{mid:2,price:10,note:''}]}));
 t('Kos menu tidak masuk kos acara',[c.cost,c.profit,c.prov],[null,null,true]);
 c=calc(mk({total:1,costMode:'A',exp:ex([0.1,0.2])}));t('Pembundaran sen',[c.cost,c.profit],[0.3,0.7]);
 t('Rugi',calc(mk({total:100,costMode:'B',capital:150})).profit,-50);
 t('Jualan sifar: tiada margin',calc(mk({total:0,costMode:'B',capital:10})).margin,null);
 const L=[mk({venue:'A',total:300,costMode:'B',capital:200}),mk({venue:'A',total:150,costMode:'B',capital:100}),mk({venue:'A',total:900}),mk({venue:'A',status:'cancelled',total:900,costMode:'B',capital:1}),mk({venue:'B',total:50})];
 const g=locAgg(L);t('Lokasi A: hanya acara lengkap',g.A,{n:2,s:450,c:300,p:150});t('Lokasi B tidak lengkap: tiada',g.B,undefined);
 t('Input wang',[money('12,50'),money('-5'),money('abc'),money('1.234')],[12.5,null,null,null]);
 t('Bilangan hari',dayList(mk({start:'2026-10-24',end:'2026-10-26'})).length,3);
 return T}
function testHTML(){const T=runTests();return `<p class="mut">${T.filter(x=>x.ok).length} / ${T.length} semakan lulus.</p>`+T.map(x=>`<div class="kv"><span>${esc(x.n)}</span><b class="${x.ok?'pos':'neg'}">${x.ok?'Lulus':'Gagal'}</b></div>`).join('')}
function sheet(t,body,save){$('#sh').innerHTML=`<div class="bd" onclick="closeS()"></div><div class="sheet"><h3>${t}</h3>${body}<p id="err" class="err"></p><div class="row"><button class="btn ghost" onclick="closeS()">Batal</button><button class="btn" onclick="doSave()">Simpan</button></div></div>`;window._sv=save}
function ask(msg,fn,label='Ya, teruskan'){$('#sh').innerHTML=`<div class="bd" onclick="closeS()"></div><div class="sheet"><h3>Sila sahkan</h3><p>${msg}</p><div class="row"><button class="btn ghost" onclick="closeS()">Batal</button><button class="btn red" onclick="window._ok()">${label}</button></div></div>`;window._ok=()=>{closeS();fn();render()}}
function closeS(){$('#sh').innerHTML=''}
function doSave(){const r=window._sv();if(r)$('#err').textContent=r;else{closeS();render()}}
function go(t,ev=null){V.tab=t;V.ev=ev;scrollTo(0,0);render()}
function renderApp(){
 $('#nav').innerHTML=[['home','📊','Papan Pemuka'],['events','📅','Acara'],['menu','🍽️','Menu'],['reports','📈','Laporan'],['set','⚙️','Tetapan']].map(([k,i,l])=>`<button class="${V.tab===k?'on':''}" onclick="go('${k}')"><span>${i}</span>${l}</button>`).join('');
 $('#app').innerHTML=({home,events:V.ev?detail:evlist,menu:menulist,reports,set:settings})[V.tab]();
}
function stat(l,val,cls=''){return `<div class="stat"><small>${l}</small><b class="${cls}">${val}</b></div>`}
function filtered(){return events.filter(e=>e.start.slice(0,4)===V.fy&&(V.fm==='all'||+e.start.slice(5,7)===+V.fm))}
function home(){
 const L=filtered(),C=L.map(calc);
 const S=sum(C.map(c=>c.sales||0)),X=sum(C.map(c=>c.cost||0));
 const both=C.filter(c=>c.profit!=null),P=sum(both.map(c=>c.profit));
 const noData=C.filter(c=>c.prov).length;
 const byM={};L.forEach((e,i)=>{const m=e.start.slice(5,7);byM[m]=byM[m]||{s:0,c:0,n:0};byM[m].s+=C[i].sales||0;byM[m].c+=C[i].cost||0;byM[m].n++});
 return `<div class="card"><div class="row"><div><label>Tahun</label><select onchange="V.fy=this.value;render()">${['2025','2026','2027'].map(y=>`<option ${y===V.fy?'selected':''}>${y}</option>`).join('')}</select></div><div><label>Bulan</label><select onchange="V.fm=this.value;render()"><option value="all">Semua</option>${MN.map((m,i)=>`<option value="${i+1}" ${V.fm==i+1?'selected':''}>${m}</option>`).join('')}</select></div></div></div>
 <div class="grid"><div class="stat big"><small>Untung bersih (acara yang lengkap data)</small><b>${rm(P)}</b></div>
 ${stat('Jumlah jualan',rm(S))}${stat('Jumlah kos direkod',rm(X))}
 ${stat('Bilangan acara',L.length)}${stat('Akan datang',L.filter(e=>e.status==='upcoming').length)}
 ${stat('Selesai',L.filter(e=>e.status==='completed').length)}${stat('Data tidak lengkap',noData,noData?'neg':'')}</div>
 ${noData?`<div class="warn">${noData} acara belum lengkap data jualan atau kos. Angka untung ialah sementara.</div>`:''}
 <div class="card" style="margin-top:12px"><h3>Ringkasan bulanan ${V.fy}</h3>${Object.keys(byM).sort().map(m=>`<div class="item"><span>${MN[+m-1]} <span class="mut">(${byM[m].n} acara)</span></span><span class="mut">Jualan ${rm(byM[m].s)} | Kos ${rm(byM[m].c)}</span></div>`).join('')||'<p class="mut">Tiada acara dalam tempoh ini.</p>'}</div>
 <div class="card"><h3>Acara akan datang</h3>${events.filter(e=>e.status==='upcoming').map(e=>`<div class="item" onclick="go('events','${e.id}')"><span><b>${esc(e.name)}</b>${ub(e.id)}<br><span class="mut">${fd(e.start)} - ${fd(e.end)}</span></span></div>`).join('')||'<p class="mut">Tiada.</p>'}</div>`;
}
function evlist(){
 return `<button class="btn or" onclick="evForm()">+ Acara baharu</button>`+[...events].sort((a,b)=>b.start.localeCompare(a.start)).map(e=>{const c=calc(e);return `<div class="card" onclick="go('events','${e.id}')"><div class="item" style="padding:0;border:0"><b>${esc(e.name)}</b>${ub(e.id)}<span class="tag ${e.status}">${ST[e.status]}</span></div><div class="mut">${esc(e.venue)} | ${fd(e.start)}${e.end!==e.start?' - '+fd(e.end):''} (${nd(e)} hari)</div><div style="margin-top:6px">${c.profit!=null?`Untung: <b class="${c.profit>=0?'pos':'neg'}">${rm(c.profit)}</b>`:c.prov?'<span class="neg">Data belum lengkap</span>':''}</div></div>`}).join('');
}
function evForm(id){
 const e=events.find(x=>x.id===id)||{name:'',org:'',venue:'',start:today(),end:today(),status:'upcoming',notes:''};
 sheet(id?'Edit acara':'Acara baharu',`<label>Nama acara</label><input id="f1" value="${esc(e.name)}"><label>Penganjur</label><input id="f2" value="${esc(e.org)}"><label>Lokasi</label><input id="f3" value="${esc(e.venue)}"><div class="row"><div><label>Tarikh mula</label><input id="f4" type="date" value="${e.start}"></div><div><label>Tarikh tamat</label><input id="f5" type="date" value="${e.end}"></div></div><label>Status</label><select id="f6">${Object.entries(ST).map(([k,l])=>`<option value="${k}" ${k===e.status?'selected':''}>${l}</option>`).join('')}</select><label>Nota</label><textarea id="f7">${esc(e.notes)}</textarea>`,()=>{
  const n=v('f1').trim(),s=v('f4'),en=v('f5');
  if(!n)return'Sila isi nama acara.';if(!s||!en)return'Sila pilih tarikh mula dan tamat.';if(en<s)return'Tarikh tamat tidak boleh sebelum tarikh mula.';
  if(events.some(x=>x.id!==id&&x.name.toLowerCase()===n.toLowerCase()&&x.start===s))return'Acara dengan nama dan tarikh mula yang sama sudah wujud.';
  const d={name:n,org:v('f2').trim(),venue:v('f3').trim(),start:s,end:en,status:v('f6'),notes:v('f7')};
  if(id){const o=events.find(x=>x.id===id);const ch=o.start!==s||o.end!==en;Object.assign(o,d);if(ch)o.daily={}}
  else events.push({id:newId(),...d,menus:[],salesMode:'total',total:null,salesDate:'',salesNote:'',daily:{},costMode:null,capital:null,exp:[]});
 });
}
function detail(){
 const e=events.find(x=>x.id===V.ev),c=calc(e),multi=nd(e)>1;
 const mm=e.menus.map(x=>{const m=menus.find(y=>y.id===x.mid);return m?`<div class="item"><span><b>${esc(m.name)}</b>${ub(m.id)}${m.on?'':' <span class="tag">Tidak aktif</span>'}${x.note?`<br><span class="mut">${esc(x.note)}</span>`:''}</span><b>${rm(x.price)}</b></div>`:''}).join('');
 const sales=`<div class="seg"><button class="${e.salesMode==='total'?'on':''}" onclick="setSM('${e.id}','total')">Satu jumlah</button>${multi?`<button class="${e.salesMode==='daily'?'on':''}" onclick="setSM('${e.id}','daily')">Jualan harian</button>`:''}</div>`+(e.salesMode==='total'?`<p>${e.total!=null?`Jumlah jualan: <b>${rm(e.total)}</b><br><span class="mut">Direkod ${fd(e.salesDate)}${e.salesNote?' | '+esc(e.salesNote):''}</span>`:'<span class="mut">Belum direkod.</span>'}</p><button class="btn" onclick="salesForm('${e.id}')">${e.total!=null?'Edit':'Masukkan'} jumlah jualan</button>`:`${dayList(e).map(d=>`<div class="item"><span>${fd(d)}</span><b>${e.daily[d]!=null?rm(e.daily[d]):'-'}</b></div>`).join('')}<p>Jumlah dikira automatik: <b>${c.sales!=null?rm(c.sales):'-'}</b></p><button class="btn" onclick="dailyForm('${e.id}')">Masukkan jualan harian</button>`);
 const cost=`<div class="seg"><button class="${e.costMode==='A'?'on':''}" onclick="setCM('${e.id}','A')">A: Kos terperinci</button><button class="${e.costMode==='B'?'on':''}" onclick="setCM('${e.id}','B')">B: Jumlah modal</button></div>`+(!e.costMode?'<p class="mut">Pilih satu kaedah kos di atas.</p>':e.costMode==='A'?`${e.exp.map(x=>`<div class="item"><span>${esc(x.cat)}<br><span class="mut">${esc(x.desc)} | ${fd(x.date)}</span></span><span><b>${rm(x.amt)}</b> <button class="btn ghost sm" onclick="expForm('${e.id}','${x.id}')">Edit</button> <button class="btn ghost sm" onclick="delExp('${e.id}','${x.id}')">Padam</button></span></div>`).join('')}<button class="btn" onclick="expForm('${e.id}')">+ Tambah perbelanjaan</button>`:`<p>${e.capital!=null?`Jumlah modal: <b>${rm(e.capital)}</b>`:'<span class="mut">Belum direkod.</span>'}</p><button class="btn" onclick="capForm('${e.id}')">${e.capital!=null?'Edit':'Masukkan'} jumlah modal</button>`)+(e.costMode&&(e.exp.length||e.capital!=null)?`<p class="mut">Hanya kaedah ${e.costMode} dikira. ${e.costMode==='A'?(e.capital!=null?'Jumlah modal (B) disimpan tetapi tidak dikira.':''):(e.exp.length?'Perbelanjaan terperinci (A) disimpan tetapi tidak dikira.':'')}</p>`:'');
 return `<button class="btn ghost sm" onclick="go('events')">&larr; Kembali</button>
 <div class="card"><div class="item" style="border:0;padding:0"><h3 style="margin:0">${esc(e.name)}</h3><span class="tag ${e.status}">${ST[e.status]}</span></div><p class="mut">${esc(e.org)} | ${esc(e.venue)}<br>${fd(e.start)} - ${fd(e.end)} (${nd(e)} hari)${e.notes?'<br>'+esc(e.notes):''}</p><div class="row"><button class="btn ghost" onclick="evForm('${e.id}')">Edit</button><button class="btn ghost" onclick="arch('${e.id}')">Arkib</button></div></div>
 <div class="card"><h3>Untung rugi</h3>${c.prov?'<div class="warn">Angka sementara: data jualan atau kos belum lengkap.</div>':''}<div class="item"><span>Jumlah jualan</span><b>${c.sales!=null?rm(c.sales):'Belum ada'}</b></div><div class="item"><span>Jumlah kos (${e.costMode?'Kaedah '+e.costMode:'belum pilih'})</span><b>${c.cost!=null?rm(c.cost):'Belum ada'}</b></div><div class="item"><span>Untung / rugi bersih</span><b class="${c.profit>=0?'pos':'neg'}">${c.profit!=null?rm(c.profit):'-'}</b></div><div class="item"><span>Margin untung</span><b>${c.margin!=null?c.margin.toFixed(1)+'%':'-'}</b></div><div class="item"><span>Tempoh</span><b>${nd(e)} hari</b></div>${multi&&c.sales!=null?`<div class="item"><span>Purata jualan harian</span><b>${rm(c.sales/nd(e))}</b></div>`:''}</div>
 <div class="card"><h3>Menu untuk acara ini</h3>${mm||'<p class="mut">Belum ada menu dipilih untuk acara ini.</p>'}<button class="btn" onclick="evMenuForm('${e.id}')">Edit menu acara</button><p class="mut">Harga ialah harga jual di acara ini. Anggaran kos menu tidak dimasukkan dalam kos acara.</p></div>
 <div class="card"><h3>Jualan selepas acara</h3>${sales}</div>
 <div class="card"><h3>Kos acara</h3>${cost}</div>`;
}
const E=id=>events.find(x=>x.id===id);
function evMenuForm(id){const e=E(id),L=menus.filter(m=>m.on||e.menus.some(x=>x.mid===m.id));
 sheet('Menu untuk acara',`<p class="mut">Tandakan menu yang dibenarkan di acara ini. Menu yang tidak ditanda tidak akan dipaparkan.</p>`+L.map(m=>{const x=e.menus.find(y=>y.mid===m.id);return `<div style="padding:8px 0;border-bottom:1px solid var(--bd)"><label class="chk"><input type="checkbox" id="em${m.id}" ${x?'checked':''}><span style="color:var(--tx);font-size:16px">${esc(m.name)}${m.on?'':' (tidak aktif)'}</span></label><div class="row" style="margin-top:8px"><div><label>Harga acara (RM)</label><input id="ep${m.id}" inputmode="decimal" value="${x?x.price:m.price}"></div><div><label>Nota</label><input id="en${m.id}" value="${x?esc(x.note):''}"></div></div></div>`}).join(''),()=>{
  const n=[];for(const m of L){if(!$('#em'+m.id).checked)continue;const p=money(v('ep'+m.id));if(p==null)return`Harga ${m.name} tidak sah.`;n.push({mid:m.id,price:p,note:v('en'+m.id)})}
  e.menus=n})}
function arch(id){ask('Arkib acara ini? Ia boleh dipulihkan daripada Tetapan.',()=>{const i=events.findIndex(x=>x.id===id);if(i>=0)archived.push(...events.splice(i,1));V.ev=null},'Arkib')}
function restoreEv(id){const i=archived.findIndex(x=>x.id===id);if(i>=0)events.push(...archived.splice(i,1));render()}
function purgeEv(id){ask('Padam kekal acara ini beserta jualan dan kos? Tidak boleh dibatalkan.',()=>{archived=archived.filter(x=>x.id!==id)},'Padam kekal')}
function setSM(id,m){const e=E(id);if(e.salesMode===m)return;const has=m==='daily'?e.total!=null:Object.keys(e.daily).length;
 const sw=()=>{e.salesMode=m};has?ask(`Tukar kepada ${m==='daily'?'jualan harian':'satu jumlah'}? Hanya satu kaedah dikira supaya tiada pengiraan berganda. Data lama disimpan tetapi tidak dikira.`,sw,'Ya, tukar'):(sw(),render())}
function salesForm(id){const e=E(id);sheet('Jumlah jualan',`<label>Jumlah jualan (RM)</label><input id="s1" inputmode="decimal" value="${e.total??''}"><label>Tarikh rekod</label><input id="s2" type="date" value="${e.salesDate||today()}"><label>Nota (pilihan)</label><textarea id="s3">${esc(e.salesNote)}</textarea>`,()=>{const a=money(v('s1'));if(a==null)return'Masukkan jumlah sah, contoh 1250.50';if(!v('s2'))return'Pilih tarikh rekod.';e.total=a;e.salesDate=v('s2');e.salesNote=v('s3')})}
function dailyForm(id){const e=E(id);sheet('Jualan harian',dayList(e).map((d,i)=>`<label>${fd(d)}</label><input id="d${i}" inputmode="decimal" value="${e.daily[d]??''}">`).join(''),()=>{const n={};for(let i=0;i<dayList(e).length;i++){const s=v('d'+i).trim();if(s==='')continue;const a=money(s);if(a==null)return`Hari ${i+1}: jumlah tidak sah.`;n[dayList(e)[i]]=a}e.daily=n})}
function setCM(id,m){const e=E(id);if(e.costMode===m)return;if(!e.costMode){e.costMode=m;render();return}ask(`Tukar kepada Kaedah ${m}? Hanya satu kaedah dikira untuk untung. Data kaedah lama disimpan tetapi tidak dikira.`,()=>{e.costMode=m},'Ya, tukar')}
function expForm(id,xid){const e=E(id),o=xid?e.exp.find(y=>y.id===xid):null;
  const oldText=o?[o.cat&&o.cat!=='Lain-lain'?o.cat:'',o.desc].filter(Boolean).join(' - '):'';
  sheet(o?'Edit perbelanjaan':'Tambah perbelanjaan',`<label>Butiran kos</label><input id="x2" maxlength="200" placeholder="Contoh: Barang, tapak, minyak, pekerja" value="${esc(oldText)}"><label>Tarikh</label><input id="x3" type="date" value="${o?o.date:e.start}"><label>Jumlah (RM)</label><input id="x4" inputmode="decimal" value="${o?o.amt:''}">`,()=>{
   const a=money(v('x4'));if(a==null)return'Masukkan jumlah sah.';if(!v('x3'))return'Pilih tarikh.';
   const d=v('x2').trim();if(!d)return'Masukkan butiran kos.';
   const dt=v('x3'),c='Lain-lain';
   if(e.exp.some(y=>(!o||y.id!==o.id)&&y.cat===c&&y.date===dt&&y.amt===a&&y.desc.trim()===d))return'Perbelanjaan yang sama sudah direkod. Ubah butiran jika ia memang berasingan.';
   if(o)Object.assign(o,{cat:c,desc:d,date:dt,amt:a});else e.exp.push({id:newId(),cat:c,desc:d,date:dt,amt:a})
  })}

function delExp(id,x){ask('Padam perbelanjaan ini?',()=>{const e=E(id);e.exp=e.exp.filter(y=>y.id!==x)},'Padam')}
function capForm(id){const e=E(id);sheet('Jumlah modal acara',`<label>Jumlah modal (RM)</label><input id="c1" inputmode="decimal" value="${e.capital??''}">`,()=>{const a=money(v('c1'));if(a==null)return'Masukkan jumlah sah.';e.capital=a})}
function menulist(){return `<button class="btn or" onclick="menuForm()">+ Menu baharu</button>${menus.map(m=>{const n=events.filter(e=>e.menus.some(x=>x.mid===m.id)).length;return `<div class="card"><div class="item" style="border:0;padding:0"><b>${esc(m.name)}</b>${ub(m.id)}<span class="tag ${m.on?'completed':''}">${m.on?'Aktif':'Tidak aktif'}</span></div><div class="mut">${esc(m.cat)}${m.desc?' | '+esc(m.desc):''}</div><div class="kv"><span>Harga jual</span><b>${rm(m.price)}</b></div><div class="kv"><span>Anggaran kos seunit</span><b>${m.cost!=null?rm(m.cost):'Belum diisi'}</b></div><div class="kv"><span>Dibenarkan di</span><b>${n} acara</b></div><div class="row"><button class="btn ghost sm" onclick="menuForm('${m.id}')">Edit</button><button class="btn ghost sm" onclick="togMenu('${m.id}')">${m.on?'Nyahaktifkan':'Aktifkan'}</button></div></div>`}).join('')}<p class="mut">Anggaran kos seunit hanya rujukan dan tidak ditambah ke kos acara. Kos acara hanya datang daripada Kaedah A atau Kaedah B.</p><p class="mut">Menu terlaris tidak dipaparkan kerana hanya jumlah jualan acara direkod.</p>`}
function togMenu(id){const m=menus.find(x=>x.id===id);const used=events.some(e=>(e.status==='upcoming'||e.status==='ongoing')&&e.menus.some(x=>x.mid===id));if(m.on&&used)ask('Menu ini dipilih untuk acara akan datang. Nyahaktifkan juga? Ia kekal di acara itu tetapi tidak boleh dipilih untuk acara baharu.',()=>{m.on=false},'Nyahaktifkan');else{m.on=!m.on;render()}}
function menuForm(id){const m=menus.find(x=>x.id===id)||{name:'',cat:'',price:'',cost:'',desc:'',on:true};
 sheet(id?'Edit menu':'Menu baharu',`<label>Nama menu</label><input id="m1" value="${esc(m.name)}"><label>Kategori</label><input id="m2" value="${esc(m.cat)}"><div class="row"><div><label>Harga jual (RM)</label><input id="m3" inputmode="decimal" value="${m.price}"></div><div><label>Anggaran kos seunit (pilihan)</label><input id="m4" inputmode="decimal" value="${m.cost??''}"></div></div><label>Keterangan</label><textarea id="m5">${esc(m.desc)}</textarea><label class="chk"><input id="m6" type="checkbox" ${m.on?'checked':''}> <span style="color:var(--tx)">Aktif</span></label>${id?'<button class="btn red" onclick="delMenu(\''+id+'\')">Padam menu</button>':''}`,()=>{
 const p=money(v('m3')),cs=v('m4').trim(),c=cs===''?null:money(cs);if(!v('m1').trim())return'Sila isi nama menu.';if(p==null)return'Harga jual tidak sah.';if(cs!==''&&c==null)return'Kos tidak sah.';
 const d={name:v('m1').trim(),cat:v('m2').trim(),price:p,cost:c,desc:v('m5'),on:$('#m6').checked};if(id)Object.assign(menus.find(x=>x.id===id),d);else menus.push({id:newId(),...d})})}
function delMenu(id){if([...events,...archived].some(e=>e.menus.some(x=>x.mid===id))){$('#err').textContent='Menu ini digunakan dalam acara. Nyahaktifkan sahaja.';return}ask('Padam menu ini?',()=>{menus=menus.filter(x=>x.id!==id)},'Padam')}
function reports(){
 const L=events.filter(e=>e.status!=='cancelled'&&e.start.slice(0,4)===V.ry&&(V.rm==='all'||+e.start.slice(5,7)===+V.rm)).sort((a,b)=>b.start.localeCompare(a.start));
 const full=L.filter(complete),ven=locAgg(L),mg=(p,s)=>s>0?(p/s*100).toFixed(1)+'%':'-';
 const byM={};full.forEach(e=>{const c=calc(e),k=e.start.slice(5,7),o=byM[k]=byM[k]||{n:0,s:0,p:0};o.n++;o.s=sum([o.s,c.sales]);o.p=sum([o.p,c.profit])});
 const kv=(l,x,cls='')=>`<div class="kv"><span>${l}</span><b class="${cls}">${x}</b></div>`;
 return `<div class="card"><div class="row"><div><label>Tahun</label><select onchange="V.ry=this.value;render()">${['2025','2026','2027'].map(y=>`<option ${y===V.ry?'selected':''}>${y}</option>`).join('')}</select></div><div><label>Bulan</label><select onchange="V.rm=this.value;render()"><option value="all">Semua</option>${MN.map((m,i)=>`<option value="${i+1}" ${V.rm==i+1?'selected':''}>${m}</option>`).join('')}</select></div></div><p class="mut" style="margin:0">${L.length} acara dalam tempoh ini (acara dibatalkan tidak dikira). ${full.length} mempunyai rekod jualan dan kos yang lengkap.</p></div>
 <h3 class="sec">Perbandingan acara</h3>
 ${L.map(e=>{const c=calc(e);return `<div class="card"><div class="item" style="border:0;padding:0"><b>${esc(e.name)}</b>${ub(e.id)}<span class="tag ${e.status}">${ST[e.status]}</span></div><div class="mut">${esc(e.venue)} | ${fd(e.start)}${e.end!==e.start?' - '+fd(e.end):''} | ${nd(e)} hari</div>${kv('Jualan',c.sales!=null?rm(c.sales):'Belum direkod')}${kv('Kos'+(e.costMode?' (Kaedah '+e.costMode+')':''),c.cost!=null?rm(c.cost):'Belum direkod')}${kv('Untung / rugi',c.profit!=null?rm(c.profit):'-',c.profit==null?'':c.profit>=0?'pos':'neg')}${kv('Margin',c.margin!=null?c.margin.toFixed(1)+'%':'-')}${nd(e)>1?kv('Purata jualan harian',c.sales!=null?rm(c.sales/nd(e)):'-'):''}${c.profit==null?'<div class="warn">Data belum lengkap. Tidak dimasukkan dalam perbandingan lokasi.</div>':''}</div>`}).join('')||'<div class="card mut">Tiada acara dalam tempoh ini.</div>'}
 <h3 class="sec">Prestasi mengikut lokasi</h3><p class="mut" style="margin:0 4px 8px">Hanya acara dengan jualan dan kos lengkap dikira.</p>
 ${Object.entries(ven).map(([k,o])=>`<div class="card"><b>${esc(k)}</b><div class="mut">${o.n} acara dikira</div>${kv('Jumlah jualan',rm(o.s))}${kv('Jumlah kos',rm(o.c))}${kv('Untung / rugi',rm(o.p),o.p>=0?'pos':'neg')}${kv('Margin',mg(o.p,o.s))}</div>`).join('')||'<div class="card mut">Tiada acara dengan data lengkap dalam tempoh ini.</div>'}
 <h3 class="sec">Prestasi bulanan</h3>
 <div class="card">${Object.keys(byM).sort().map(k=>`<div class="item"><span>${MN[+k-1]} ${V.ry} <span class="mut">(${byM[k].n} acara)</span></span><span>Jualan ${rm(byM[k].s)}<br><b class="${byM[k].p>=0?'pos':'neg'}">Untung ${rm(byM[k].p)}</b></span></div>`).join('')||'<span class="mut">Tiada data lengkap.</span>'}</div>
 <p class="mut">Menu terlaris tidak dipaparkan kerana hanya jumlah jualan acara direkod. Tiada angka dianggar.</p><button class="btn" onclick="csvEvents()">Muat turun CSV acara</button><button class="btn ghost" onclick="csvExp()">Muat turun CSV perbelanjaan</button>`}

// ===== Lapisan data Supabase =====
const one=x=>Array.isArray(x)?x[0]:x;
const mapMenu=r=>({id:r.id,name:r.name,cat:r.category||'',price:+r.price,cost:r.est_cost==null?null:+r.est_cost,desc:r.description||'',on:r.active});
const mapEvent=r=>{const s=one(r.sales),c=one(r.capital);return{id:r.id,name:r.name,org:r.organizer||'',venue:r.venue||'',start:r.start_date,end:r.end_date,status:r.status,notes:r.notes||'',menus:(r.event_menus||[]).map(x=>({mid:x.menu_id,price:+x.price,note:x.note||''})).sort((a,b)=>a.mid<b.mid?-1:1),salesMode:r.sales_mode,total:s?+s.total:null,salesDate:s&&s.recorded_on||'',salesNote:s&&s.notes||'',daily:Object.fromEntries((r.daily_records||[]).map(d=>[d.day,+d.sales])),costMode:r.cost_mode,capital:c?+c.amount:null,exp:(r.expenses||[]).map(x=>({id:x.id,cat:x.category,desc:x.description||'',date:x.spent_on,amt:+x.amount}))}};
const ents=()=>[...menus.map(x=>['menu:'+x.id,x,0]),...events.map(x=>['event:'+x.id,x,0]),...archived.map(x=>['event:'+x.id,x,1])];
const sn=(k,x,a)=>k[0]==='m'?J(x):J({...x,_a:a});
const CK=()=>'vbm_'+S.user.id;
function persist(){try{localStorage.setItem(CK(),J({menus,events,archived,Q,META,SNAP}))}catch(_){}}
function loadCache(){try{const d=JSON.parse(localStorage.getItem(CK())||'null');if(d){menus=d.menus||[];events=d.events||[];archived=d.archived||[];Q=d.Q||{};META=d.META||{};SNAP=d.SNAP||{}}}catch(_){}}
function track(){let ch=0;const seen=new Set();
 for(const[k,x,a]of ents()){seen.add(k);const j=sn(k,x,a);if(SNAP[k]!==j){SNAP[k]=j;Q[k]='save';META[k]={...META[k],state:'pending',err:''};ch=1}}
 for(const k of Object.keys(SNAP))if(!seen.has(k)){delete SNAP[k];Q[k]='delete';META[k]={...META[k],state:'pending',err:''};ch=1}
 if(ch){persist();setTimeout(flush,300)}}
const isNet=m=>/fetch|network|load failed/i.test(m);
async function push(kind,id,op){
 if(kind==='menu'){
  if(op==='delete'){const{error}=await SB.from('menus').delete().eq('id',id);if(error)throw error;return}
  const m=menus.find(x=>x.id===id);if(!m)return;const row={id,name:m.name,category:m.cat,price:m.price,est_cost:m.cost,description:m.desc,active:m.on},base=(META['menu:'+id]||{}).base;
  const r=base?SB.from('menus').update(row).eq('id',id).eq('updated_at',base):SB.from('menus').upsert(row,{onConflict:'id'});
  const{data,error}=await r.select('updated_at');if(error)throw error;if(!data.length)throw{conflict:1,message:'KONFLIK'};
  META['menu:'+id]={...META['menu:'+id],base:data[0].updated_at};return}
 if(op==='delete'){const{error}=await SB.from('events').delete().eq('id',id);if(error)throw error;return}
 const e=events.find(x=>x.id===id)||archived.find(x=>x.id===id);if(!e)return;
 const{data,error}=await SB.rpc('save_event',{p:e,base:(META['event:'+id]||{}).base||null});if(error)throw error;
 const a=archived.includes(e);
 const r2=a?await SB.from('archived_events').upsert({event_id:id},{onConflict:'event_id'}):await SB.from('archived_events').delete().eq('event_id',id);
 if(r2.error)throw r2.error;
 META['event:'+id]={...META['event:'+id],base:data}}
async function flush(){
 if(flushing||!S.user||!SB||!navigator.onLine)return;flushing=true;let okN=0;
 const w=k=>({menu:0,event:1}[k.split(':')[0]]+(Q[k]==='delete'?2:0));
 try{for(const key of Object.keys(Q).sort((a,b)=>w(a)-w(b))){
  const m=META[key]||{};if(m.state==='conflict'||m.state==='error')continue;
  const[kind,id]=key.split(':'),op=Q[key],before=SNAP[key];
  try{await push(kind,id,op);okN++;if(Q[key]===op&&SNAP[key]===before){delete Q[key];META[key]={...META[key],state:'synced',err:''}}}
  catch(er){const msg=String(er.message||er);
   if(er.conflict||msg.includes('KONFLIK'))META[key]={...META[key],state:'conflict'};
   else if(isNet(msg))break;
   else{META[key]={...META[key],state:'error',err:er.code==='23505'?'Data duplikat (nama dan tarikh yang sama)':msg}}}}
 }finally{flushing=false;persist()}
 if(okN&&!Object.keys(Q).length){doneSync();toast('Disimpan ke pelayan')}else if(okN)toast('Sebahagian disimpan ke pelayan');
 render()}
async function pull(){
 const[m,e]=await Promise.all([SB.from('menus').select('*').order('created_at'),SB.from('events').select('*,event_menus(*),sales(*),daily_records(*),expenses(*),capital(*),archived_events(*)').order('start_date',{ascending:false})]);
 if(m.error)throw m.error;if(e.error)throw e.error;
 const mm=[],locM=menus;m.data.forEach(r=>{const k='menu:'+r.id;if(Q[k]==='delete')return;const l=locM.find(x=>x.id===r.id);if(Q[k]&&l){mm.push(l);return}mm.push(mapMenu(r));META[k]={state:'synced',base:r.updated_at}});
 locM.forEach(l=>{if(Q['menu:'+l.id]&&Q['menu:'+l.id]!=='delete'&&!m.data.some(r=>r.id===l.id))mm.push(l)});
 const locA=new Set(archived.map(x=>x.id)),locAll=[...events,...archived],ev=[],ar=[];
 e.data.forEach(r=>{const k='event:'+r.id;if(Q[k]==='delete')return;const l=locAll.find(x=>x.id===r.id);
  if(Q[k]&&l){(locA.has(r.id)?ar:ev).push(l);return}
  (one(r.archived_events)?ar:ev).push(mapEvent(r));META[k]={state:'synced',base:r.updated_at}});
 locAll.forEach(l=>{const k='event:'+l.id;if(Q[k]&&Q[k]!=='delete'&&!e.data.some(r=>r.id===l.id))(locA.has(l.id)?ar:ev).push(l)});
 const old=SNAP;menus=mm;events=ev;archived=ar;SNAP={};
 for(const[k,x,a]of ents())SNAP[k]=Q[k]?old[k]:sn(k,x,a);
 persist()}
function doneSync(){if(!S.err&&!Object.keys(Q).length)S.sync=Date.now()}
async function boot(){S.loading=true;S.ready=false;render();loadCache();
 if(navigator.onLine){await flush();try{await pull();S.err=''}catch(er){S.err='Gagal memuat daripada pelayan: '+(er.message||er)}}
 S.loading=false;S.ready=true;doneSync();render()}
async function syncNow(){if(!S.user||!SB)return;await flush();try{await pull();S.err=''}catch(er){S.err='Gagal menyegerak: '+(er.message||er)}doneSync();render()}
async function resolveC(k,how){const[kd,id]=k.split(':');try{
 if(how==='server'){delete Q[k];META[k]={state:'synced'};await pull()}
 else{const{data,error}=await SB.from(kd==='menu'?'menus':'events').select('updated_at').eq('id',id).maybeSingle();if(error)throw error;META[k]={state:'pending',base:data?data.updated_at:null};Q[k]='save'}
 persist();render();flush()}catch(er){toast('Gagal: '+(er.message||er),1)}}
function retry(k){META[k]={...META[k],state:'pending',err:''};render();flush()}
// ===== Log masuk =====
function loginView(){return `<div class="card" style="margin-top:24px"><h3>Log masuk pemilik</h3>${S.cfg?'<div class="warn">Aplikasi belum disambungkan ke Supabase. Semak pembolehubah persekitaran (lihat PANDUAN_BM.md).</div>':''}<label>Emel</label><input id="lg1" type="email" autocomplete="username" inputmode="email"><label>Kata laluan</label><input id="lg2" type="password" autocomplete="current-password"><p id="lgerr" class="err"></p><button class="btn or" onclick="doLogin()">Log masuk</button></div>`}
async function doLogin(){if(!SB)return;const em=v('lg1').trim(),pw=v('lg2');if(!em||!pw){$('#lgerr').textContent='Isi emel dan kata laluan.';return}
 $('#lgerr').textContent='Sedang log masuk...';const{data,error}=await SB.auth.signInWithPassword({email:em,password:pw});
 if(error){$('#lgerr').textContent=/invalid/i.test(error.message)?'Emel atau kata laluan salah.':isNet(error.message)?'Tiada sambungan internet.':'Gagal log masuk: '+error.message;return}
 S.user=data.user;boot()}
function doLogout(){const out=async()=>{await SB.auth.signOut();try{localStorage.removeItem(CK())}catch(_){}S.user=null;S.ready=false;menus=[];events=[];archived=[];Q={};META={};SNAP={};render()};
 Object.keys(Q).length?ask('Ada perubahan belum disegerak. Jika log keluar, ia akan hilang. Teruskan?',()=>{out()},'Log keluar juga'):out()}
// ===== Paparan, status, notifikasi =====
function render(){
 if(!S.user){$('#nav').innerHTML='';$('#app').innerHTML=loginView();updateBar();return}
 if(S.loading){$('#nav').innerHTML='';$('#app').innerHTML='<div class="card"><h3>Memuatkan data...</h3><p class="mut">Sila tunggu.</p></div>';updateBar();return}
 if(V.ev&&!events.some(x=>x.id===V.ev))V.ev=null;
 if(S.ready)track();renderApp();updateBar()}
function updateBar(){const b=$('#bar');if(!b)return;const n=Object.keys(Q).length,c=Object.values(META).filter(m=>m.state==='conflict').length,er=Object.values(META).filter(m=>m.state==='error').length;let t,ok=0;
 if(!S.user)t='Belum log masuk';else if(!navigator.onLine)t='Luar talian. '+(n?n+' perubahan belum disegerak.':'Data di telefon.');
 else if(c)t=c+' konflik. Buka Tetapan untuk selesaikan.';else if(er)t=er+' rekod gagal disimpan. Buka Tetapan.';else if(n)t=n+' perubahan belum disegerak ke pelayan.';
 else if(S.sync){t='Disegerakkan dengan pelayan pada '+new Date(S.sync).toLocaleTimeString('ms-MY',{timeZone:'Asia/Kuala_Lumpur',hour:'2-digit',minute:'2-digit'});ok=1}else t='Belum disahkan dengan pelayan';
 b.textContent=t;b.classList.toggle('ok',!!ok)}
let tt;function toast(m,bad){const t=$('#toast');t.textContent=m;t.className=bad?'bad':'';t.style.display='block';clearTimeout(tt);tt=setTimeout(()=>t.style.display='none',3500)}
const ub=id=>{const m=META['event:'+id]||META['menu:'+id];return m&&m.state!=='synced'?` <span class="tag" style="background:var(--o);color:#1d1100">${m.state==='conflict'?'Konflik':m.state==='error'?'Ralat':'Belum disegerak'}</span>`:''};
// ===== Eksport, sandaran, pulih =====
const cell=x=>{let s=String(x==null?'':x);if(typeof x==='string'&&/^[=+\-@\t\r]/.test(s))s="'"+s;return /[",\n\r;]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
const csv=r=>'\ufeff'+r.map(x=>x.map(cell).join(',')).join('\r\n');
function dl(n,t,m){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:m}));a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
function csvEvents(){dl('acara-'+today()+'.csv',csv([['Acara','Penganjur','Lokasi','Mula','Tamat','Hari','Status','Kaedah kos','Jualan (RM)','Kos (RM)','Untung (RM)','Margin (%)'],...events.map(e=>{const c=calc(e);return[e.name,e.org,e.venue,fd(e.start),fd(e.end),nd(e),ST[e.status],e.costMode||'',c.sales,c.cost,c.profit,c.margin==null?'':c.margin.toFixed(1)]})]),'text/csv');toast('CSV dimuat turun')}
function csvExp(){dl('perbelanjaan-'+today()+'.csv',csv([['Acara','Tarikh','Kategori','Keterangan','Jumlah (RM)','Dikira dalam untung?'],...events.flatMap(e=>e.exp.map(x=>[e.name,fd(x.date),x.cat,x.desc,x.amt,e.costMode==='A'?'Ya':'Tidak (Kaedah '+(e.costMode||'belum dipilih')+')']))]),'text/csv');toast('CSV dimuat turun')}
function backup(){dl('sandaran-vbm-'+today()+'.json',J({v:1,at:new Date().toISOString(),menus,events,archived}),'application/json');toast('Sandaran dimuat turun. Simpan di Google Drive.')}
function restoreFile(i){const f=i.files[0];if(!f)return;f.text().then(t=>{let d;try{d=JSON.parse(t)}catch(_){toast('Fail sandaran tidak sah',1);return}
 if(d.v!==1||!Array.isArray(d.menus)||!Array.isArray(d.events))return toast('Format sandaran tidak dikenali',1);
 const ar=d.archived||[],ok=x=>x&&typeof x.id==='string'&&/^[0-9a-f-]{36}$/.test(x.id);
 if(![...d.menus,...d.events,...ar].every(ok))return toast('Sandaran mengandungi ID tidak sah',1);
 ask(`Pulihkan ${d.menus.length} menu dan ${d.events.length+ar.length} acara? Rekod dengan ID sama akan ditimpa. Rekod lain tidak dipadam.`,()=>{
  const up=(a,x)=>{const j=a.findIndex(y=>y.id===x.id);j<0?a.push(x):a[j]=x};
  d.menus.forEach(x=>up(menus,x));d.events.forEach(x=>{archived=archived.filter(y=>y.id!==x.id);up(events,x)});ar.forEach(x=>{events=events.filter(y=>y.id!==x.id);up(archived,x)})},'Pulihkan')})}
function settings(){
 const P=Object.entries(META).filter(([k])=>Q[k]),nm=k=>{const[kd,id]=k.split(':');const x=(kd==='menu'?menus:[...events,...archived]).find(y=>y.id===id);return x?x.name:'(dipadam)'};
 const L={pending:'Menunggu',conflict:'Konflik: data ini berubah di peranti lain',error:'Ralat'};
 return `<div class="card"><h3>Akaun</h3><p class="mut">${esc(S.user.email)}</p><button class="btn ghost" onclick="doLogout()">Log keluar</button></div>
 <div class="card"><h3>Penyegerakan</h3><p id="barcopy" class="mut">${esc($('#bar').textContent)}</p>${S.err?`<div class="warn">${esc(S.err)}</div>`:''}<button class="btn" onclick="syncNow()">Segerak sekarang</button>${P.map(([k,m])=>`<div class="item"><span><b>${esc(nm(k))}</b><br><span class="mut">${esc(L[m.state]||m.state)}${m.state==='error'&&m.err?': '+esc(m.err):''}</span></span>${m.state==='conflict'?`<span><button class="btn sm" onclick="resolveC('${k}','server')">Guna versi pelayan</button><button class="btn ghost sm" onclick="resolveC('${k}','mine')">Simpan versi saya</button></span>`:m.state==='error'?`<button class="btn sm" onclick="retry('${k}')">Cuba semula</button>`:''}</div>`).join('')}</div>
 <div class="card"><h3>Acara diarkib</h3>${archived.map(e=>`<div class="item"><span><b>${esc(e.name)}</b>${ub(e.id)}<br><span class="mut">${fd(e.start)}</span></span><span><button class="btn sm" onclick="restoreEv('${e.id}')">Pulihkan</button><button class="btn ghost sm" onclick="purgeEv('${e.id}')">Padam kekal</button></span></div>`).join('')||'<p class="mut">Tiada.</p>'}</div>
 <div class="card"><h3>Eksport dan sandaran</h3><button class="btn" onclick="backup()">Muat turun sandaran penuh (JSON)</button><button class="btn ghost" onclick="csvEvents()">CSV acara</button><button class="btn ghost" onclick="csvExp()">CSV perbelanjaan</button><label>Pulihkan daripada fail sandaran</label><input type="file" accept=".json,application/json" onchange="restoreFile(this)"></div>
 <div class="card"><h3>Tetapan</h3><div class="item"><span>Bahasa</span><b>Bahasa Melayu</b></div><div class="item"><span>Mata wang</span><b>RM</b></div><div class="item"><span>Zon masa</span><b>Asia/Kuala_Lumpur</b></div></div>
 <div class="card"><h3>Semakan pengiraan</h3>${testHTML()}</div>`}
function init(){
 if('serviceWorker' in navigator&&import.meta.env.PROD)navigator.serviceWorker.register('/sw.js').catch(()=>{});
 addEventListener('online',()=>syncNow());addEventListener('offline',()=>render());
 if(!SB){render();return}
 SB.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'&&S.user){S.user=null;S.ready=false;render()}});
 SB.auth.getSession().then(({data})=>{S.user=data.session?data.session.user:null;S.user?boot():render()})}

Object.assign(window,{V,arch,ask,backup,boot,calc,capForm,closeS,csvEvents,csvExp,dailyForm,dayList,delExp,delMenu,detail,dl,doLogin,doLogout,doSave,doneSync,evForm,evMenuForm,evlist,expForm,filtered,flush,go,home,init,loadCache,locAgg,loginView,menuForm,menulist,persist,pull,purgeEv,push,render,renderApp,reports,resolveC,restoreEv,restoreFile,retry,runTests,salesForm,setCM,setSM,settings,sheet,stat,syncNow,testHTML,togMenu,track,updateBar});
init();
