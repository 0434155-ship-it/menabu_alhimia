(() => {
  'use strict';

  const grid = document.getElementById('grid');
  const viewer = document.getElementById('catalogViewer');
  const photo = document.getElementById('viewPhoto');
  const message = document.getElementById('viewMessage');
  const caption = document.getElementById('viewCaption');
  const options = document.getElementById('viewOptions');
  const closeButton = document.getElementById('closeCatalogViewer');
  const status = document.getElementById('viewStatus');
  const controls = [...options.querySelectorAll('button')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let trigger, images, productName, active = 0, generation = 0, animation;

  function showPhoto(index) {
    const request = ++generation;
    active = index;
    controls.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    const description = viewLabel(images[index], index);
    status.textContent = '';
    animation?.cancel();
    photo.style.visibility = 'hidden';
    message.hidden = true;
    const source = mnbMedia(images[index]);
    const loader = new Image();
    loader.onload = () => {
      if (request !== generation || !viewer.open) return;
      viewer.style.setProperty('--photo-ratio', String(loader.naturalWidth / loader.naturalHeight));
      photo.alt = productName + ' — ' + description.toLowerCase();
      photo.src = source;
      photo.style.visibility = 'visible';
      if (!reduced.matches && photo.animate) {
        animation = photo.animate([
          { transform: 'scale(.84)', filter: 'brightness(0)', offset: 0 },
          { transform: 'scale(.91)', filter: 'brightness(.22)', offset: .29 },
          { transform: 'scale(1)', filter: 'brightness(1)', offset: 1 }
        ], { duration: 1150, easing: 'cubic-bezier(.22,.67,.25,1)' });
      }
      status.textContent = description;
    };
    loader.onerror = () => {
      if (request !== generation || !viewer.open) return;
      message.textContent = 'Фотография не загрузилась.';
      message.hidden = false;
    };
    loader.src = source;
  }

  function openViewer(button) {
    const id = button.dataset.photo;
    const product = P.find(item => item.id === id);
    images = productViews(id, pick[id] ?? 0);
    if (!product || !images.length) return;
    trigger = button;
    productName = product.n;
    caption.textContent = productName;
    options.hidden = images.length < 2;
    controls.forEach((control, i) => {
      control.hidden = i >= images.length;
      if (!control.hidden) control.textContent = viewLabel(images[i], i);
    });
    const tile = button.querySelector('img');
    const ratio = tile.naturalHeight ? tile.naturalWidth / tile.naturalHeight : 1.4;
    viewer.style.setProperty('--photo-ratio', String(ratio));
    document.documentElement.classList.add('catalog-viewing');
    viewer.showModal();
    closeButton.focus({ preventScroll: true });
    showPhoto(0);
  }

  grid.addEventListener('click', event => {
    const button = event.target.closest('button[data-photo]');
    if (button) openViewer(button);
  });
  const warmed = new Set();
  function preload(event) {
    const button = event.target.closest('button[data-photo]');
    if (!button) return;
    const source = productViews(button.dataset.photo, pick[button.dataset.photo] ?? 0)[0];
    if (source && !warmed.has(source)) {
      warmed.add(source);
      const img = new Image();
      img.src = mnbMedia(source);
    }
  }
  grid.addEventListener('pointerover', preload);
  grid.addEventListener('focusin', preload);
  controls.forEach((button, i) => button.addEventListener('click', () => {
    if (i !== active) showPhoto(i);
  }));
  closeButton.addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => {
    if (event.target !== viewer) return;
    const rect = viewer.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
      viewer.close();
    }
  });
  viewer.addEventListener('keydown', event => {
    if (images.length > 1 && ['ArrowRight','ArrowLeft'].includes(event.key)) {
      event.preventDefault();
      const step = event.key === 'ArrowRight' ? 1 : -1;
      showPhoto((active + step + images.length) % images.length);
    }
  });
  viewer.addEventListener('close', () => {
    if (viewer.open) return;
    generation++;
    animation?.cancel();
    photo.style.visibility = 'hidden';
    photo.removeAttribute('src');
    message.hidden = true;
    document.documentElement.classList.remove('catalog-viewing');
    trigger?.focus({ preventScroll: true });
  });
})();
