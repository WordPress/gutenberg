<template>
  <div class="editor-visual-editor">
    Visual Editor {{ blocks.length }}

    <div v-for="block in blocks">
      <visual-editor-block :block="block" />
    </div>
  </div>
</template>

<script>
import VisualEditorBlock from './VisualEditorBlock';

export default {
  name: 'visual-editor',
  props: ['blocks'],
  components: {
    VisualEditorBlock,
  },
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
