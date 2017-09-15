<template>
  <div class="editor-mode-switcher">
    <select
      class="editor-mode-switcher__input"
      :value="mode"
      @change="switchMode"
    >
      <option v-for="mode in modes" :key="mode.value" :value="mode.value">
        {{ mode.label }}
      </option>
    </select>
    <dashicon icon="arrow-down" />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Dashicon from '../components/Dashicon';
import { getEditorMode } from '../selectors';

export default {
  name: 'editor-mode-switcher',
  data() {
    return {
      modes: [
        {
          value: 'visual',
          label: 'Visual',
        },
        {
          value: 'text',
          label: 'Text',
        },
      ],
    };
  },
  computed: mapState({
    mode(state) {
      return getEditorMode(state);
    },
  }),
  methods: {
    switchMode(event) {
      this.$store.commit('switchMode', event.target.value);
    },
  },
  components: {
    Dashicon,
  },
};
</script>

<style lang="scss">
  .editor-mode-switcher {
    position: relative;
    margin-right: $item-spacing;
    padding-right: $item-spacing;
    color: $dark-gray-500;
    align-items: center;
    cursor: pointer;
    border-right: 1px solid $light-gray-500;
    outline: none;
    display: flex;
    align-items: center;

    .editor-mode-switcher__input {
      background: transparent;
      line-height: 1;
      border: 0;
      border-radius: 0;
      -webkit-appearance: none;
      outline: none;
      cursor: pointer;
      box-shadow: none;
      padding-right: 0;
      font-size: 13px;
      height: auto;

      @include break-small {
        padding-right: 24px;
      }
    }

    .dashicon {
      position: relative;
      z-index: z-index( '.editor-mode-switcher .dashicon' );
      margin-left: -24px;
      margin-top: -1px;
    }

    &:hover,
    select:hover {
      color: $dark-gray-900;
    }
  }
</style>
