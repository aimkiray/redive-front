import Vue from 'vue'
import ElementUI from 'element-ui';
import APlayer from '@moefe/vue-aplayer';
import VueRouter from "vue-router";
import axios from 'axios';

import App from './App.vue'
import store from "./store/main"
import router from "./router/main"

import 'element-ui/lib/theme-chalk/index.css'
import './styles/index.scss'

Vue.config.productionTip = false;

Vue.use(VueRouter);
Vue.use(ElementUI);
Vue.use(APlayer, {
  defaultCover: 'https://avatars2.githubusercontent.com/u/28665259'
});

const instance = axios.create({
  baseURL: 'http://127.0.0.1/api',
  timeout: 100000,
});
Vue.prototype.$axios = instance;

new Vue({
  render: h => h(App),
  router,
  store: store,
}).$mount('#app');
