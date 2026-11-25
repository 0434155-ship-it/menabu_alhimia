(() => {
  const list = document.getElementById('recent-posts');
  if (!list) return;

  const cacheKey = 'menabu.telegram.publications.v1';
  const interval = 10 * 60 * 1000;
  let lastAttempt = 0;
  let loading = false;

  function show(posts) {
    if (!Array.isArray(posts) || !posts.length || posts.length > 2) return false;
    if (!posts.every(post => post && Number.isSafeInteger(post.id) && post.id > 0 &&
        typeof post.title === 'string' && post.title.trim())) return false;
    const items = posts.map(post => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = 'https://t.me/menabu_bakery/' + post.id;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = post.title;
      item.append(link);
      return item;
    });
    list.replaceChildren(...items);
    return true;
  }

  async function refresh() {
    if (!list.dataset.feed || document.hidden || loading || Date.now() - lastAttempt < interval) return;
    loading = true;
    lastAttempt = Date.now();
    try {
      const response = await fetch(list.dataset.feed, {credentials: 'omit', signal: AbortSignal.timeout(14000)});
      if (!response.ok) return;
      const {posts} = await response.json();
      if (show(posts)) localStorage.setItem(cacheKey, JSON.stringify(posts));
    } catch {
      // The last available links remain readable offline.
    } finally {
      loading = false;
    }
  }

  try { show(JSON.parse(localStorage.getItem(cacheKey))); } catch { /* Storage may be disabled. */ }
  refresh();
  setInterval(refresh, interval);
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('online', () => { lastAttempt = 0; refresh(); });
})();
