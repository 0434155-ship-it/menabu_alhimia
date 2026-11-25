
document.documentElement.classList.add('js');
const CATS=[
 {id:'bread',name:'Хлеб на закваске',icon:'i-loaf',img:'1759_1',kick:'холодная ферментация от 12 часов'},
 {id:'puff',name:'Слоёное и булочки',icon:'i-croissant',img:'1992_1',kick:'масло 82,5%, раскатка вручную'},
 {id:'canele',name:'Канеле',icon:'i-canele',img:'1645_2',kick:'бордоская классика'},
 {id:'dessert',name:'Десерты',icon:'i-cake',img:'1727_1',kick:'обновляем витрину каждый сезон'},
 {id:'cakes',name:'Торты',icon:'i-cake',img:'1009_1',kick:'целиком или по частям'},
 {id:'sand',name:'Сэндвичи',icon:'i-sandwich',img:'1012_4c',kick:'на нашем хлебе и круассанах'},
 {id:'exclusive',name:'Исключительно для вас',icon:'i-loaf',img:'1992_1',kick:'готовим по предварительному заказу'},
].filter(category => RETAIL_PRODUCTS.some(product => product.c === category.id));
const P = RETAIL_PRODUCTS;

// сезонная выпечка. Панеттоне, куличи и пасха — составы, вес и цены брони 2026 из Telegram. Штоллен — вкусы и цены ПРИМЕРНЫЕ, уточнить.
// flavors: [id, название, описание, цена (надбавка, если есть sizes; иначе итоговая), фото, вес, группа]
const SEASONAL={
 stollen:{n:'Штоллен',pn:'штоллен',holiday:'Новый год',open:true,deadline:'20 декабря',pickupLabel:'22–31 декабря',
  pickup:['22.12','23.12','24.12','25.12','26.12','27.12','28.12','29.12','30.12','31.12'],
  icon:'i-stollen',img:'1049_1c',lead:'Классическая рождественская выпечка из плотного теста с изюмом, сушёными ягодами и цукатами. Печём по европейским рецептам и упаковываем в праздничные коробочки, так что это ещё и готовый подарок.',
  facts:[['700+','гостей за сезон'],['коробка','праздничная'],['рецепт','европейский']],
  flavors:[['classic','Классический','изюм, цукаты, ром, марципан',0,'1049_1c'],['almond','Миндальный','много миндаля и марципан',150,'1049_1c'],['poppy','Маковый','мак и лимонная цедра',100,'1049_1c'],['curd','Творожный','творог и курага',100,'1049_1c']],
  sizes:[['500','500 г',1400],['1000','1 кг',2600]]},
 panettone:{n:'Панеттоне',pn:'пасхальная выпечка',holiday:'Пасха 2027 · 2 мая',open:true,deadline:'25 апреля',pickupLabel:'28 апреля – 1 мая',
  pickup:['28.04','29.04','30.04','01.05'],
  icon:'i-panettone',img:'1929_2',lead:'Панеттоне на итальянской муке и закваске Lievito Madre, со сливочным маслом 82,5%, цветочным мёдом и стручковой ванилью. Такая выпечка готовится несколько дней, поэтому количество ограничено.',
  facts:[['Lievito Madre','закваска'],['82,5%','сливочное масло'],['ваниль','стручковая']],
  flavors:[
   ['choc3','Панеттоне «3 шоколада»','белый, карамельный и молочный шоколад, бобы тонка',2400,['1929_2','1929_2x'],'~330 г','Панеттоне'],
   ['cherry','Панеттоне черешня-кофе','вяленая черешня и клюква, кофе, белый шоколад с карамелью',1990,['1906_2','1929_3x','1929_3'],'~330 г','Панеттоне'],
   ['peach','Панеттоне персик-абрикос','цукаты персика и абрикоса, белый шоколад',3950,['1929_4','1929_4x'],'~800 г','Панеттоне'],
   ['kulich','Кулич изюм-апельсин','классический: изюм, апельсиновые цукаты, ром, сахарная помадка',1990,'1929_1','~600 г','Куличи и пасха'],
   ['kulich2','Кулич карамель-клубника','вяленая клубника, белый шоколад с карамелью, миндальная мука',2250,'1929_1','~600 г','Куличи и пасха'],
   ['paskha1','Творожная пасха карамель-изюм','творог, сливки, белый шоколад, сгущённое молоко, изюм',3500,'1901_3','~950 г','Куличи и пасха'],
   ['paskha2','Творожная пасха черешня-клюква','маскарпоне, белый шоколад, вяленая черешня и клюква, малина',3500,'1901_2','~950 г','Куличи и пасха']],
  sizes:null}
};

