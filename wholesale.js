(() => {
  const redirectInvitation = () => {
    const invitation = new URLSearchParams(location.hash.slice(1)).get('invite');
    if (!invitation) return;
    const catalog = new URL('https://menabu-catalog-four.verak-cosmo.chatgpt.site/wholesale.html');
    catalog.hash = new URLSearchParams({invite: invitation}).toString();
    location.replace(catalog);
  };
  addEventListener('hashchange', redirectInvitation);
  redirectInvitation();
})();
