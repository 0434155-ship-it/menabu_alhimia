(() => {
'use strict';
const el=id=>document.getElementById(id);
const names={craft:'Наше ремесло',catalog:'Каталог',food:'Еда',about:'Про нас',awards:'Награды пекарни',founder:'Слово основателя',journal:'Трактат пекарни',specialty:'Спешелти',contacts:'Контакты',wholesale:'Для своих',stollen:'Штоллен',panettone:'Панеттоне'};
const areas=[...document.querySelectorAll('main > [data-area]')];
const separateAreas=new Set(['wholesale',...Object.keys(SEASONAL)]);
function menu(open){
 el('menuToggle').setAttribute('aria-expanded',String(open));
 el('menuToggle').setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');el('mobileNav').hidden=!open;
}
function route(initial){
 let key=location.hash.slice(1);
 if (['stollen','panettone','foodcake'].includes(key)) {
   location.replace('preorder/#' + key);
   return;
 }
 const chosenProduct = key.startsWith('product-') ? P.find(p => p.id === key.slice(8)) : null;
 if (chosenProduct) {
   selectCategory(chosenProduct.c);
   const position = P.filter(p => p.c === chosenProduct.c).findIndex(p => p.id === chosenProduct.id);
   if (visibleProducts <= position) {
     visibleProducts = 8 * Math.ceil((position + 1) / 8);
     renderGrid(false);
   }
   key = 'catalog';
 }
 else if(key==='exclusive'){selectCategory('exclusive');key='catalog'}
 else if(key==='catalog' && cat==='exclusive'){selectCategory('bread')}
 if(!Object.hasOwn(names,key)||(SEASONAL[key]&&!SEASONAL[key].open))key='top';
 const separate=separateAreas.has(key);
 document.body.dataset.view=key in SEASONAL?key:'home';document.body.classList.toggle('opt-page',key==='wholesale');
 areas.forEach(a=>{a.hidden=separate?a.dataset.area!==key:separateAreas.has(a.dataset.area)});
 el('breadcrumbs').hidden=!separate;el('crumbName').textContent=names[key]||'';
 const section = key === 'awards' ? 'about' : key;
 document.querySelectorAll('header nav a').forEach(a=>{if(a.hash==='#'+section)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});
 menu(false);
 const target=chosenProduct ? el('grid').querySelector('[data-card="' + chosenProduct.id + '"]') : key==='top'||separate?null:el(key);
 function move(){if(target)target.scrollIntoView({block:'start',behavior:'instant'});else scrollTo({top:0,behavior:'instant'})}
 if(!initial||location.hash){requestAnimationFrame(()=>requestAnimationFrame(move))}
 if(!initial&&separate){const dest=el(key)?.querySelector('h2');if(dest){dest.tabIndex=-1;dest.focus({preventScroll:true})}}
 observeRv();onScroll();document.dispatchEvent(new Event('bakeryroute'));
}
route(true);addEventListener('hashchange',()=>route(false));
document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||a.hasAttribute('data-policy'))return;if(a.hash&&a.origin===location.origin&&a.pathname===location.pathname&&a.hash===location.hash){e.preventDefault();route(false)}});
el('menuToggle').onclick=()=>menu(el('mobileNav').hidden);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!el('mobileNav').hidden){menu(false);el('menuToggle').focus()}});
const cover = el('home-cover');
const slides = [...cover.querySelectorAll('.cover-photo [data-slide]')];
const shotButtons = [...document.querySelectorAll('button[data-shot]')];
const shotPause = el('shotPause');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let shot = Math.max(0, slides.findIndex(photo => photo.classList.contains('active')));
let pausedCover = reducedMotion.matches;
let coverTimer = 0;
let swipeStart = null;

