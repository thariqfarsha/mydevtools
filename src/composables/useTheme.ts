import { computed, ref, watch } from 'vue';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

// Keep in sync with the inline script in index.html (prevents a flash of the wrong theme).
const STORAGE_KEY = 'mydevtools.theme';

const readPreference = (): ThemePreference => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
};

const media = window.matchMedia('(prefers-color-scheme: dark)');
const systemPrefersDark = ref(media.matches);
media.addEventListener('change', (e) => (systemPrefersDark.value = e.matches));

export const themePreference = ref<ThemePreference>(readPreference());

export const resolvedTheme = computed<ResolvedTheme>(() =>
  themePreference.value === 'system' ? (systemPrefersDark.value ? 'dark' : 'light') : themePreference.value);

watch(themePreference, (value) => {
  try {
    if (value === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage unavailable (private mode etc.): the choice just won't persist.
  }
});

watch(resolvedTheme, (theme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}, { immediate: true });

const ORDER: ThemePreference[] = ['system', 'light', 'dark'];
export const cycleTheme = () => {
  themePreference.value = ORDER[(ORDER.indexOf(themePreference.value) + 1) % ORDER.length];
};