// ---------- состояние ----------
const store={get(k,d){try{const s=localStorage.getItem(k);return s?JSON.parse(s):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
function restoreCartItem(item) {
  if (!item || !Number.isSafeInteger(item.q) || item.q < 1) return null;
  if (typeof item.pre === 'string' && Object.hasOwn(SEASONAL, item.pre) && item.id?.startsWith('pre-' + item.pre + '-')) return item;
  for (const product of P) {
    const variant = product.v.find(v =>
      (product.id === item.id && v.l === item.vl) ||
      ((product.gallery || product.id) === item.id && v.previous !== undefined && v.previous === item.vl)
    );
    if (!variant) continue;
    return {id: product.id, name: product.n, vl: variant.l, price: variant.p, q: item.q,
      min: product.min || 1, pre: product.c === 'exclusive' ? 'exclusive' : undefined};
  }
  return null;
}
const savedCart = store.get('mnb-cart', []);
let cart = Array.isArray(savedCart) ? savedCart.map(restoreCartItem).filter(Boolean) : [];
store.set('mnb-cart', cart);
let cat='bread';
const pick={}; // выбранный вариант карточки
for (const product of P) {
  const firstPriced = product.v.findIndex(variant => Number.isFinite(variant.p));
  if (firstPriced > 0) pick[product.id] = firstPriced;
}
const rub=n=>n.toLocaleString('ru-RU')+' ₽';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function save(){store.set('mnb-cart',cart);renderCount()}
function key(it){return it.id+'|'+it.vl+'|'+(it.opt||'')}
function addItem(it,qty){const k=key(it);const f=cart.find(x=>key(x)===k);if(f)f.q+=qty;else cart.push({...it,q:qty});save();toast(it.name+' — в корзине')}
function qtyOf(id,vl){const f=cart.find(x=>x.id===id&&x.vl===vl&&!x.opt);return f?f.q:0}
function setQty(id,vl,q,min){const i=cart.findIndex(x=>x.id===id&&x.vl===vl&&!x.opt);if(i<0)return;if(q<(min||1))cart.splice(i,1);else cart[i].q=q;save()}

// ---------- каталог ----------
function renderTabs(){
  $('#tabs').innerHTML=CATS.map(c=>`<button class="tab" role="tab" type="button" data-c="${c.id}" aria-selected="${c.id===cat}">${c.name}</button>`).join('');
}
function productViews(id, index) {
  const product = P.find(p => p.id === id);
  const variant = product?.v[index];
  if (!variant || variant.photo === null) return [];
  const options = window.CATALOG_VIEWS[product.gallery || id] || [];
  return options.length === 1 ? options[0] : (options[variant.photo ?? index] || []);
}

function viewLabel(path, index) {
  const labels = {
    'muka/catalog/dragon-roll.webp': 'Целиком',
    'muka/catalog/dragon-roll-detail.webp': 'Крупный план',
    'muka/catalog/pumpkin-close.webp': 'Крупный план',
    'muka/november/baguettes.webp': 'Крупный план',
    'muka/november/french-oven.webp': 'В печи',
    'muka/catalog/19-3.webp': 'В разрезе',
    'muka/catalog/10-2.webp': 'В разрезе',
    'muka/catalog/11-1.webp': 'В разрезе',
    'muka/catalog/11-2.webp': 'В разрезе',
    'muka/november/blueberry.webp': 'В разрезе'
  };
  return labels[path] || (index === 0 ? 'Основной кадр' : 'В разрезе');
}

function cardImage(path, name) {
  const image = window.BAKERY_PHOTOS[path];
  const variants = [...image.sizes, [path, image.width]];
  const srcset = variants.map(([file, width]) => mnbMedia(file) + ' ' + width + 'w').join(', ');
  return `<img loading="lazy" decoding="async" src="${mnbMedia(path)}" srcset="${srcset}" sizes="(max-width: 620px) 48vw, (max-width: 990px) 32vw, 24vw" width="${image.width}" height="${image.height}" alt="${esc(name)}">`;
}
function card(p){
  const vi=pick[p.id]??0, vr=p.v[vi], q=qtyOf(p.id,vr.l);
  const icon=p.icon||CATS.find(c=>c.id===p.c).icon;
  const tag=p.tag?`<span class="tag ${p.tag==='Хит'?'hot':''}">${p.tag}</span>`:'';
  const vars=p.v.length>1?`<div class="vars">${p.v.map((x,i)=>`<button type="button" class="var" data-p="${p.id}" data-i="${i}" aria-pressed="${i===vi}">${esc(x.l)}</button>`).join('')}</div>`:'';
  const unit=p.v.length===1?`<small>${esc(vr.l)}</small>`:'';
  const priced = Number.isFinite(vr.p);
  const priceLabel = priced ? rub(vr.p) : 'Цена по запросу';
  const ctl=q?`<span class="stepper"><button type="button" data-dec="${p.id}" aria-label="Меньше">−</button><span>${q}</span><button type="button" data-inc="${p.id}" aria-label="Больше">+</button></span>`
           :`<button type="button" class="add" data-add="${p.id}">${p.c === 'exclusive' ? 'Предзаказать' : 'В корзину'}</button>`;
  const inquiry = `<a class="price-inquiry" href="tel:+79852270561">${p.c === 'exclusive' ? 'Уточнить предзаказ' : 'Уточнить цену'}</a>`;
  const media = productViews(p.id, vi);
  const detail = media.length > 1;
  const primary = media[0];
  const background = primary ? window.BAKERY_PHOTOS[primary].tones.join(', ') : '';
  const hint = detail ? `<span class="photo-hint">${viewLabel(media[1], 1)}</span>` : '';
  const ph = primary ? `<button type="button" class="ph has-img catalog-photo" style="--photo-matte:linear-gradient(${background})" data-photo="${p.id}" aria-haspopup="dialog" aria-label="Увеличить фото — ${esc(p.n)}">${tag}${cardImage(primary, p.n)}${hint}</button>` : `<div class="ph">${tag}<svg aria-hidden="true"><use href="#${icon}"/></svg></div>`;
  return `<article class="card" data-card="${p.id}">${ph}
  <h3>${esc(p.n)}</h3><p class="desc">${esc(p.d)}</p>${p.min?`<p class="note-min">Заказ от ${p.min} шт.</p>`:''}${vars}
  <div class="buy"><span class="price">${priceLabel}${unit}</span>${priced ? ctl : inquiry}</div></article>`;
}
let visibleProducts=8,shownCat='';
function renderGrid(anim){
  if(cat!==shownCat){visibleProducts=8;shownCat=cat}
  const all=P.filter(p=>p.c===cat);
  const more=document.getElementById('moreProducts');more.hidden=visibleProducts>=all.length;
  more.textContent='Ещё из этой коллекции ('+Math.max(0,all.length-visibleProducts)+') ↓';
  $('#grid').innerHTML=all.slice(0,visibleProducts).map(card).join('');
  if(anim){[...$('#grid').children].forEach((el,i)=>{el.classList.add('rv');el.style.setProperty('--d',Math.min(i,8)*.07+'s')});observeRv()}
}
function renderBan(swap){
  const c=CATS.find(x=>x.id===cat),b=$('#catban');
  $('#catbanImg').src=mnbMedia('img/'+c.img+'.jpg');$('#catbanN').textContent=c.kick;$('#catbanT').textContent=c.name;
  if(swap){b.classList.remove('swap');void b.offsetWidth;b.classList.add('swap')}
}
document.getElementById('moreProducts').onclick=()=>{const prev=visibleProducts;visibleProducts+=8;renderGrid(false);const added=$('#grid').children[prev];if(added){added.setAttribute('tabindex','-1');added.focus({preventScroll:true});added.scrollIntoView({behavior:'instant',block:'nearest'})}};
function selectCategory(id) {
  if (id === cat) return;
  cat = id;
  renderTabs();
  renderBan(true);
  renderGrid(true);
}
$('#tabs').addEventListener('click', e => {
  const button = e.target.closest('[data-c]');
  if (!button) return;
  selectCategory(button.dataset.c);
  if (cat === 'exclusive' || location.hash === '#exclusive') {
    history.replaceState(history.state, '', cat === 'exclusive' ? '#exclusive' : '#catalog');
  }
});
$('#grid').addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.p){pick[t.dataset.p]=+t.dataset.i;renderGrid();return}
  const id=t.dataset.add||t.dataset.inc||t.dataset.dec;const p=P.find(x=>x.id===id);if(!p)return;
  const vr=p.v[pick[id]??0];const min=p.min||1;
  if (!Number.isFinite(vr.p)) return;
  if(t.dataset.add){flyToCart(t.closest('.card'));addItem({id,name:p.n,vl:vr.l,price:vr.p,min,pre:p.c==='exclusive'?'exclusive':undefined},min)}
  else if(t.dataset.inc)setQty(id,vr.l,qtyOf(id,vr.l)+1,min);
  else setQty(id,vr.l,qtyOf(id,vr.l)-1,min);
  renderGrid();
});

