import Vue from 'vue'
import VueRouter from 'vue-router'

import AudioPlayer from "../components/AudioPlayer";
import AudioEditor from "../components/AudioEditor";
import AudioTable from "../components/AudioTable";
import Playlist from "../components/Playlist";
import BatchImport from "../components/BatchImport";
import Equipment from "../components/Equipment";
import User from "../components/User";
import DataManage from "../components/DataManage";

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
                    path: 'audio-table',
                    name: 'audio-table',
                    component: AudioTable
                },
                {
                    path: 'audio-editor',
                    name: 'audio-editor',
                    component: AudioEditor
                },
                {
                    path: 'batch-import',
                    name: 'batch-import',
                    component: BatchImport
                },
                {
                    path: 'playlist-editor',
                    name: 'playlist-editor',
                    component: Playlist
                },
                {
                    path: 'data-manage',
                    name: 'data-manage',
                    component: DataManage
                }
            ]
        },
    ]
});

router.beforeEach((to, from, next) => {
    // Sign in to access any page
    if (to.name.indexOf('user') === -1) {
        // TODO Whether the token is valid
        if (!localStorage.getItem("token")) {
            store.commit("setActiveMenu", to.name);
            next('/user');
            return
        }
    }

    // Identify home menu or admin tab by path
    if (to.path.indexOf('equipment/') !== -1) {
        store.commit("setActiveMenu", "equipment");
        store.commit("setActiveAdminMenu", to.name);
    } else if (to.name !== "user") {
        store.commit("setActiveMenu", to.name);
    }
    next()
});

export default router