function scheduleCover() {
  clearTimeout(coverTimer);
  if (pausedCover || document.hidden || cover.hidden || swipeStart) return;
  coverTimer = setTimeout(() => selectShot((shot + 1) % slides.length), 15000);
}
function selectShot(index) {
  shot = index;
  slides.forEach((photo, i) => {
    photo.classList.toggle('active', i === shot);
    photo.setAttribute('aria-hidden', String(i !== shot));
  });
  shotButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === shot)));
  el('shotName').textContent = shotButtons[shot].getAttribute('aria-label');
  scheduleCover();
}
function pauseCover(value) {
  pausedCover = value;
  shotPause.setAttribute('aria-label', value ? 'Запустить смену фотографий' : 'Приостановить смену фотографий');
  shotPause.dataset.paused = String(value);
  scheduleCover();
}
shotButtons.forEach((button, i) => button.addEventListener('click', () => selectShot(i)));
shotPause.addEventListener('click', () => pauseCover(!pausedCover));
cover.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'touch') return;
  swipeStart = event.isPrimary && !event.target.closest('a, button')
    ? { id: event.pointerId, x: event.clientX, y: event.clientY }
    : null;
  if (swipeStart) cover.setPointerCapture(event.pointerId);
  scheduleCover();
});
function finishCoverSwipe(event) {
  if (!swipeStart || event.pointerId !== swipeStart.id) return;
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  swipeStart = null;
  if (event.type === 'pointerup' && Math.abs(dx) >= 40 && Math.abs(dx) > 1.25 * Math.abs(dy)) {
    const step = dx < 0 ? 1 : -1;
    selectShot((shot + step + slides.length) % slides.length);
    return;
  }
  scheduleCover();
}
cover.addEventListener('pointerup', finishCoverSwipe);
cover.addEventListener('pointercancel', finishCoverSwipe);
reducedMotion.addEventListener('change', event => pauseCover(event.matches));
document.addEventListener('visibilitychange', scheduleCover);
document.addEventListener('bakeryroute', scheduleCover);
selectShot(shot);
pauseCover(pausedCover);

const photos=[
 ['img/2093_1.jpg','Эклеры на витрине','2093'],
 ['img/2050_1.jpg','На кухне пекарни','2050'],
 ['img/2041_2.jpg','Детали на витрине','2041'],
 ['img/2030_1c.jpg','Слоёный куб','2030'],
 ['img/2000_1c.jpg','Слоёное тесто и шоколад','2000'],
 ['img/1992_1.jpg','Свежая партия булочек','1992'],
 ['img/1949_1.jpg','Десерт с малиной','1949'],
 ['img/1459_1.jpg','Ягодные тарты','1459'],
 ['muka/bar.webp','Круассаны у деревянной стойки',null]];
const reel=el('reel'),frag=document.createDocumentFragment();
for(let repeat=0;repeat<2;repeat++)photos.forEach(([src,alt,post],i)=>{const a=document.createElement('a');if(post){a.href='https://t.me/menabu_bakery/'+post;a.target='_blank';a.rel='noopener'}else{a.href='#about'}a.className='frame';if(repeat){a.tabIndex=-1;a.setAttribute('aria-hidden','true')}const im=document.createElement('img');im.src=mnbMedia(src);im.loading='lazy';im.alt=repeat?'':alt;const cap=document.createElement('span');cap.textContent=alt;a.append(im,cap);frag.append(a)});
reel.replaceChildren(frag);
const reelPause = el('reelPause');
let reelPaused = reducedMotion.matches;
function pauseReel(value) {
  reelPaused = value;
  reel.classList.toggle('still', value);
  reelPause.dataset.paused = String(value);
  reelPause.setAttribute('aria-label', value ? 'Запустить ленту фотографий' : 'Приостановить ленту фотографий');
}
pauseReel(reelPaused);
reelPause.addEventListener('click', () => pauseReel(!reelPaused));
reducedMotion.addEventListener('change', event => pauseReel(event.matches));

// Лента продукции на публичной странице для партнёров.
const tradeFilm = el('tradeShelf');
const tradeFrames = Array.from(tradeFilm.querySelectorAll('figure'));
const tradePause = el('tradePause');
let tradePlaying = !reducedMotion.matches;
let tradeVisible = false;
let tradeTimer;

function moveTradePage(direction) {
  const step = tradeFrames[1].offsetLeft - tradeFrames[0].offsetLeft;
  if (!step) return;
  const count = Number(getComputedStyle(tradeFilm).getPropertyValue('--shelf-count'));
  const last = Math.max(tradeFrames.length - count, 0);
  const first = Math.min(last, Math.round(tradeFilm.scrollLeft / step));
  let next;
  if (direction > 0) next = first === last ? 0 : Math.min(first + count, last);
  else next = first === 0 ? last : Math.max(first - count, 0);
  tradeFilm.scrollTo({left:next * step, behavior:reducedMotion.matches ? 'instant' : 'smooth'});
}

function scheduleTradePage() {
  clearTimeout(tradeTimer);
  if (!tradePlaying || !tradeVisible || document.hidden) return;
  tradeTimer = setTimeout(() => {
    moveTradePage(1);
    scheduleTradePage();
  }, 6500);
}

function playTrade(playing) {
  tradePlaying = playing;
  tradePause.dataset.paused = String(!playing);
  tradePause.setAttribute('aria-label', playing ? 'Приостановить ленту продукции' : 'Запустить ленту продукции');
  scheduleTradePage();
}

