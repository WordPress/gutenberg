<template>
  <btn v-bind="buttonProps">
    <dashicon :icon="icon" />
    <slot />
  </btn>
</template>

<script>
import { omit } from 'lodash';
import Btn from './Btn';
import Dashicon from './Dashicon';

export default {
  name: 'icon-button',
  // Is there a ...props here?
  props: ['icon', 'href', 'target', 'isPrimary', 'isLarge', 'isToggled', 'className', 'disabled', 'extra'],
  computed: {
    buttonProps() {
      const className = [this.className, 'components-icon-button'];
      return { ...omit(this.$props, ['icon', 'className']), className };
    },
  },
  components: {
    Dashicon,
    Btn,
  },
};
</script>

<style lang="scss">
  .components-icon-button {
    display: flex;
    align-items: center;
    padding: 0;
    border: none;
    background: none;
    color: $dark-gray-500;
    position: relative;
    width: $icon-button-size;	// show only icon on small breakpoints
    overflow: hidden;
    border-radius: 4px;
    height: auto;

    .dashicon {
      flex: 0 0 auto;
    }

    @include break-medium() {
      width: auto;
    }

    &:not( :disabled ) {
      cursor: pointer;

      &:hover {
        color: $blue-medium-500;
      }
    }

    &:focus {
      box-shadow: 0 0 0 1px $blue-medium-400, 0 0 2px 1px $blue-medium-400;
      outline: none;
    }

    &:active:focus {
      box-shadow: none;
    }
  }
</style>
