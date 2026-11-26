(() => {
  const search = document.getElementById('wholesale-search');
  const category = document.getElementById('wholesale-category');
  const photos = document.getElementById('wholesale-photos');
  const tabs = document.getElementById('wholesale-tabs');
  const rubles = new Intl.NumberFormat('ru-RU', {style:'currency', currency:'RUB', maximumFractionDigits:0});
  const count = document.getElementById('wholesale-count');
  const results = document.getElementById('wholesale-products');

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function photoGallery(paths, name, variantLabel) {
    const gallery = element('div', '', 'product-photos');
    for (const path of paths) {
      const info = window.BAKERY_PHOTOS[path];
      const caption = [variantLabel, info.label].filter(Boolean).join(' · ');
      const figure = element('figure');
      const link = element('a');
      link.href = path;
      link.target = '_blank';
      link.rel = 'noopener';
      const image = element('img');
      image.src = path;
      image.alt = name + ' — ' + caption;
      if (info.source) link.title = info.source;
      image.width = info.width;
      image.height = info.height;
      image.loading = 'lazy';
      image.decoding = 'async';
      link.append(image);
      figure.append(link, element('figcaption', caption));
      gallery.append(figure);
    }
    return gallery;
  }

  function variantDetails(product, variant) {
    const item = element('div', '', 'variant');
    if (variant.label) item.append(element('h5', variant.label));
    const details = element('dl');
    const weight = variant.weight ? variant.weight + ' г' : 'Уточнить';
    for (const [label, value] of [
      ['Вес', weight],
      ['Оптовая цена', formatPrice(product, variant)],
      ...(variant.minimum ? [['Минимальная партия', variant.minimum]] : []),
      ['Состав', variant.ingredients || 'Уточнить у менеджера'],
      ['Хранение', variant.storage || 'Уточнить у менеджера']
    ]) {
      details.append(element('dt', label), element('dd', value));
    }
    item.append(details);
    return item;
  }

  function formatPrice(product, variant) {
    const value = window.partnerCatalog.price(product, variant);
    return Number.isFinite(value) ? rubles.format(value) + ' / шт.' : (window.partnerCatalog.isSignedIn() ? 'Уточнить у менеджера' : 'В кабинете партнёра');
  }

  function productCard(product) {
    const card = element('article', '', 'wh-product');
    const photoSets = product.variants.filter(variant => variant.photos.length);
    const shared = photoSets.length === product.variants.length &&
      photoSets.every(variant => variant.photos.join() === photoSets[0].photos.join());
    if (shared) {
      card.append(photoGallery(photoSets[0].photos, product.name));
    } else {
      for (const variant of photoSets) {
        card.append(photoGallery(variant.photos, product.name, variant.label));
      }
    }
    const content = element('div', '', 'product-content');
    content.append(element('h4', product.name));
    if (product.description) content.append(element('p', product.description, 'product-description'));
    const weights = product.variants.map(variant => {
      return [variant.label, variant.weight && (variant.weight + ' г')].filter(Boolean).join(' · ');
    }).filter(Boolean);
    if (weights.length) content.append(element('p', weights.join(' / '), 'product-weight'));
    const prices = product.variants.map(variant => window.partnerCatalog.price(product, variant)).filter(Number.isFinite);
    if (prices.length) {
      const prefix = new Set(prices).size > 1 ? 'От ' : '';
      content.append(element('p', prefix + rubles.format(Math.min(...prices)) + ' / шт.', 'product-price'));
    }

    const details = element('details', '', 'product-details');
    const summary = element('summary', 'Состав и хранение', 'product-summary');
    details.append(summary);
    const body = element('div', '', 'product-body');
    for (const variant of product.variants) {
      const specification = variantDetails(product, variant);
      specification.append(window.partnerCatalog.controls(product, variant));
      body.append(specification);
    }
    details.append(body);
    content.append(details);
    card.append(content);
    return card;
  }

  function normalized(value) {
    return value.toLowerCase().replaceAll('ё', 'е');
  }

  function hasPhoto(product, cutOnly = false) {
    return product.variants.some(variant => variant.photos.some(path => {
      return !cutOnly || window.BAKERY_PHOTOS[path].label.toLowerCase().includes('разрез');
    }));
  }

  function render() {
    const selected = category.value;
    const priceLink = document.querySelector('.price-link');
    priceLink.firstChild.textContent = window.partnerCatalog.isSignedIn() ? 'Кабинет партнёра ' : 'Войти для просмотра цен ';
    for (const button of tabs.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.dataset.category === selected));
    }
    const terms = normalized(search.value).trim().split(/\s+/).filter(Boolean);
    const filtered = window.WHOLESALE_PRODUCTS.filter(product => {
      if (selected !== '' && Number(selected) !== product.category) return false;
      if (photos.value && !hasPhoto(product, photos.value === 'cut')) return false;
      const searchText = normalized([
        product.name, product.description,
        ...product.variants.flatMap(v => [v.label, v.weight, v.ingredients])
      ].join(' '));
      return terms.every(term => searchText.includes(term));
    });
    window.partnerCatalog.reset();
    const fragment = document.createDocumentFragment();
    for (const option of category.options) {
      if (option.value === '') continue;
      const products = filtered.filter(product => product.category === Number(option.value))
        .sort((a, b) => Number(hasPhoto(b)) - Number(hasPhoto(a)));
      if (!products.length) continue;
      const group = element('section', '', 'collection');
      group.append(element('h3', option.textContent, 'collection-title'));
      const cards = element('div', '', 'wh-grid');
      cards.append(...products.map(productCard));
      group.append(cards);
      fragment.append(group);
    }
    results.replaceChildren(fragment);
    window.partnerCatalog.ready();
    const variants = filtered.reduce((total, product) => total + product.variants.length, 0);
    count.textContent = variants ? 'Изделий: ' + filtered.length + ' · Фасовок и вкусов: ' + variants : 'Ничего не найдено. Попробуйте другое название или выберите все категории.';
  }

  for (const option of category.options) {
    const button = element('button', option.textContent);
    button.type = 'button';
    button.dataset.category = option.value;
    button.addEventListener('click', () => {
      category.value = option.value;
      render();
    });
    tabs.append(button);
  }
  search.addEventListener('input', render);
  category.addEventListener('change', render);
  photos.addEventListener('change', render);
  document.addEventListener('menabu-partner-state', render);
  render();
})();