// ---------- сезон: отдельный конструктор для каждого изделия ----------
const sp={};
Object.entries(SEASONAL).forEach(([k,it])=>sp[k]={flavor:it.flavors[0][0],size:it.sizes?it.sizes[0][0]:null,q:1});
const baseOf=k=>{const it=SEASONAL[k];return it.sizes?it.sizes.find(x=>x[0]===sp[k].size)[2]:0};
function seasonPrice(k){const st=sp[k];const f=SEASONAL[k].flavors.find(x=>x[0]===st.flavor);return baseOf(k)+f[3]}
function renderBuilder(k){
  const it=SEASONAL[k],st=sp[k],el=$('#b-'+k),base=baseOf(k);
  const f=it.flavors.find(x=>x[0]===st.flavor),imgs=[].concat(f[4]||it.img),src=mnbMedia('img/'+imgs[0]+'.jpg');st.slide=Math.min(st.slide||0,imgs.length-1);
  const prev=el.querySelector('.ph img'),changed=prev&&prev.getAttribute('src')!==src;
  let g='';
  const list=it.flavors.map(x=>{const h=x[6]&&x[6]!==g?`<div class="grp">${x[6]}</div>`:'';g=x[6]||g;
    return h+`<label class="choice"><input type="radio" name="${k}-flav" value="${x[0]}" ${x[0]===st.flavor?'checked':''}><div><b>${x[1]}</b><span>${x[2]}</span>${x[5]?`<span class="w8">${x[5]}</span>`:''}</div><em>${rub(base+x[3])}</em></label>`}).join('');
  const sizes=it.sizes?`<div class="row2">${it.sizes.map(s=>`<label class="choice"><input type="radio" name="${k}-size" value="${s[0]}" ${s[0]===st.size?'checked':''}><div><b>${s[1]}</b></div></label>`).join('')}</div>`:'';
  el.innerHTML=`<div class="builder">
    <div><div class="ph has-img gal" data-gal="${k}"><span class="tag hot">${it.holiday}</span>${imgs.map((x,i)=>`<img src="${mnbMedia('img/'+x+'.jpg')}" alt="${esc(f[1])}${i?', фото '+(i+1):''}" class="${i===st.slide?'on':''}" loading="lazy">`).join('')}${imgs.length>1?`<button type="button" class="ga prev" data-gp="${k}" aria-label="Предыдущее фото">‹</button><button type="button" class="ga next" data-gn="${k}" aria-label="Следующее фото">›</button><div class="dots">${imgs.map((_,i)=>`<i class="${i===st.slide?'on':''}"></i>`).join('')}</div>`:''}</div>
      <p style="color:var(--muted);margin:18px 0 0;max-width:46ch">${it.lead}</p>
      <div class="facts">${it.facts.map(f=>`<div><b>${f[0]}</b><span>${f[1]}</span></div>`).join('')}</div></div>
    <div>
      <div class="step"><div class="eyebrow"><i>1</i>${it.sizes?'Вкус':'Что заказать'}</div><div class="choices">${list}</div></div>
      <div class="step"><div class="eyebrow"><i>2</i>${it.sizes?'Вес и количество':'Количество'}</div>${sizes}
        <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;margin-top:14px">
          <span class="stepper"><button type="button" data-sdec="${k}" aria-label="Меньше">−</button><span>${st.q}</span><button type="button" data-sinc="${k}" aria-label="Больше">+</button></span></div></div>
      <div class="total-line"><div><div class="eyebrow">Предзаказ до ${it.deadline} · выдача ${it.pickupLabel}</div><span class="price">${rub(seasonPrice(k)*st.q)}</span></div>
        <button class="btn solid" type="button" data-sadd="${k}">Добавить в заказ</button></div>
    </div></div>`;
  if(changed){const im=el.querySelector('.ph img');im.style.opacity=0;im.style.transform='scale(1.08)';requestAnimationFrame(()=>requestAnimationFrame(()=>{im.style.opacity='';im.style.transform=''}))}
}
Object.keys(SEASONAL).forEach(k=>{
  const el=$('#b-'+k);
  el.addEventListener('change',e=>{const t=e.target,st=sp[k];
    if(t.name===k+'-flav'){st.flavor=t.value;st.slide=0} if(t.name===k+'-size')st.size=t.value; renderBuilder(k)});
  el.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;const st=sp[k];
    if(t.dataset.gp||t.dataset.gn){slide(k,t.dataset.gn?1:-1);return}
    if(t.dataset.sinc){st.q++;renderBuilder(k)} if(t.dataset.sdec&&st.q>1){st.q--;renderBuilder(k)}
    if(t.dataset.sadd){const it=SEASONAL[k];const f=it.flavors.find(x=>x[0]===st.flavor);const s=it.sizes&&it.sizes.find(x=>x[0]===st.size);
      addItem({id:'pre-'+k+'-'+f[0],name:it.sizes?it.n+' '+f[1].toLowerCase():f[1],vl:s?s[1]:(f[5]||'1 шт'),price:seasonPrice(k),pre:k},st.q);st.q=1;renderBuilder(k);openCart()}});
});

