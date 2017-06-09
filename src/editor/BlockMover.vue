<template>
  <div class="editor-block-mover">
    <icon-button
      class="editor-block-mover__control"
      @click.native="moveUp"
      icon="arrow-up-alt2"
      :aria-disabled="isFirst"
    />
    <icon-button
      class="editor-block-mover__control"
      @click.native="moveDown"
      icon="arrow-down-alt2"
      :aria-disabled="isLast"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { isFirstBlock, isLastBlock } from '../selectors';
import IconButton from '../components/IconButton';

export default {
  name: 'block-mover',
  props: ['uid'],
  computed: mapState({
    isFirst(state) {
      return isFirstBlock(state, this.uid);
    },
    isLast(state) {
      return isLastBlock(state, this.uid);
    },
  }),
  methods: {
    moveUp() {
      if (this.isFirst) {
        return;
      }
      this.$store.commit('moveBlockUp', this.uid);
    },
    moveDown() {
      if (this.isLast) {
        return;
      }
      this.$store.commit('moveBlockDown', this.uid);
    },
  },
  components: {
    IconButton,
  },
};
</script>

<style lang="scss">
  .editor-block-mover {
    position: absolute;
    top: 10px;
    left: -$block-mover-padding-visible;
  }

  .editor-block-mover__control {
    display: block;
    padding: 0;
    border: none;
    outline: none;
    background: none;
    color: $dark-gray-300;
    cursor: pointer;
    width: 20px;
    height: 20px;
    border-radius: 50%;

    &[aria-disabled="true"] {
      cursor: default;
      color: $light-gray-300;
      pointer-events: none;
    }

    .dashicon {
      display: block;
    }
  }
</style>
