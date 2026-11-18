import { createRouter, createWebHistory } from 'vue-router';
import { tools } from '../tools';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: tools[0].path },
    ...tools.map((tool) => ({ path: tool.path, component: tool.component, meta: { title: tool.label } })),
    { path: '/:pathMatch(.*)*', redirect: tools[0].path },
  ],
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · My DevTools` : 'My DevTools';
});

export default router;
