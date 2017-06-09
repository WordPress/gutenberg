<template>
  <div
    tabindex="0"
    :class="['editor-visual-editor__block', { 'is-selected': isSelected }]"
    @mousedown="select"
    @focus="focus"
  >
    <component :is="type.edit" :attributes="block.attributes" />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { getBlockType } from '../blocks';
import { isBlockSelected } from '../selectors';

export default {
  name: 'visual-editor-block',
  props: ['block'],
  computed: {
    type() {
      return getBlockType(this.block.name);
    },
    ...mapState({
      isSelected(state) {
        return isBlockSelected(state, this.block.uid);
      },
    }),
  },
  methods: {
    select() {
      this.$store.commit('selectBlock', this.block.uid);
    },
    focus(event) {
      if (event.target === this.$el) {
        this.select();
      }
    },
  },
};
</script>

<style lang="scss">
  .editor-visual-editor__block {
    margin-left: auto;
    margin-right: auto;
    max-width: $visual-editor-max-width;
    position: relative;
    padding: $block-padding;
    transition: 0.2s border-color;

    &:before {
      z-index: z-index( '.editor-visual-editor__block:before' );
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      border: 2px solid transparent;
      transition: 0.2s border-color;
    }

    &.is-hovered:before {
      border-left-color: $light-gray-500;
    }

    &.is-selected:before {
      border-color: $light-gray-500;
    }

    &.is-multi-selected *::selection {
      background: transparent;
    }

    &.is-multi-selected:before {
      background: $blue-medium-100;
      border: 2px solid $blue-medium-200;
    }

    .iframe-overlay {
      position: relative;
    }

    .iframe-overlay:before {
      content: '';
      display: block;
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
    }

    &.is-selected .iframe-overlay:before {
      display: none;
    }

    // Alignments
    &[data-align="left"],
    &[data-align="right"] {
      // Without z-index, won't be clickable as "above" adjacent content
      z-index: z-index( '.editor-visual-editor__block {core/image aligned left or right}' );
      max-width: 370px;

      .editor-block-mover {
        display: none;
      }
    }

    &[data-align="left"] {
      float: left;

      // mobile, and no sidebars
      margin-right: $block-padding;

      // sidebar (folded)
      .auto-fold .editor-layout:not( .is-sidebar-opened ) & {
        @include editor-width( $admin-sidebar-width-collapsed + $visual-editor-max-width - $block-padding ) {
          margin-left: $float-margin;
        }
      }

      // sidebar (sticky)
      .sticky-menu .editor-layout:not( .is-sidebar-opened ) & {
        @include editor-width( $admin-sidebar-width + $visual-editor-max-width - $block-padding ) {
          margin-left: $float-margin;
        }
      }

      // sidebar (sticky) and post settings
      .sticky-menu .editor-layout & {
        @include editor-width( $admin-sidebar-width + $visual-editor-max-width + $sidebar-width - $block-padding ) {
          margin-left: $float-margin;
        }
      }

      // sidebar and post settings
      .auto-fold .is-sidebar-opened & {
        @include editor-width( $admin-sidebar-width + $visual-editor-max-width + $sidebar-width ) {
          margin-left: $float-margin;
        }
      }
    }

    &[data-align="right"] {
      float: right;

      // mobile, and no sidebars
      margin-right: $block-padding;

      // sidebar (folded)
      .auto-fold .editor-layout:not( .is-sidebar-opened ) & {
        @include editor-width( $admin-sidebar-width-collapsed + $visual-editor-max-width - $block-padding ) {
          margin-right: $float-margin;
        }
      }

      // sidebar (sticky)
      .sticky-menu .editor-layout:not( .is-sidebar-opened ) & {
        @include editor-width( $admin-sidebar-width + $visual-editor-max-width - $block-padding ) {
          margin-right: $float-margin;
        }
      }

      // sidebar (sticky) and post settings
      .sticky-menu .editor-layout & {
        @include editor-width( $admin-sidebar-width + $visual-editor-max-width + $sidebar-width - $block-padding ) {
          margin-right: $float-margin;
        }
      }

      // sidebar and post settings
      .auto-fold .is-sidebar-opened & {
        @include editor-width( $admin-sidebar-width + $visual-editor-max-width + $sidebar-width ) {
          margin-right: $float-margin;
        }
      }
    }

    &[data-align="wide"] {
      max-width: 1100px;
    }

    &[data-align="full"] {
      max-width: 100%;
      padding-left: 0;
      padding-right: 0;

      &:before {
        left: 0;
        border-left-width: 0;
        border-right-width: 0;
      }

      .editor-block-mover {
        display: none;
      }
    }

    &[data-align="full"],
    &[data-align="wide"] {
      .editor-visual-editor__block-controls {
        width: $visual-editor-max-width - $block-padding - $block-padding;
        margin-left: auto;
        margin-right: auto;
      }
    }
  }
</style>
