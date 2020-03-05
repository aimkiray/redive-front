import Vue from 'vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css'
import APlayer from '@moefe/vue-aplayer';
import VueRouter from "vue-router";

import App from './App.vue'
import store from "./store/main"
import router from "./router/main"

Vue.use(VueRouter);
Vue.use(ElementUI);

Vue.use(APlayer, {
  defaultCover: 'https://github.com/u3u.png',
  productionTip: false,
});

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
  router,
  store: store,
}).$mount('#app');