function slide(k,d){const g=$('#b-'+k+' .gal'),im=[...g.querySelectorAll('img')],n=im.length;if(n<2)return;
  const st=sp[k];st.slide=((st.slide||0)+d+n)%n;im.forEach((x,i)=>x.classList.toggle('on',i===st.slide));g.querySelectorAll('.dots i').forEach((x,i)=>x.classList.toggle('on',i===st.slide))}
Object.keys(SEASONAL).forEach(k=>{let x0=null;const el=$('#b-'+k);
  el.addEventListener('touchstart',e=>{if(e.target.closest('.gal'))x0=e.touches[0].clientX},{passive:true});
  el.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>40)slide(k,dx<0?1:-1)},{passive:true})});

// ---------- корзина и оформление ----------
let view='cart', order=null;
function total(){
  if (cart.some(item => !Number.isFinite(item.price))) return null;
  return cart.reduce((sum,item) => sum + item.price * item.q, 0);
}
function renderCount(){const n=cart.reduce((s,x)=>s+x.q,0);const el=$('#cartN');if(String(n)!==el.textContent&&n>0){const c=$('#cartBtn');c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump')}el.textContent=n;n?el.removeAttribute('data-zero'):el.setAttribute('data-zero','')}
function openCart(){view='cart';renderDrawer();$('#drawer').hidden=false;$('#scrim').hidden=false;$('#dClose').focus()}
function closeCart(){$('#drawer').hidden=true;$('#scrim').hidden=true;$('#cartBtn').focus()}
$('#cartBtn').onclick=openCart;$('#dClose').onclick=closeCart;$('#scrim').onclick=closeCart;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#drawer').hidden)closeCart()});
function renderDrawer(){
  const B=$('#dBody'),F=$('#dFoot');
  if(view==='cart'){
    $('#dTitle').textContent='Корзина';
    if(!cart.length){B.innerHTML=`<div class="empty"><p>Корзина пока пустая.</p><a class="btn" href="#catalog" id="toCat">Перейти в каталог</a></div>`;F.innerHTML='';return}
    B.innerHTML=cart.map((x,i)=>`<div class="line"><div><b>${esc(x.name)}${x.pre?'<span class="pill">предзаказ</span>':''}</b><div class="meta">${esc(x.vl)}${x.opt?' · '+esc(x.opt):''} · ${Number.isFinite(x.price) ? rub(x.price) : 'Цену уточнить'}</div></div>
      <div class="lp">${Number.isFinite(x.price) ? rub(x.price*x.q) : ''}</div>
      <div class="ctl"><span class="stepper"><button type="button" data-ld="${i}" aria-label="Меньше">−</button><span>${x.q}</span><button type="button" data-li="${i}" aria-label="Больше">+</button></span><button class="rm" type="button" data-lr="${i}">Убрать</button></div></div>`).join('');
    const amount = total();
    F.innerHTML = amount === null
      ? `<p class="hint">В корзине есть позиции с ценой по запросу. Свяжитесь с пекарней или уберите эти позиции, чтобы продолжить оформление.</p><a class="btn" href="#contacts" id="cartContacts">Контакты пекарни</a>`
      : `<div class="sum"><span class="eyebrow">Итого</span><span class="price">${rub(amount)}</span></div><button class="btn solid" type="button" id="toCo">Оформить заказ</button>`;
  } else if(view==='co'){
    $('#dTitle').textContent='Оформление';
    const preKinds=[...new Set(cart.map(x=>x.pre))].filter(k=>Object.hasOwn(SEASONAL,k));
    const pre=preKinds.length>0, exclusive=cart.some(x=>x.pre==='exclusive');
    const today=new Date().toISOString().slice(0,10);
    B.innerHTML=`<div class="co"><p class="demo-note">Демонстрационное оформление. Заказ не отправляется, деньги не списываются.</p><form id="coForm" novalidate>
      <div class="f"><label class="l" for="c-name">Имя</label><input id="c-name" type="text" autocomplete="name" required></div>
      <div class="f"><label class="l" for="c-phone">Телефон</label><input id="c-phone" type="tel" autocomplete="tel" required placeholder="+7"></div>
      <fieldset><legend>Как получить</legend>
        <label class="opt-r"><input type="radio" name="how" value="Самовывоз, ул. Сукромка, 5" checked><span>Самовывоз · ул. Сукромка, 5</span></label>
        <label class="opt-r"><input type="radio" name="how" value="Самовывоз, Новомытищинский пр-т, 64к1"><span>Самовывоз · Новомытищинский пр-т, 64к1</span></label>
        <label class="opt-r"><input type="radio" name="how" value="Доставка"><span>Доставка курьером<small>Стоимость рассчитает менеджер</small></span></label>
      </fieldset>
      <div class="f" id="addrF" hidden><label class="l" for="c-addr">Адрес доставки</label><input id="c-addr" type="text" autocomplete="street-address"></div>
      ${preKinds.map(k=>`<div class="f"><label class="l" for="c-pre-${k}">Дата выдачи: ${SEASONAL[k].pn}</label><select id="c-pre-${k}" data-pre="${SEASONAL[k].holiday}">${SEASONAL[k].pickup.map(d=>`<option>${d}</option>`).join('')}</select></div>`).join('')}
      ${exclusive?`<div class="f"><label class="l" for="c-exclusive">Желаемая дата предзаказа</label><input id="c-exclusive" type="date" min="${today}" value="${today}" required><small>Дату выдачи нужно согласовать с пекарней.</small></div>`:''}
      ${cart.some(x=>!x.pre)?`<div class="f"><label class="l" for="c-date">${pre||exclusive?'Дата для остальных позиций':'Дата'}</label><input id="c-date" type="date" min="${today}" value="${today}"></div>`:''}
      <div class="f"><label class="l" for="c-msg">Комментарий</label><textarea id="c-msg" rows="2" placeholder="Например, нарезать хлеб"></textarea></div>
      <fieldset><legend>Оплата</legend>
        <label class="opt-r"><input type="radio" name="pay" value="online" checked><span>Онлайн: картой или через СБП<small>Пример выбора способа оплаты</small></span></label>
        <label class="opt-r ${pre?'off':''}"><input type="radio" name="pay" value="cash" ${pre?'disabled':''}><span>При получении<small>${pre?'Предзаказ праздничной выпечки оплачивается сразу':'Картой или наличными в пекарне'}</small></span></label>
      </fieldset>
      <label class="consent"><input type="checkbox" id="c-ok"><span>Понимаю, что это пример оформления. <a href="#policy" data-policy>Как используются данные</a></span></label>
      <p class="err" id="coErr" hidden>Укажите имя и телефон, чтобы мы подтвердили заказ.</p>
    </form></div>`;
    F.innerHTML=`<div class="sum"><span class="eyebrow">К оплате</span><span class="price">${rub(total())}</span></div>
      <div style="display:flex;gap:10px"><button class="btn" type="button" id="back">Назад</button><button class="btn solid" type="button" id="submitCo" style="flex:1">Подтвердить заказ</button></div>`;
  } else if(view==='pay'){
    $('#dTitle').textContent='Оплата';
    B.innerHTML=`<div class="paybox"><div class="eyebrow">Пример оплаты</div><div class="amt">${rub(order.sum)}</div><p class="hint">Это демонстрация. Банковские данные не нужны, деньги не списываются.</p><button class="btn solid" type="button" id="payNow">Завершить пример</button></div>`;
    F.innerHTML=`<button class="btn" type="button" id="back2">Изменить заказ</button>`;
  } else if(view==='done'){
    $('#dTitle').textContent='Спасибо!';
    B.innerHTML=`<div class="empty" style="color:var(--ink)"><div class="eyebrow">Пример оформления</div><h3 style="font-size:30px;margin:12px 0">Всё готово</h3><p>Это был пример: заказ не передан в пекарню, оплаты не было.</p><a class="textlink" href="tel:+79852270561">Позвонить на Сукромку ↗</a></div>`;
    F.innerHTML=`<button class="btn" type="button" id="dClose2">Вернуться на сайт</button>`;
  }
}
$('#drawer').addEventListener('change',e=>{if(e.target.name==='how')$('#addrF').hidden=e.target.value!=='Доставка'});
$('#drawer').addEventListener('click',e=>{
  const t=e.target.closest('button,a');if(!t)return;
  if(t.id==='toCat'||t.id==='cartContacts'){closeCart();return}
  if(t.dataset.li!==undefined){cart[+t.dataset.li].q++;save();renderDrawer();renderGrid()}
  if(t.dataset.ld!==undefined){const x=cart[+t.dataset.ld];if(x.q>(x.min||1))x.q--;else cart.splice(+t.dataset.ld,1);save();renderDrawer();renderGrid()}
  if(t.dataset.lr!==undefined){cart.splice(+t.dataset.lr,1);save();renderDrawer();renderGrid()}
  if(t.id==='toCo' && total() !== null){view='co';renderDrawer()}
  if(t.id==='back'||t.id==='back2'){view=t.id==='back'?'cart':'co';renderDrawer()}
  if(t.id==='submitCo'){
    const name=$('#c-name').value.trim(),phone=$('#c-phone').value.trim();
    if(!name||phone.replace(/\D/g,'').length<10){$('#coErr').textContent='Укажите имя и телефон, чтобы мы подтвердили заказ.';$('#coErr').hidden=false;return}
    if(!$('#c-ok').checked){$('#c-ok').closest('.consent').classList.add('bad');$('#coErr').textContent='Подтвердите, что ознакомились с условиями примера.';$('#coErr').hidden=false;return}
    const exclusiveDate=$('#c-exclusive');
    if(exclusiveDate && !exclusiveDate.reportValidity()) return;
    const how=document.querySelector('input[name=how]:checked').value+(document.querySelector('input[name=how]:checked').value==='Доставка'?': '+$('#c-addr').value:'');
    const pay=document.querySelector('input[name=pay]:checked').value;
    order={no:'МН-'+String(Date.now()).slice(-5),sum:total(),phone,how,pre:[...document.querySelectorAll('select[data-pre]')].map(x=>x.dataset.pre+' — '+x.value).concat(exclusiveDate ? ['Исключительно для вас — '+exclusiveDate.value] : []).join(', '),paid:false};
    if(pay==='online'){view='pay'}else{view='done';cart=[];save();renderGrid()}
    renderDrawer();
  }
  if(t.id==='payNow'){order.paid=true;cart=[];save();renderGrid();view='done';renderDrawer()}
  if(t.id==='dClose2'){closeCart()}
});

// ---------- опт ----------
$('#optForm').addEventListener('submit',e=>{e.preventDefault();
  const ok=['#o-company','#o-name','#o-phone'].every(s=>$(s).value.trim());
  if(!ok){$('#optErr').textContent='Заполните компанию, имя и телефон, чтобы менеджер мог с вами связаться.';$('#optErr').hidden=false;return}
  if(!$('#o-ok').checked){$('#o-ok').closest('.consent').classList.add('bad');$('#optErr').textContent='Подтвердите подготовку обращения для Telegram.';$('#optErr').hidden=false;return}
  const fval=id=>document.getElementById(id).value.trim();
  const opts=[...document.querySelectorAll('#optForm .checks input:checked')].map(x=>x.parentElement.textContent.trim()).join(', ');
  const inquiry=['Здравствуйте! Интересует оптовый заказ.',fval('o-company')+' · '+fval('o-type'),[fval('o-name'),fval('o-phone')].filter(Boolean).join(' · '),opts,fval('o-vol'),fval('o-city'),fval('o-msg')].filter(Boolean).join('\n');
  $('#optWrap').innerHTML=`<div class="formok"><div class="eyebrow">Оптовая заявка</div><h3>Текст готов</h3><p>Проверьте заявку и отправьте её менеджеру в Telegram.</p><pre class="inquiry-text">${esc(inquiry)}</pre><a class="btn solid" target="_blank" rel="noopener" href="https://t.me/vk_cosmo?text=${encodeURIComponent(inquiry)}">Открыть Telegram ↗</a></div>`;
});


// ---------- сезонные вкладки: открываются и закрываются флагом open в SEASONAL ----------
document.querySelectorAll('[data-season]').forEach(el=>{const it=SEASONAL[el.dataset.season];if(!it||!it.open)el.hidden=true});
function legacyRoute(){
  const h=decodeURIComponent(location.hash.slice(1)),season=SEASONAL[h]&&SEASONAL[h].open?h:'';
  const was=document.body.dataset.view;document.body.dataset.view=season||'home';
  document.querySelectorAll('nav.main a,.mnav a').forEach(a=>a.classList.toggle('cur',!!season&&a.getAttribute('href')==='#'+season));
  if(season)scrollTo(0,0);else if(was&&was!=='home'){const t=h&&document.getElementById(h);t?t.scrollIntoView():scrollTo(0,0)}
  if(typeof observeRv==='function'){observeRv();onScroll()}
}
// ---------- анимации ----------
const calm=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('calm');
const io='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px',threshold:.08}):null;
function observeRv(){document.querySelectorAll('.rv:not(.in),.rv-img:not(.in)').forEach(el=>io?io.observe(el):el.classList.add('in'))}

