# Developer Documentation

Gutenberg is highly flexible, like most of WordPress. You can build custom blocks, modify the editor's appearance, add special plugins, and much more.

## Creating Blocks

Gutenberg is about blocks, and the main extensibility API of Gutenberg is the Block API. It allows you to create your own static blocks, dynamic blocks rendered on the server and also blocks capable of saving data to Post Meta for more structured content.

If you want to learn more about block creation, the [Blocks Tutorial](../../../docs/designers-developers/developers/tutorials/block-tutorial/intro.md) is the best place to start.

## Extending Blocks

It is also possible to modify the behavior of existing blocks or even remove them completely using filters.

Learn more in the [Block Filters](../../../docs/designers-developers/developers/reference/hooks/block-filters.md) section.

## Extending the Editor UI

Extending the editor UI can be accomplished with the `registerPlugin` API, allowing you to define all your plugin's UI elements in one place.

Refer to the [Plugins](https://github.com/WordPress/gutenberg/blob/master/packages/plugins/README.md) and [Edit Post](https://github.com/WordPress/gutenberg/blob/master/packages/edit-post/README.md) section for more information.

You can also filter certain aspects of the editor; this is documented on the [Editor Filters](../../../docs/designers-developers/developers/reference/hooks/editor-filters.md) page.

## Meta Boxes

**Porting PHP meta boxes to blocks and Gutenberg plugins is highly encouraged!**

Discover how [Meta Box](../../../docs/designers-developers/developers/backwards-compatibility/meta-box.md) support works in Gutenberg.

## Theme Support

By default, blocks provide their styles to enable basic support for blocks in themes without any change. Themes can add/override these styles, or rely on defaults.

There are some advanced block features which require opt-in support in the theme. See [theme support](../../../docs/designers-developers/developers/themes/theme-support.md).

## Autocomplete

Autocompleters within blocks may be extended and overridden. Learn more about the [autocomplete](../../../docs/designers-developers/developers/filters/autocomplete-filters.md) filters.

## Block Parsing and Serialization

Posts in the editor move through a couple of different stages between being stored in `post_content` and appearing in the editor. Since the blocks themselves are data structures that live in memory it takes a parsing and serialization step to transform out from and into the stored format in the database.

Customizing the parser is an advanced topic that you can learn more about in the [Extending the Parser](../../../docs/designers-developers/developers/filters/parser-filters.md) section.
