(() => {
  const panel = document.getElementById('partner');
  const auth = panel.querySelector('form');
  const dashboard = panel.querySelector('[data-dashboard]');
  const status = panel.querySelector('[role="status"]');
  const controls = new Map();
  const cart = new Map();
  const products = new Map(window.WHOLESALE_PRODUCTS.flatMap(product => product.variants.map(variant => [
    [product.name, variant.label, variant.weight].join('|'),
    [product.name, variant.label, variant.weight && variant.weight+' г'].filter(Boolean).join(' · ')
  ])));
  let state;
  let available = false;
  let registration = true;
  let requestId;

  function element(tag,text) {
    const el=document.createElement(tag);
    if(text) el.textContent=text;
    return el;
  }

  async function api(action,body) {
    const response = await fetch('/api/partner/'+action,body ? {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
    } : {});
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(payload.error || 'Кабинет временно недоступен.'),{status:response.status});
    return payload;
  }

  function mode() {
    auth.querySelector('[name="company"]').required = registration;
    auth.querySelector('[name="company"]').closest('label').hidden = !registration;
    auth.querySelector('[name="password"]').autocomplete = registration ? 'new-password' : 'current-password';
    auth.querySelector('[type="submit"]').textContent = registration ? 'Зарегистрироваться' : 'Войти';
    panel.querySelector('[data-mode]').textContent = registration ? 'У меня уже есть аккаунт' : 'Создать аккаунт';
  }

  function display() {
    auth.hidden = !available || !!state;
    dashboard.hidden = !state;
    for (const [item, group] of controls) {
      for (const buttons of group) {
        buttons.wrap.hidden = !state;
        buttons.favorite.setAttribute('aria-pressed',String(!!state?.favorites.includes(item)));
        buttons.favorite.textContent = state?.favorites.includes(item) ? 'В избранном' : 'В избранное';
        buttons.add.textContent = cart.has(item) ? 'В заявке · '+cart.get(item) : 'Добавить в заявку';
      }
    }
    if (!state) return;
    panel.querySelector('[data-company]').textContent = state.company;
    const favorites = panel.querySelector('[data-favorites]');
    favorites.replaceChildren(...state.favorites.filter(item=>products.has(item)).map(item=>{
      const li = element('li',products.get(item)+' ');
      const add=element('button','В заявку');
      const remove=element('button','Убрать');
      add.addEventListener('click',()=>addItem(item));
      remove.addEventListener('click',()=>favorite(item,false));
      li.append(add,remove);
      return li;
    }));
    if (!favorites.children.length) favorites.append(element('li','Пока нет избранных изделий.'));
    const list = panel.querySelector('[data-cart]');
    list.replaceChildren(...Array.from(cart,([item,quantity])=>{
      const li = element('li');
      const label = element('label',products.get(item)+' · количество');
      const input = element('input');
      input.type='number';
      input.min='1'; input.max='999'; input.value=quantity;
      input.addEventListener('change',()=>{
        cart.set(item,Math.max(1,Math.min(999,Math.trunc(Number(input.value))||1)));
        requestId=undefined;
        display();
      });
      const remove=element('button','Убрать');
      remove.addEventListener('click',()=>{cart.delete(item);requestId=undefined;display();});
      label.append(input);
      li.append(label,remove);
      return li;
    }));
    if (!list.children.length) list.append(element('li','Добавьте позиции из каталога или избранного.'));
    panel.querySelector('[data-order]').disabled = !cart.size;
    const history = panel.querySelector('[data-history]');
    history.replaceChildren(...state.orders.map(order=>{
      const li = element('li');
      const date = new Date(order.created*1000).toLocaleString('ru-RU',{timeZone:'Europe/Moscow', dateStyle:'short',timeStyle:'short'});
      const lines=order.items.map(v=>[v.name,v.variant,v.weight&&v.weight+' г'].filter(Boolean).join(' · ')+' × '+v.quantity);
      li.append(element('strong',date),element('p',lines.join(', ')));
      const link = element('a','Передать заявку менеджеру в Telegram');
      const telegram=new URL('https://t.me/vk_cosmo');
      telegram.searchParams.set('text',['Оптовая заявка · '+state.company,...lines].join('\n'));
      link.href=telegram;
      link.target='_blank';
      link.rel='noopener noreferrer';
      li.append(link);
      return li;
    }));
    if (!history.children.length) history.append(element('li','Здесь появятся сохранённые заявки.'));
  }

  function addItem(item) {
    if (!cart.has(item) && cart.size>=40) {
      status.textContent='В одной заявке можно выбрать до 40 позиций.';
      return;
    }
    cart.set(item,Math.min(999,(cart.get(item)||0)+1));
    requestId=undefined;
    display();
  }

  async function favorite(item,selected) {
    try {
      await api('favorite',{item,selected});
      if (selected && !state.favorites.includes(item)) state.favorites.push(item);
      if (!selected) state.favorites=state.favorites.filter(key=>key!==item);
      display();
    } catch(error) { status.textContent=error.message; }
  }

  window.partnerCatalog = {
    controls(product,variant) {
      const item=[product.name,variant.label,variant.weight].join('|');
      const wrap = element('div');
      wrap.className='partner-actions';
      wrap.hidden = true;
      const add = element('button','Добавить в заявку');
      const star = element('button','В избранное');
      add.type=star.type='button';
      add.addEventListener('click',()=>addItem(item));
      star.addEventListener('click',()=>favorite(item,!state.favorites.includes(item)));
      wrap.append(add,star);
      const group=controls.get(item)||[];
      group.push({wrap,add,favorite:star});
      controls.set(item,group);
      return wrap;
    },
    reset() { controls.clear(); },
    ready() { display(); }
  };

  async function refresh() {
    try {
      state=await api('state');
      available=true;
      status.textContent='';
    } catch(error) {
      state=null;
      available=error.status===401;
      status.textContent=available ? '' : 'В этой версии сайта кабинет ещё не подключён.';
    }
    display();
  }

  panel.querySelector('[data-mode]').addEventListener('click',()=>{registration=!registration;mode();});
  auth.addEventListener('submit',async event=>{
    event.preventDefault();
    const button=auth.querySelector('[type="submit"]');
    button.disabled=true;
    try {
      await api(registration?'register':'login',Object.fromEntries(new FormData(auth)));
      auth.reset();
      await refresh();
    } catch(error) { status.textContent=error.message; }
    finally {button.disabled=false;}
  });
  panel.querySelector('[data-logout]').addEventListener('click',async()=>{
    try {
      await api('logout',{});
      cart.clear();
      requestId=undefined;
      await refresh();
    } catch(error) {status.textContent=error.message;}
  });
  panel.querySelector('[data-order]').addEventListener('click',async event=>{
    const button=event.target;
    button.disabled=true;
    try {
      requestId ||= crypto.randomUUID();
      const order=await api('order',{id:requestId,items:Array.from(cart,([item,quantity])=>({item,quantity}))});
      state.orders=[order,...state.orders.filter(row=>row.id!==order.id)];
      cart.clear();
      requestId=undefined;
      status.textContent='Заявка сохранена. Передайте её менеджеру из истории.';
    } catch(error) {status.textContent=error.message;}
    finally {display();}
  });
  mode();
  refresh();
})();