function stepTrade(direction) {
  playTrade(false);
  moveTradePage(direction);
}
el('tradePrev').onclick = () => stepTrade(-1);
el('tradeNext').onclick = () => stepTrade(1);
tradePause.onclick = () => playTrade(!tradePlaying);
tradeFilm.addEventListener('pointerdown', () => playTrade(false), {passive:true});
tradeFilm.addEventListener('wheel', event => { if (event.deltaX || event.shiftKey) playTrade(false); }, {passive:true});
tradeFilm.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  stepTrade(event.key === 'ArrowLeft' ? -1 : 1);
});
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    tradeVisible = entry.isIntersecting;
    scheduleTradePage();
  }).observe(tradeFilm);
} else {
  const checkTradeRoute = () => { tradeVisible = !el('wholesale').hidden; scheduleTradePage(); };
  document.addEventListener('bakeryroute', checkTradeRoute);
  checkTradeRoute();
}
document.addEventListener('visibilitychange', scheduleTradePage);
reducedMotion.addEventListener('change', event => playTrade(!event.matches));
playTrade(tradePlaying);

const groups=window.MENU_GROUPS,details=window.MENU_DETAIL,cats=el('foodCats'),list=el('dishList'),card=el('dishCard'),slot=el('deskDish'),dlg=el('menuDialog'),mobile=matchMedia('(max-width:760px)');
let group=0,chosen=2,unfold=false;
const money=n=>Number(n).toLocaleString('ru-RU')+' ₽';
const brief=p=>typeof p==='number'?money(p):'от '+money(Math.min(...Object.values(p)));
const price=p=>typeof p==='number'?money(p):Object.entries(p).map(([k,n])=>(k==='целый'?'Целиком':k[0].toUpperCase()+k.slice(1))+' '+money(n)).join(' · ');
const item=()=>details[group][chosen];
const warmed=new Set();function warm(d){if(!d||warmed.has(d.id))return;warmed.add(d.id);const im=new Image();im.decoding='async';im.src=mnbMedia(d.photo)}
const param=new URLSearchParams(location.search).get('dish');
for(let n=0;n<details.length;n++){const j=details[n].findIndex(d=>d.id===param||(param==='zapekanka'&&d.id==='f002'));if(j!==-1){group=n;chosen=j;unfold=true;break}}
function linkState(){try{const u=new URL(location.href);u.searchParams.set('dish',item().id);history.replaceState(null,'',u)}catch{}}
const firstPizza = groups.findIndex(g => g.family === 'pizza');
const groupChoices = groups.map((g, i) => i).filter(i => !groups[i].family || i === firstPizza);
const pizzaKinds = el('pizzaKinds');
function groupButton(container, title, index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = title;
  button.dataset.group = String(index);
  button.addEventListener('click', () => {
    if (group === index) return;
    group = index; chosen = 0; unfold = false;
    renderList(); linkState();
  });
  container.append(button);
}
groupChoices.forEach(i => groupButton(cats, i === firstPizza ? 'Пицца' : groups[i].title, i));
groups.forEach((g, i) => { if (g.family === 'pizza') groupButton(pizzaKinds, g.title, i); });
function renderList(){slot.append(card);list.replaceChildren();const g=groups[group];
 const pizza = g.family === 'pizza';
 const topGroup = pizza ? firstPizza : group;
 [...cats.children].forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.group) === topGroup)));
 [...pizzaKinds.children].forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.group) === group)));
 pizzaKinds.hidden = !pizza;
 el('food').classList.toggle('pizza-menu', pizza);
 el('foodSeq').textContent=String(groupChoices.indexOf(topGroup)+1).padStart(2,'0')+' / '+String(groupChoices.length).padStart(2,'0');
 el('foodTitle').textContent=pizza ? g.title+' пицца' : g.title;
 g.rows.forEach(([name,w,p],i)=>{const box=document.createElement('div'),b=document.createElement('button'),n=document.createElement('span'),weight=document.createElement('small'),cost=document.createElement('b');box.className='dish-item';box.setAttribute('role','listitem');b.type='button';b.className='dish-choice';b.id='choose-'+details[group][i].id;b.setAttribute('aria-controls','dishCard');n.textContent=name;weight.textContent=details[group][i].weight||w;cost.textContent=brief(p);b.append(n,weight,cost);box.append(b);list.append(box);
 b.addEventListener('pointerenter',()=>warm(details[group][i]),{once:true});b.addEventListener('focus',()=>warm(details[group][i]),{once:true});
 b.onclick=()=>choose(i,{toggle:true,scroll:mobile.matches});
 b.onkeydown=e=>{const keys={ArrowDown:(i+1)%g.rows.length,ArrowUp:(i-1+g.rows.length)%g.rows.length,Home:0,End:g.rows.length-1};if(e.key in keys){e.preventDefault();choose(keys[e.key],{focus:true,scroll:true})}}});
 renderCard(false)}
