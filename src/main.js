// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import App from './App';
import post from './post-content';
import { parse } from './blocks';
import store from './store';

store.commit('resetBlocks', parse(post.content.raw));

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  template: '<App />',
  components: { App },
});
