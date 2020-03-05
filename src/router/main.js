import Vue from 'vue'
import VueRouter from 'vue-router'

import VoicePlayer from "../components/VoicePlayer";
import VoiceEditor from "../components/VoiceEditor";
import VoiceList from "../components/VoiceList";
import Admin from "../components/Admin";

import store from '../store/main'

Vue.use(VueRouter);

let router = new VueRouter({
  routes:[
    {
      path: '/',
      redirect: 'voice-player'
    },
    {
      path:'/voice-player',
      name: 'voice-player',
      component: VoicePlayer
    },
    {
      path:'/admin',
      name: 'admin',
      component: Admin
    },
    {
      path:'/voice-editor',
      name: 'voice-editor',
      component: VoiceEditor
    },
    {
      path:'/voice-list',
      name: 'voice-list',
      component: VoiceList
    }
  ]
});

router.beforeEach((to, from, next) => {
  if(to.name === 'voice-editor'){
    if (!localStorage.getItem("token")){
      next('/');
      return
    }
  }
  store.commit("setActiveMenu", to.name);
  next()
});

// router.afterEach((to, from) => {
//   store.commit("setActiveMenu", to.name);
// });

export default router