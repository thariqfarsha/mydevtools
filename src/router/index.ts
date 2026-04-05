import { createRouter, createWebHistory } from 'vue-router';
import JsonFormatter from '../views/JsonFormatter.vue';
// import HtmlFormatter from '../views/HtmlFormatter.vue';
// import Base64Tool from '../views/Base64Tool.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/json' },
    { path: '/json', component: JsonFormatter },
    // { path: '/html', component: HtmlFormatter },
    // { path: '/base64', component: Base64Tool },
  ]
});