function countUp(el){
  const to=+el.dataset.count,plain='plain' in el.dataset,suf=el.dataset.suffix||'',from=plain?to-25:0,t0=performance.now(),dur=1600;
  const fmt=n=>(plain?String(n):n.toLocaleString('ru-RU'))+suf;
  if(calm||matchMedia('(prefers-reduced-motion: reduce)').matches){el.textContent=fmt(to);return}
  (function f(t){const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);el.textContent=fmt(Math.round(from+(to-from)*e));if(k<1)requestAnimationFrame(f)})(t0);
}
const cio='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){countUp(e.target);cio.unobserve(e.target)}}),{threshold:.6}):null;
document.querySelectorAll('[data-count]').forEach(el=>cio&&cio.observe(el));

function flyToCart(cardEl){
  const btn=$('#cartBtn');if(calm||!cardEl||!btn)return;
  const src=cardEl.querySelector('.ph img'),r=(src||cardEl.querySelector('.ph')).getBoundingClientRect(),to=btn.getBoundingClientRect();
  const size=Math.min(90,r.width*.5),x=r.left+r.width/2-size/2,y=r.top+r.height/2-size/2;
  const f=src?Object.assign(document.createElement('img'),{src:src.currentSrc||src.src,alt:''}):document.createElement('div');
  f.className='fly';if(!src)f.style.background='var(--crust)';
  Object.assign(f.style,{left:x+'px',top:y+'px',width:size+'px',height:size+'px'});
  document.body.appendChild(f);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{f.style.transform=`translate(${to.left+to.width/2-x-size/2}px,${to.top+to.height/2-y-size/2}px) scale(.18)`;f.style.opacity='.4'}));
  setTimeout(()=>f.remove(),850);
}

