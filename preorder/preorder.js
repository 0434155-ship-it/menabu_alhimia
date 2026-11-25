(() => {
  'use strict';
  const page = document.getElementById('hp-page');
  if (!page) return;
  const embedded = page.hasAttribute('data-embedded');
  const preview = page.hasAttribute('data-preview');
  const tabs = [...page.querySelectorAll('[data-hp-tab]')];
  const panels = [...page.querySelectorAll('[data-hp-panel]')];
  const names = tabs.map(tab => tab.dataset.hpTab);
  const collection = page.querySelector('#hp-collection');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = '';

  page.querySelector('.hp-tabs').setAttribute('role', 'tablist');
  tabs.forEach((tab, i) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[i].id);
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', tab.id);
  });

  function select(key) {
    current = key;
    tabs.forEach(tab => {
      const selected = tab.dataset.hpTab === key;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(panel => {
      panel.hidden = panel.dataset.hpPanel !== key;
    });
  }

  function route() {
    const hash = location.hash.slice(1);
    const nativeStart = !hash && embedded && document.getElementById('mb-store')?.dataset.initialView;
    const requested = hash || nativeStart || 'preorder';
    if (embedded) {
      const active = (Boolean(hash || nativeStart) && (requested === 'preorder' || names.includes(requested)));
      const wasOpen = !page.hidden;
      page.hidden = !active;
      document.documentElement.classList.toggle('hp-in-shop', active);
      if (!active) return;
      if (!wasOpen) {
        requestAnimationFrame(() => window.scrollTo({top: 0, behavior: 'instant'}));
      }
    }
    if (names.includes(requested)) {
      if (current !== requested) select(requested);
      if (!embedded || requested !== 'stollen') {
        requestAnimationFrame(() => collection.scrollIntoView({block: 'start', behavior: 'instant'}));
      }
    } else if (!current || requested === 'preorder') {
      select('stollen');
    }
  }

  function switchTo(key, focus = false) {
    if (!names.includes(key)) return;
    if (location.hash !== '#' + key) {
      history.pushState(null, '', '#' + key);
    }
    select(key);
    if (focus) tabs[names.indexOf(key)].focus({preventScroll: true});
    collection.scrollIntoView({block: 'start', behavior: 'instant'});
  }

  page.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const key = link.dataset.hpTab || link.dataset.hpSwitch;
    if (key) {
      event.preventDefault();
      event.stopPropagation();
      switchTo(key, Boolean(link.dataset.hpSwitch));
      return;
    }
    if (embedded && ['#hp-collection', '#hp-pickup'].includes(link.hash)) {
      event.preventDefault();
      event.stopPropagation();
      page.querySelector(link.hash).scrollIntoView({block: 'start'});
    }
  });
  page.querySelector('.hp-tabs').addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    const next = ({ArrowRight: (index+1)%names.length, ArrowLeft: (index+names.length-1)%names.length, Home: 0, End: names.length-1})[event.key];
    if (next === undefined) return;
    event.preventDefault();
    switchTo(names[next], true);
  });
  window.addEventListener('hashchange', () => route());
  window.addEventListener('popstate', () => route());
  route();

  const zoom = page.querySelector('[data-zoom-dialog]');
  page.querySelectorAll('[data-gallery]').forEach(gallery => {
    const film = gallery.querySelector('.hp-film');
    const shots = [...film.querySelectorAll('.hp-shot')];
    const caption = gallery.querySelector('.hp-gallery-caption');
    const [previous, next] = gallery.querySelectorAll('[data-gallery-step]');
    let position = 0;
    function update() {
      if (!film.clientWidth) return;
      position = Math.min(shots.length-1, Math.max(0, Math.round(film.scrollLeft / film.clientWidth)));
      caption.textContent = shots[position].querySelector('img').dataset.caption;
      previous.disabled = position === 0;
      next.disabled = position === shots.length-1;
    }
    function go(step) {
      const index = Math.max(0, Math.min(shots.length-1, position+step));
      film.scrollTo({left:index * film.clientWidth, behavior:reduced.matches ? 'instant' : 'smooth'});
    }
    previous.disabled = true;
    previous.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    film.addEventListener('scroll', update, {passive:true});
    new ResizeObserver(update).observe(film);
    film.addEventListener('keydown', event => {
      if (!['ArrowRight','ArrowLeft'].includes(event.key)) return;
      event.preventDefault();
      go(event.key === 'ArrowRight' ? 1 : -1);
    });
    shots.forEach(shot => shot.addEventListener('click', () => {
      const origin = shot.querySelector('img');
      const large = zoom.querySelector('[data-zoom-image]');
      large.src = origin.currentSrc || origin.src;
      large.alt = origin.alt;
      zoom.querySelector('[data-zoom-caption]').textContent = origin.dataset.caption;
      zoom.showModal();
    }));
  });
  page.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('[data-dismiss]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => {
      if (e.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) dialog.close();
    });
  });

  const order = page.querySelector('[data-order-dialog]');
  const mail = order.querySelector('[data-order-mail]');
  const feedback = order.querySelector('[data-copy-status]');
  let message = '';
  if (preview) {
    mail.hidden = true;
    order.querySelector('[data-order-explainer]').textContent = 'Это предпросмотр. Заявку можно скопировать, чтобы проверить выбранные параметры.';
  }
  page.querySelectorAll('form[data-product]').forEach(form => {
    const controls = form.elements;
    const flavor = controls.namedItem('flavor');
    const qty = controls.namedItem('qty');
    const date = controls.namedItem('date');
    const minus = form.querySelector('[data-qty="-1"]');
    const plus = form.querySelector('[data-qty="1"]');
    function quantities() {
      minus.disabled = !qty.value || qty.valueAsNumber <= Number(qty.min);
      plus.disabled = qty.valueAsNumber >= Number(qty.max);
    }
    function updateFlavor() {
      const selected = flavor.selectedOptions[0];
      form.querySelector('[data-flavor-note]').textContent = selected.dataset.note;
      const weight = form.querySelector('[data-flavor-weight]');
      if (weight) weight.textContent = selected.dataset.weight;
    }
    updateFlavor();
    quantities();
    form.querySelector('[type="submit"]').disabled = false;
    flavor.addEventListener('change', updateFlavor);
    qty.addEventListener('input', quantities);
    form.querySelectorAll('[data-qty]').forEach(button => button.addEventListener('click', () => {
      if (!Number.isFinite(qty.valueAsNumber)) qty.value = 1;
      else if (button === plus) qty.stepUp();
      else qty.stepDown();
      quantities();
    }));
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const selected = flavor.selectedOptions[0];
      const size = controls.namedItem('size')?.value || selected.dataset.weight;
      const rows = [
        ['Выпечка', selected.dataset.kind || form.dataset.product], ['Вкус', flavor.value], ['Вес',size],
        ['Количество', qty.value + ' шт.'], ['Желаемая выдача', date.value + ' ' + form.dataset.year]
      ];
      const summary = order.querySelector('[data-summary]');
      summary.replaceChildren(...rows.map(([key,value]) => {
        const row = document.createElement('div');
        const term = document.createElement('dt');
        const description = document.createElement('dd');
        term.textContent = key; description.textContent = value;
        row.append(term, description);
        return row;
      }));
      message = 'Добрый день! Хочу сделать предзаказ.\n\n' + rows.map(([key,value]) => key + ': ' + value).join('\n') + '\n\nПодтвердите, пожалуйста, стоимость, дату и адрес выдачи.';
      if (!preview) mail.href = 'mailto:bakery@menabu.ru?subject=' + encodeURIComponent('Предзаказ · ' + rows[0][1]) + '&body=' + encodeURIComponent(message);
      feedback.textContent = '';
      order.querySelector('textarea')?.remove();
      order.showModal();
    });
  });
  order.querySelector('[data-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(message);
      feedback.textContent = 'Заявка скопирована.';
    } catch {
      let area = order.querySelector('textarea');
      if (!area) {
        area = document.createElement('textarea');
        area.setAttribute('aria-label', 'Текст заявки для копирования');
        area.readOnly = true;
        area.rows = 6;
        area.style.width = '100%';
        feedback.before(area);
      }
      area.value = message;
      area.select();
      feedback.textContent = 'Текст выделен. Выберите «Копировать».';
    }
  });
})();
