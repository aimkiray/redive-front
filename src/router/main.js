import Vue from 'vue'
import VueRouter from 'vue-router'

import AudioPlayer from "../components/AudioPlayer";
import AudioEditor from "../components/AudioEditor";
import AudioList from "../components/AudioList";
import Admin from "../components/Admin";

import store from '../store/main'

Vue.use(VueRouter);

let router = new VueRouter({
    routes: [
        {
            path: '/',
            redirect: 'audio-player'
        },
        {
            path: '/audio-player',
            name: 'audio-player',
            component: AudioPlayer
        },
        {
            path: '/equipment',
            name: 'equipment',
            component: Admin,
            children: [
                {
                    path: 'audio-editor',
                    name: 'audio-editor',
                    component: AudioEditor
                },
                {
                    path: 'audio-list',
                    name: 'audio-list',
                    component: AudioList
                }
            ]
        },
    ]
});

router.beforeEach((to, from, next) => {
    // eslint-disable-next-line no-console
    console.log(to.name);
    // Sign in to access admin page
    // if (to.name.indexOf('admin') !== -1) {
    //     if (!localStorage.getItem("token")) {
    //         next('/');
    //         return
    //     }
    // }

    // Identify home menu or admin tab by path
    if (to.path.indexOf('equipment/audio') !== -1) {
        store.commit("setActiveAdminMenu", to.name);
    } else {
        store.commit("setActiveMenu", to.name);
    }
    next()
});

export default router