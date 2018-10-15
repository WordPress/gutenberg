const { createElement } = wp.element;
const { registerBlockType } = wp.blocks;

registerBlockType("{{blockNamespace}}", {
  title: "{{blockName}}",
  description: "{{blockDescription}}",
  icon: "{{blockIcon}}",
  category: "{{blockCategory}}",

  edit: function() {
    return <p>Hello Editor</p>;
  },

  save: function() {
    return <p>Hello Frontend</p>;
  }
});
