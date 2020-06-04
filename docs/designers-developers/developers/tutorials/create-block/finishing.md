
# Finishing Touches

This tutorial covers the basic structure of building a block, and the general concepts for creating a basic blocks. This sets you up for creating numerous more complicated blocks iterating and adding to this.

## Additional Components

The block editor provides a [components package](/packages/components/README.md) which contains numerous prebuilt components you can use to build your block.

You can visually browse the compoents and what their implementation looks like using the Storybook tool published at https://wordpress.github.io/gutenberg

## Additional Tutorials

The **RichText component** allows for creating a richer input besides plain text, allowing for bold, italic, links, and other inline formating. See the[RichText Reference](/docs/designers-developers/developers/richtext.md) for documentation using this component.

The InspectorPanel, the settings on the right for a block, and Block Controls have a standard way to implement. See the [Block controls tutorial](/docs/designers-developers/developers/tutorials/block-tutorial/block-controls-toolbar-and-sidebar.md) for additional information.


The [Sidebar tutorial](/docs/designers-developers/developers/tutorials/plugin-sidebar-0.md) is a good resource on how to creat a sidebar for your plugin.

Nested blocks, a block that contains additional blocks, is a common pattern used by various blocks such as Columns, Cover, and Social Links. The **InnerBlocks component** enables this functionality, see the [Using InnerBlocks documentation](/docs/designers-developers/developers/tutorials/block-tutorial/nested-blocks-inner-blocks.md)

## How did they do that?

One of the best sources for information and reference is the Block Editor itself, all the core blocks are built the same way and the code is available to browse. A good way is to find a core block doing something close to what you are interested, and read through its code to see how things are done.

All core blocks are in the [block library package](https://github.com/WordPress/gutenberg/tree/master/packages/block-library/src).
