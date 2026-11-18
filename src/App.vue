<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTabStore } from './stores/tabStore';
import { useToasts } from './composables/useToast';
import { categories, tools } from './tools';
import Icon, { type IconName } from './components/Icon.vue';
import { cycleTheme, themePreference, type ThemePreference } from './composables/useTheme';

const THEME_OPTIONS: { value: ThemePreference; icon: IconName; label: string }[] = [
  { value: 'system', icon: 'monitor', label: 'System' },
  { value: 'light', icon: 'sun', label: 'Light' },
  { value: 'dark', icon: 'moon', label: 'Dark' },
];
const currentThemeOption = computed(() => THEME_OPTIONS.find((o) => o.value === themePreference.value)!);

const store = useTabStore();
const router = useRouter();
const toasts = useToasts();

const expanded = computed(() => store.isLocked || store.isHovered);
const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

// ---- Search ----
const query = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
const highlighted = ref(0);

const matches = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return tools;
  return tools.filter((t) => `${t.label} ${t.description} ${t.keywords ?? ''}`.toLowerCase().includes(q));
});

const groups = computed(() =>
  categories
    .map((category) => ({ category, items: matches.value.filter((t) => t.category === category) }))
    .filter((g) => g.items.length));

// Flat order as rendered, for arrow-key navigation.
const flatMatches = computed(() => groups.value.flatMap((g) => g.items));

watch(query, () => (highlighted.value = 0));

const focusSearch = async () => {
  store.isHovered = true;
  await nextTick();
  searchInput.value?.focus();
  searchInput.value?.select();
};

const closeSearch = () => {
  query.value = '';
  searchInput.value?.blur();
};

const onSearchKey = (e: KeyboardEvent) => {
  const list = flatMatches.value;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    highlighted.value = Math.min(highlighted.value + 1, list.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    highlighted.value = Math.max(highlighted.value - 1, 0);
  } else if (e.key === 'Enter' && list[highlighted.value]) {
    router.push(list[highlighted.value].path);
    closeSearch();
  } else if (e.key === 'Escape') {
    closeSearch();
  }
};

const onGlobalKey = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    // Capture phase + stopPropagation: Monaco uses Cmd/Ctrl+K as a chord prefix and would swallow it.
    e.preventDefault();
    e.stopPropagation();
    focusSearch();
  }
};

onMounted(() => window.addEventListener('keydown', onGlobalKey, true));
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKey, true));
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-canvas font-sans text-fg">
    <aside
      @mouseenter="store.isHovered = true"
      @mouseleave="store.isHovered = false"
      :class="expanded ? 'w-60' : 'w-14'"
      class="z-50 flex shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200"
    >
      <!-- Brand -->
      <div class="flex h-14 shrink-0 items-center gap-2.5 overflow-hidden border-b border-line px-3">
        <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent font-mono text-[13px] font-bold text-on-accent shadow-lg shadow-accent/20">&gt;_</div>
        <div v-show="expanded" class="min-w-0 flex-1">
          <div class="truncate text-[13px] font-semibold text-fg">My DevTools</div>
          <div class="truncate text-[11px] text-subtle">Offline utilities</div>
        </div>
        <button v-show="expanded" @click="store.isLocked = !store.isLocked"
                class="btn-icon" :aria-pressed="store.isLocked"
                :title="store.isLocked ? 'Collapse sidebar' : 'Keep sidebar open'">
          <Icon name="sidebar" />
        </button>
      </div>

      <!-- Search -->
      <div class="shrink-0 px-2 pt-3 pb-1">
        <div v-if="expanded" class="relative">
          <Icon name="search" :size="14" class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-subtle" />
          <input
            ref="searchInput"
            v-model="query"
            @keydown="onSearchKey"
            type="search"
            placeholder="Search tools"
            aria-label="Search tools"
            class="field h-8 w-full bg-canvas pr-12 pl-8"
          />
          <span v-if="!query" class="kbd pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">{{ isMac ? '⌘' : 'Ctrl' }} K</span>
        </div>
        <button v-else @click="focusSearch" class="btn-icon mx-auto flex size-8" title="Search tools">
          <Icon name="search" />
        </button>
      </div>

      <!-- Tools -->
      <nav class="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3">
        <div v-for="group in groups" :key="group.category" class="mt-3 first:mt-2">
          <div v-if="expanded" class="label mb-1 truncate px-2 text-[10px]">{{ group.category }}</div>
          <div v-else class="mx-auto mb-1 h-px w-6 bg-line"></div>
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            @click="closeSearch"
            :title="expanded ? undefined : item.label"
            class="relative flex h-8 items-center gap-2.5 rounded-md text-[13px] transition-colors"
            :class="[
              $route.path === item.path ? 'bg-raised text-fg' : 'text-muted hover:bg-raised/60 hover:text-fg',
              query && flatMatches[highlighted]?.path === item.path ? 'ring-1 ring-accent/60' : '',
              expanded ? 'px-2' : 'justify-center',
            ]"
          >
            <span v-if="$route.path === item.path" class="absolute top-1.5 bottom-1.5 -left-2 w-0.5 rounded-r bg-highlight"></span>
            <Icon :paths="item.icon" :class="$route.path === item.path ? 'text-accent' : ''" />
            <span v-show="expanded" class="truncate">{{ item.label }}</span>
          </router-link>
        </div>
        <p v-if="!groups.length && expanded" class="px-2 py-6 text-center text-xs text-subtle">No tools match “{{ query }}”</p>
      </nav>

      <!-- Footer: theme + privacy note -->
      <div class="shrink-0 space-y-2.5 border-t border-line p-3">
        <div v-if="expanded" class="segmented w-full" role="group" aria-label="Theme">
          <button v-for="opt in THEME_OPTIONS" :key="opt.value"
                  class="flex flex-1 items-center justify-center gap-1.5"
                  :aria-pressed="themePreference === opt.value"
                  :title="`${opt.label} theme`"
                  @click="themePreference = opt.value">
            <Icon :name="opt.icon" :size="13" /> {{ opt.label }}
          </button>
        </div>
        <button v-else class="btn-icon mx-auto flex size-8" @click="cycleTheme"
                :title="`Theme: ${currentThemeOption.label} (click to change)`">
          <Icon :name="currentThemeOption.icon" />
        </button>

        <div class="flex items-center gap-2 overflow-hidden text-[11px] text-subtle" :class="expanded ? '' : 'justify-center'"
             title="Every tool runs entirely in your browser. Nothing is sent to a server.">
          <Icon name="shield" :size="14" class="text-success/80" />
          <span v-show="expanded" class="truncate">Runs 100% in your browser</span>
        </div>
      </div>
    </aside>

    <main class="min-w-0 flex-1"><router-view /></main>

    <!-- Toasts -->
    <div class="pointer-events-none fixed right-4 bottom-10 z-[100] flex flex-col items-end gap-2">
      <TransitionGroup
        enter-from-class="opacity-0 translate-y-2" enter-active-class="transition duration-150"
        leave-to-class="opacity-0" leave-active-class="transition duration-150">
        <div v-for="t in toasts" :key="t.id"
             class="rounded-lg border border-line-strong bg-raised px-3 py-2 text-xs shadow-xl shadow-black/10 dark:shadow-black/40"
             :class="t.tone === 'error' ? 'text-danger' : 'text-fg'">
          {{ t.text }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>
