import { createRouter, createWebHistory } from 'vue-router';
import JsonFormatter from '../views/JsonFormatter.vue';
import DiffChecker from '../views/DiffChecker.vue';
import HtmlFormatter from '../views/HtmlFormatter.vue';
import SqlFormatter from '../views/SqlFormatter.vue';
import Base64Image from '../views/Base64Image.vue';
import JsonEscape from '../views/JsonEscape.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/json' },
    { path: '/json', component: JsonFormatter },
    { path: '/html', component: HtmlFormatter },
    { path: '/sql', component: SqlFormatter },
    { path: '/json-escape', component: JsonEscape },
    { path: '/diff', component: DiffChecker },
    { path: '/base64-image', component: Base64Image },
  ]
});