const hdr=document.querySelector('header.top'),bar=$('#progress'),pars=[...document.querySelectorAll('[data-par]')],aboutImg=$('#aboutImg'),banImg=$('#catbanImg');
let ticking=false;
function onScroll(){
  ticking=false;const y=scrollY,vh=innerHeight,max=document.documentElement.scrollHeight-vh;
  hdr.classList.toggle('scrolled',y>8);bar.style.transform=`scaleX(${max>0?Math.min(1,y/max):0})`;
  if(calm)return;
  if(y<vh*1.2)pars.forEach(el=>el.style.translate=`0 ${(-y*+el.dataset.par).toFixed(1)}px`);
  [[aboutImg,.09],[banImg,.14]].forEach(([el,k])=>{const r=el.parentElement.getBoundingClientRect();if(r.bottom<0||r.top>vh)return;
    el.style.translate=`0 ${((r.top+r.height/2-vh/2)*-k).toFixed(1)}px`});
}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});
addEventListener('resize',onScroll);

document.addEventListener('click',e=>{const a=e.target.closest('[data-policy]');if(!a)return;e.preventDefault();const d=$('#policyDlg');d.showModal?d.showModal():d.setAttribute('open','')});
$('#polClose').onclick=()=>$('#policyDlg').close();
$('#policyDlg').addEventListener('click',e=>{if(e.target.id==='policyDlg')e.target.close()});
document.addEventListener('change',e=>{if(e.target.closest&&e.target.closest('.consent')&&e.target.checked)e.target.closest('.consent').classList.remove('bad')});
let tt;function toast(m){const el=$('#toast');el.textContent=m;el.hidden=false;clearTimeout(tt);tt=setTimeout(()=>el.hidden=true,1800)}

renderTabs();renderBan();renderGrid(true);Object.keys(SEASONAL).forEach(renderBuilder);renderCount();observeRv();onScroll();
