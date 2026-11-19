// Apply the saved theme before first paint (key must match src/composables/useTheme.ts).
// A separate file rather than an inline script, so the CSP can forbid inline scripts.
(function () {
  var pref = null;
  try { pref = localStorage.getItem('mydevtools.theme'); } catch (e) {}
  var dark = pref ? pref === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
})();
