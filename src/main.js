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

Vue.use(VueRouter);
Vue.use(ElementUI);

Vue.use(APlayer, {
  defaultCover: 'https://github.com/u3u.png',
  productionTip: false,
});

Vue.config.productionTip = false;
Vue.prototype.$axios = axios;

new Vue({
  render: h => h(App),
  router,
  store: store,
}).$mount('#app');
