# Extensibility

Extensibility is key for WordPress and like the rest of WordPress components, Gutenberg is highly extensible.


## Creating Blocks

Gutenberg is about blocks and the main extensibility API of Gutenberg is the Block API. It allows you to create your own static blocks, dynamic blocks rendered on the server and also blocks capable of saving data to Post Meta for more structured content.

Here is a small example of a static custom block type (you can try it in your browser's console):

```js
var el = wp.element.createElement;

wp.blocks.registerBlockType( 'mytheme/red-block', {
	title: 'Red Block',
	icon: 'universal-access-alt',
	category: 'layout',
	edit: function() {
		return el( 'div', { style: { backgroundColor: '#900', color: '#fff', padding: '20px' } }, 'I am a red block.' );
	},
	save: function() {
		return el( 'div', { style: { backgroundColor: '#900', color: '#fff', padding: '20px' } }, 'I am a red block.' );
	}
} );
```

If you want to learn more about block creation, The [Blocks Tutorial](./blocks) is the best place to start.

## Extending Blocks

It is also possible to modify the behaviour of the existing blocks or even remove them completely using filters.

Learn more in the [Extending Blocks](./extensibility/extending-blocks) documentation.

## Extending the Editor UI

Extending the editor UI can be accomplished with the `registerPlugin` API, allowing you to define all your plugin's UI elements in one place.

Refer to the [Plugins API](./extensibility/plugins-api) documentation for more information.

## Meta Boxes

**It is highly encouraged converting PHP meta boxes to blocks!**

Discover how [Meta Box](./extensibility/meta-box) support works in Gutenberg.

## Theme Support

By default, blocks provide their styles to enable basic support for blocks in themes without any change. Themes can add/override these styles, or rely on defaults.

There are some advanced block features which require opt-in support in the theme. You can find out more [here](./extensibility/theme-support)
