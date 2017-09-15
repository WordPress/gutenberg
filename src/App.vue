<template>
  <div class="gutenberg gutenberg__editor">
    <editor-mode-switcher />
    <visual-editor v-if="mode === 'visual'" />
    <text-editor v-if="mode === 'text'" />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import VisualEditor from './editor/VisualEditor';
import TextEditor from './editor/TextEditor';
import EditorModeSwitcher from './editor/EditorModeSwitcher';
import { getEditorMode } from './selectors';

export default {
  name: 'app',
  props: ['blocks'],
  computed: mapState({
    mode(state) {
      return getEditorMode(state);
    },
  }),
  components: {
    VisualEditor,
    TextEditor,
    EditorModeSwitcher,
  },
};
</script>

<style lang="scss">
  @import url( 'https://wordpress.org/wp-admin/load-styles.php?c=0&dir=ltr&load%5B%5D=common,buttons,dashicons,forms' );

  body,
  body {
    background: $white;

    #update-nag, .update-nag {
      display: none;
    }

    #wpcontent {
      padding-left: 0;
    }

    #wpfooter {
      display: none;
    }
  }

  .gutenberg {
    * {
      box-sizing: border-box;
    }

    svg {
      fill: currentColor;
    }

    ul {
      list-style-type: disc;
    }

    ol {
      list-style-type: decimal;
    }

    ul,
    ol {
      margin: 0;
      padding: 0;
    }

    select {
      font-size: 13px;
      color: $dark-gray-500;
    }
  }

  .gutenberg__editor {
    position: relative;

    img {
      max-width: 100%;
    }

    iframe {
      width: 100%;
    }
  }

  .editor-sidebar,
  .editor-post-title,
  .editor-visual-editor__block {
    input,
    textarea {
      border-radius: 4px;
      border-color: $light-gray-500;
      font-family: $default-font;
      font-size: $default-font-size;
      padding: 6px 10px;

      &::-webkit-input-placeholder {
        color: $dark-gray-100;
      }
      &::-moz-placeholder {
        color: $dark-gray-100;
      }
      &:-ms-input-placeholder {
        color: $dark-gray-100;
      }
      &:-moz-placeholder {
        color: $dark-gray-100;
      }
    }
  }
</style>
