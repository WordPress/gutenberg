import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    mode: 'visual',
    selectedBlock: null,
    blocksByUid: {},
    blockOrder: [],
  },
  mutations: {
    switchMode(state, mode) {
      state.mode = mode;
    },

    selectBlock(state, uid) {
      state.selectedBlock = uid;
    },

    resetBlocks(state, blocks) {
      state.blocksByUid = blocks.reduce((memo, block) => {
        memo[block.uid] = block;
        return memo;
      }, []);
      state.blockOrder = blocks.map(block => block.uid);
    },

    moveBlockUp(state, uid) {
      const index = state.blockOrder.indexOf(uid);
      state.blockOrder = [
        ...state.blockOrder.slice(0, index - 1),
        state.blockOrder[index],
        state.blockOrder[index - 1],
        ...state.blockOrder.slice(index + 1),
      ];
    },

    moveBlockDown(state, uid) {
      const index = state.blockOrder.indexOf(uid);
      state.blockOrder = [
        ...state.blockOrder.slice(0, index),
        state.blockOrder[index + 1],
        state.blockOrder[index],
        ...state.blockOrder.slice(index + 2),
      ];
    },
  },
});

export default store;