function renderCard(announce){const d=item(),[name,w,p]=groups[group].rows[chosen];const visible=!mobile.matches||unfold;
 [...list.children].forEach((wrap,i)=>{const b=wrap.firstElementChild;const selected=i===chosen&&visible;b.classList.toggle('chosen',selected);if(mobile.matches){b.setAttribute('aria-expanded',String(selected));b.removeAttribute('aria-pressed')}else{b.setAttribute('aria-pressed',String(selected));b.removeAttribute('aria-expanded')}});
 (mobile.matches&&unfold?list.children[chosen]:slot).append(card);card.hidden=!visible;
 const photo=el('dishPhoto');if(photo.dataset.for!==d.id){photo.dataset.ready='no';photo.onload=()=>{photo.dataset.ready='yes'};photo.onerror=()=>{photo.dataset.ready='error'};photo.src=mnbMedia(d.photo);photo.dataset.for=d.id;if(photo.complete&&photo.naturalWidth)photo.dataset.ready='yes'}photo.alt=name;
 el('dishZoom').setAttribute('aria-label','Увеличить фото: '+name);el('dishName').textContent=name;el('dishDescription').textContent=d.desc;
 el('dishWeight').textContent=d.weight||w;el('dishPrice').textContent=price(p);
 const pizza = groups[group].family === 'pizza'; el('dishNutrition').hidden=pizza; el('dishNutritionNote').hidden=!pizza;
 for(const [id,k,u] of [['dishK','k',' ккал'],['dishB','b',' г'],['dishF','f',' г'],['dishC','c',' г']])el(id).textContent=d[k]==null?'Не указано':d[k]+u;
 el('dishAllergens').textContent=d.allergens?d.allergens+'.':'В меню не указаны. Уточните состав у сотрудника пекарни.';
 el('dishCounter').textContent=(chosen+1)+' / '+groups[group].rows.length;
 if(announce&&visible)el('dishStatus').textContent=name+' — фотография и описание открыты.';
}
function choose(i,opt={}){const clickedSame=i===chosen;unfold=!(mobile.matches&&opt.toggle&&clickedSame&&unfold);chosen=i;renderCard(true);linkState();const b=list.children[i].firstElementChild;
 if(opt.focus)b.focus({preventScroll:true});if(opt.scroll&&mobile.matches){const r=b.getBoundingClientRect();if(r.top<document.querySelector('header.top').offsetHeight||r.top>innerHeight*.68)b.scrollIntoView({block:'start',behavior:'instant'})}}
function step(n){const len=groups[group].rows.length;choose((chosen+n+len)%len,{scroll:!dlg.open});if(dlg.open)drawDialog()}
el('prevDish').onclick=()=>step(-1);el('nextDish').onclick=()=>step(1);
function drawDialog(){
 const cap=groups[group].rows[chosen][0]+' · '+(chosen+1)+' / '+groups[group].rows.length;
 dlg.dataset.display='photo';el('dialogCap').textContent=cap;el('dialogScan').alt=cap;el('dialogScan').src=mnbMedia(item().photo);dlg.scrollTop=0;
}
el('dishZoom').onclick=()=>{drawDialog();dlg.showModal();el('dialogClose').focus()};
el('dialogClose').onclick=()=>dlg.close();
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
function dialogTurn(n){step(n)}
el('dialogPrev').onclick=()=>dialogTurn(-1);el('dialogNext').onclick=()=>dialogTurn(1);
dlg.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();dialogTurn(e.key==='ArrowRight'?1:-1)}});
for(const node of [el('dishZoom'),dlg]){let pt=null,avoid=false;node.addEventListener('touchstart',e=>{pt=[e.touches[0].clientX,e.touches[0].clientY];avoid=false},{passive:true});node.addEventListener('touchend',e=>{if(!pt)return;const dx=e.changedTouches[0].clientX-pt[0],dy=e.changedTouches[0].clientY-pt[1];if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5){(node===dlg?dialogTurn:step)(dx<0?1:-1);avoid=true}pt=null},{passive:true});node.addEventListener('click',e=>{if(avoid){e.preventDefault();e.stopImmediatePropagation();avoid=false}},true)}
mobile.addEventListener('change',()=>renderCard(false));renderList();
if(param&&unfold&&location.hash==='#food'){requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{list.children[chosen].firstElementChild.scrollIntoView({block:'start',behavior:'instant'})})));}
})();

document.getElementById('tradeApply').addEventListener('click',()=>{const field=document.getElementById('o-company');(field||document.getElementById('optWrap')).scrollIntoView({block:'center'});field?.focus({preventScroll:true});});
