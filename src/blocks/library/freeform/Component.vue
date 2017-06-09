<template>
  <div>
    <tiny-mce :value="attributes.content" />
  </div>
</template>

<script>
import TinyMce from '../../components/TinyMce';

export default {
  name: 'free-form',
  props: ['attributes'],
  components: {
    TinyMce,
  },
};
</script>

