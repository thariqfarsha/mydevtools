import { createRouter, createWebHistory } from 'vue-router';
import JsonFormatter from '../views/JsonFormatter.vue';
import DiffChecker from '../views/DiffChecker.vue';
import HtmlFormatter from '../views/HtmlFormatter.vue';
import SqlFormatter from '../views/SqlFormatter.vue';
// import HtmlFormatter from '../views/HtmlFormatter.vue';
// import Base64Tool from '../views/Base64Tool.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/json' },
    { path: '/json', component: JsonFormatter },
    { path: '/html', component: HtmlFormatter },
    { path: '/sql', component: SqlFormatter },
    { path: '/diff', component: DiffChecker },
  ]
});