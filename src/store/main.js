import Vue from 'vue'
import Vuex from 'vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        activeMenu: "audio-player",
        activeAdminMenu: "audio-list",
        editAudio: null,
        baseUrl: "",
    },
    mutations: {
        setActiveMenu(state, menu) {
            state.activeMenu = menu
        },
        setActiveAdminMenu(state, menu) {
            state.activeAdminMenu = menu
        },
        setEditAudio(state, audio) {
            state.editAudio = audio
        }
    }
});

export default store;