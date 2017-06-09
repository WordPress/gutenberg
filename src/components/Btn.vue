<template>
  <component :is="tag"
    :class="[
      'components-button',
      className,
      {
        'button-primary': isPrimary,
        'button-large': isLarge,
        'is-toggled': isToggled,
      }
    ]"
    v-bind="extraProps"
  >
    <slot />
  </component>
</template>

<script>
export default {
  name: 'btn',
  props: ['href', 'target', 'isPrimary', 'isLarge', 'isToggled', 'className', 'disabled', 'extra'],
  computed: {
    extraProps() {
      const tag = this.href !== undefined && !this.disabled ? 'a' : 'button';
      const tagProps = tag === 'a'
        ? { href: this.href, target: this.target }
        : { type: 'button', disabled: this.disabled };
      return { ...tagProps, ...this.extra };
    },
    tag() {
      return this.href !== undefined && !this.disabled ? 'a' : 'button';
    },
  },
};
</script>

<style lang="scss" scoped>
  .components-button {
    background: none;
    border: none;
    outline: none;
    text-decoration: none;

    &:disabled {
      opacity: 0.6;
    }
  }
</style>
