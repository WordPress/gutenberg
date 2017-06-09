<template>
  <div class="editor-visual-editor">
    <visual-editor-block v-for="block in blocks" :key="block.uid" :uid="block.uid" />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import VisualEditorBlock from './VisualEditorBlock';
import { getBlocks } from '../selectors';

export default {
  name: 'visual-editor',
  components: {
    VisualEditorBlock,
  },
  computed: mapState({
    blocks(state) {
      return getBlocks(state);
    },
  }),
};
</script>

<style lang="scss">
  .editor-visual-editor,
	.editor-visual-editor p {
    font-family: $editor-font;
    font-size: $editor-font-size;
    line-height: $editor-line-height;
  }
</style>
