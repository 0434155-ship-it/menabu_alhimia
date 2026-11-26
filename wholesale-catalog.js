(() => {
  const search = document.getElementById('wholesale-search');
  const category = document.getElementById('wholesale-category');
  const count = document.getElementById('wholesale-count');
  const results = document.getElementById('wholesale-products');

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function photoGallery(paths, name) {
    const gallery = element('div', '', 'product-photos');
    for (const path of paths) {
      const info = window.BAKERY_PHOTOS[path];
      const figure = element('figure');
      const link = element('a');
      link.href = path;
      link.target = '_blank';
      link.rel = 'noopener';
      const image = element('img');
      image.src = path;
      image.alt = name + ' — ' + info.label.toLowerCase();
      image.width = info.width;
      image.height = info.height;
      image.loading = 'lazy';
      image.decoding = 'async';
      link.append(image);
      figure.append(link, element('figcaption', info.label));
      gallery.append(figure);
    }
    return gallery;
  }

  function variantDetails(variant, name, sharedPhotos) {
    const item = element('div', '', 'variant');
    if (variant.label) item.append(element('h5', variant.label));
    const details = element('dl');
    const weight = variant.weight ? variant.weight + ' г' : 'Уточнить';
    for (const [label, value] of [
      ['Вес', weight],
      ['Состав', variant.ingredients || 'Уточнить у менеджера'],
      ['Хранение', variant.storage || 'Уточнить у менеджера']
    ]) {
      details.append(element('dt', label), element('dd', value));
    }
    item.append(details);
    if (!sharedPhotos && variant.photos.length) item.append(photoGallery(variant.photos, name));
    return item;
  }

  function productCard(product) {
    const article = element('article', '', 'wh-product');
    const photos = product.variants[0].photos;
    const sharedPhotos = photos.length > 0 && product.variants.every(v => v.photos.join() === photos.join());
    if (sharedPhotos) article.append(photoGallery(photos, product.name));
    article.append(element('h4', product.name));
    const summary = product.variants.map(v => {
      return [v.label, v.weight && (v.weight + ' г')].filter(Boolean).join(' · ');
    }).filter(Boolean).join(' / ');
    if (summary) article.append(element('p', summary, 'muted'));
    const details = element('details');
    details.append(element('summary', product.variants.length > 1 ? 'Фасовки, состав и хранение' : 'Состав и хранение'));
    details.append(...product.variants.map(variant => variantDetails(variant, product.name, sharedPhotos)));
    article.append(details);
    return article;
  }

  function normalized(value) {
    return value.toLowerCase().replaceAll('ё', 'е');
  }

  function render() {
    const selected = category.value;
    const terms = normalized(search.value).trim().split(/\s+/).filter(Boolean);
    const filtered = window.WHOLESALE_PRODUCTS.filter(product => {
      if (selected !== '' && Number(selected) !== product.category) return false;
      const searchText = normalized([
        product.name,
        ...product.variants.flatMap(v => [v.label, v.weight, v.ingredients])
      ].join(' '));
      return terms.every(term => searchText.includes(term));
    });
    const fragment = document.createDocumentFragment();
    for (const option of category.options) {
      if (option.value === '') continue;
      const products = filtered.filter(product => product.category === Number(option.value));
      if (!products.length) continue;
      const group = element('section', '', 'collection');
      group.append(element('h3', option.textContent, 'collection-title'));
      const cards = element('div', '', 'wh-grid');
      cards.append(...products.map(productCard));
      group.append(cards);
      fragment.append(group);
    }
    results.replaceChildren(fragment);
    const variants = filtered.reduce((total, product) => total + product.variants.length, 0);
    count.textContent = variants ? 'Изделий: ' + filtered.length + ' · Фасовок и вкусов: ' + variants : 'Ничего не найдено. Попробуйте другое название или выберите все категории.';
  }

  search.addEventListener('input', render);
  category.addEventListener('change', render);
  render();
})();
