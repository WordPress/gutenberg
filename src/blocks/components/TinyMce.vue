<script>
import tinymce from 'tinymce';

export default {
  name: 'tiny-mce',
  props: ['value', 'tagname'],
  render(createElement) {
    return createElement(this.tagname || 'div', {
      class: 'blocks-editable__tinymce',
    });
  },
  mounted() {
    tinymce.init({
      theme: false,
      inline: true,
      toolbar: false,
      browser_spellcheck: true,
      entity_encoding: 'raw',
      convert_urls: false,
      formats: {
        strikethrough: { inline: 'del' },
      },
      target: this.$el,
      setup: (editor) => {
        editor.on('init', () => {
          editor.setContent(this.$props.value || '', { format: 'raw' });
        });
      },
    });
  },
};
</script>

<style lang="scss">
  .blocks-editable__tinymce {
    > p:first-child {
      margin-top: 0;
    }

    > p:last-child {
      margin-bottom: 0;
    }

    &:focus {
      outline: none;
    }

    a {
      color: $blue-medium-500;
    }

    &:focus a[data-mce-selected] {
      padding: 0 2px;
      margin: 0 -2px;
      border-radius: 2px;
      box-shadow: 0 0 0 1px $blue-medium-100;
      background: $blue-medium-100;
    }

    code {
      padding: 2px;
      border-radius: 2px;
      color: $dark-gray-800;
      background: $light-gray-200;
      font-family: $editor-html-font;
      font-size: 14px;
    }

    &:focus code[data-mce-selected] {
      background: $light-gray-400;
    }

    &[data-is-empty="true"] {
      position: relative;
    }

    &[data-is-empty="true"]:before {
      content: attr( data-placeholder );
      opacity: 0.5;
      pointer-events: none;
      position: absolute;
    }
  }
</style>
