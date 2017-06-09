import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    selectedBlock: null,
  },
  mutations: {
    selectBlock(state, uid) {
      state.selectedBlock = uid;
    },
  },
});

export default store;
