
const OLD_IMAGE_BASE = 'https://catherine-website.herokuapp.com/static/img/';
const escapeHtml = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const stripHtml = (s='') => { const d=document.createElement('div'); d.innerHTML=s; return (d.textContent||'').replace(/\s+/g,' ').trim(); };
const shortText = (s,n=190) => { const t=stripHtml(s); return t.length>n ? t.slice(0,n).replace(/\s+\S*$/,'')+'…' : t; };
function detailsMarkup(item){
  const media=(item.links||[]).filter(Boolean).join('');
  const buy=item.buybtn||'';
  const press=(item.press||[]).filter(Boolean).map(u=>`<p><a href="${escapeHtml(u)}" target="_blank" rel="noopener">Press / review ↗</a></p>`).join('');
  return `<details><summary><span>${escapeHtml(item.title)}${item.year?` <small>(${escapeHtml(item.year)})</small>`:''}</span></summary><div class="detail-body">${buy}${media}${item.desc||''}${press}</div></details>`;
}
async function loadContent(){
  const r=await fetch('assets/content.json'); const data=await r.json();
  const featuredNames=['The Yellow Wallpaper','The Last Call: A Collaborative Oratorio','Andrew Wyeth in Music, Dance, Imagery, and Poetry'];
  document.querySelector('#featured-work').innerHTML=featuredNames.map(name=>{
    const m=data.musicals.find(x=>x.title===name); if(!m)return'';
    return `<article class="feature-card"><p class="eyebrow">Featured work</p><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(shortText(m.desc,220))}</p></article>`;
  }).join('');
  document.querySelector('#theatrical-list').innerHTML=data.musicals.map(detailsMarkup).join('');
  document.querySelector('#instrumental-list').innerHTML=data.instrumental.map(detailsMarkup).join('');
  document.querySelector('#orchestration-list').innerHTML=data.orchestration.map(detailsMarkup).join('');
  document.querySelector('#director-list').innerHTML=data.director.map(x=>`<article class="card"><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(shortText(x.desc,180))}</p></article>`).join('');
  document.querySelector('#pianist-list').innerHTML=data.pianist.map(x=>`<article class="mini"><h4>${escapeHtml(x.title)}</h4><p>${escapeHtml(shortText(x.desc,130))}</p></article>`).join('');
  document.querySelector('#teaching-list').innerHTML=data.teaching.map(x=>`<article class="timeline-item"><div class="year">${escapeHtml(x.year||'Selected program')}</div><div><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.desc)}</p></div></article>`).join('');
  document.querySelector('#painting-grid').innerHTML=data.paintings.map(p=>`<figure class="painting"><img src="${OLD_IMAGE_BASE}${encodeURI(p.filename)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.minHeight='180px';this.alt='Artwork image will be migrated from the old site';"><figcaption>${escapeHtml(p.name)}</figcaption></figure>`).join('');
}
function formatEventDate(event){
  if(!event.start)return{date:'Date TBA',time:''};
  const allDay=!!event.allDay;
  const d=new Date(allDay?event.start+'T12:00:00':event.start);
  return {
    date:new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'}).format(d),
    time:allDay?'All day':new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(d)
  };
}
async function loadCalendar(){
  const list=document.querySelector('#events-list'), status=document.querySelector('#events-status');
  try{
    const r=await fetch('events.json',{cache:'no-store'}); if(!r.ok)throw new Error(`events.json returned ${r.status}`);
    const json=await r.json(); const events=json.events||[];
    if(!events.length){
      list.innerHTML='<article class="event-card"><p class="event-date">Nothing scheduled</p><h3>No upcoming public events</h3><p class="event-meta">Check back soon.</p></article>';
      return;
    }
    list.innerHTML=events.map(e=>{
      const f=formatEventDate(e);
      const title=escapeHtml(e.title||'Untitled event');
      const meta=`${escapeHtml(f.time)}${e.location?` · ${escapeHtml(e.location)}`:''}`;
      const body=e.description?`<p>${escapeHtml(shortText(e.description,150))}</p>`:'';
      const titleMarkup=e.url?`<h3><a href="${escapeHtml(e.url)}" target="_blank" rel="noopener">${title}</a></h3>`:`<h3>${title}</h3>`;
      return `<article class="event-card"><p class="event-date">${escapeHtml(f.date)}</p>${titleMarkup}<p class="event-meta">${meta}</p>${body}</article>`;
    }).join('');
    if(json.generatedAt){
      const refreshed=new Date(json.generatedAt);
      status.textContent=`Calendar last synced ${new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(refreshed)}.`;
    }
  }catch(err){
    list.innerHTML='<article class="event-card"><p class="event-date">Calendar unavailable</p><h3>Events could not be loaded</h3><p class="event-meta">The static calendar feed has not been generated yet. See README.md.</p></article>';
    status.textContent=err.message;
  }
}
document.querySelector('.menu').addEventListener('click',()=>{const h=document.querySelector('.site-header');h.classList.toggle('open');document.querySelector('.menu').setAttribute('aria-expanded',h.classList.contains('open'));});
document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>document.querySelector('.site-header').classList.remove('open')));
document.querySelector('#year').textContent=new Date().getFullYear();
loadContent(); loadCalendar();
