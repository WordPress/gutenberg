<template>
  <div class="editor-text-editor">
    <textarea
      class="editor-text-editor__textarea"
      :value="value"
      @blur="update"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { getBlocks } from '../selectors';
import { serialize, parse } from '../blocks/api';

export default {
  name: 'text-editor',
  computed: mapState({
    value(state) {
      return serialize(getBlocks(state));
    },
  }),
  methods: {
    update(event) {
      this.$store.commit('resetBlocks', parse(event.target.value));
    },
  },
};
</script>

<style lang="scss">
  .editor-text-editor__textarea {
    display: block;
    padding-top: 20px;
    padding-bottom: 0;
    margin: 0;
    width: 100%;
    border: none;
    outline: none;
    box-shadow: none;
    resize: none;
    overflow: hidden;
    font-family: $editor-html-font;
    font-size: $text-editor-font-size;
    line-height: 150%;
    transition: padding .2s linear;
    min-height: 600px;

    &:focus {
      box-shadow: none;
    }
  }
</style>
