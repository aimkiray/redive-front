import Vue from 'vue'
import Vuex from 'vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        activeMenu: "voice-player",
        activeTab: "voice-list",
        editVoice: null,
        baseUrl: "",
    },
    mutations: {
        setActiveMenu(state, menu) {
            state.activeMenu = menu
        },
        setActiveTab(state, tab) {
            state.activeTab = tab
        },
        setEditVoice(state, voice) {
            state.editPaper = voice
        }
    }
});

export default store;