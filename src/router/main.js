import Vue from 'vue'
import VueRouter from 'vue-router'

import AudioPlayer from "../components/AudioPlayer";
import AudioEditor from "../components/AudioEditor";
import AudioList from "../components/AudioList";
import Equipment from "../components/Equipment";
import User from "../components/User";

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
            path: '/user',
            name: 'user',
            component: User
        },
        {
            path: '/equipment',
            name: 'equipment',
            component: Equipment,
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
    // Sign in to access admin page
    if (to.name.indexOf('equipment') !== -1) {
        // TODO Whether the token is valid
        if (!localStorage.getItem("token")) {
            next('/user');
            return
        }
    }

    // Identify home menu or admin tab by path
    if (to.path.indexOf('equipment/audio') !== -1) {
        store.commit("setActiveAdminMenu", to.name);
    } else if (to.name === "user") {
        store.commit("setActiveMenu", "equipment");
    } else {
        store.commit("setActiveMenu", to.name);
    }
    next()
});

export default router