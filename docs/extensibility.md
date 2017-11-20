# Extensibility

Extensibility is key for WordPress and like the rest of WordPress components, Gutenberg is hightly extensible.


## Creating Blocks

Gutenberg is about blocks and the main extensibility API of Gutenberg is the Block API. It allows you to create static blocks, dynamic blocks rendering on the server and also blocks saving data to Post Meta for more structured content.

If you want to learn more about block creations, The [Blocks Tutorial](./blocks) is the best place to sart.


## Removing Blocks

### Using a black list

Adding blocks is easy enough, removing them is as easy. Plugin or theme authors have the possibility to "unregister" blocks.

```js
// myplugin.js

wp.blocks.unregisterBlockType( 'core/verse' );
```

and load this script in the Editor

```php
<?php
// myplugin.php

function myplugin_blacklist_blocks() {
	wp_enqueue_script(
		'myplugin-blacklist-blocks',
		plugins_url( 'myplugin.js', __FILE__ ),
		array( 'wp-blocks' )
	);
}
add_action( 'enqueue_block_editor_assets', 'myplugin_blacklist_blocks' );
```


### Using a white list

If you want to disable all blocks except a whitelisted list, you can adapt the script above like so:

```js
// myplugin.js
var allowedBlocks = [
  'core/paragraph',
  'core/image',
  'core/html',
  'core/freeform'
];

wp.blocks.getBlockTypes().forEach( function( blockType ) {
  if ( allowedBlocks.indexOf( blockType.name ) === -1 ) {
    wp.blocks.unregisterBlockType( blockType.name );
  }
} );
```


## Modifying Blocks

To modify the behaviour of existing blocks, Gutenberg exposes a list of filters:

- `registerBlockType`: Used to filter the block settings. It receives the block settings and the name of the block the registered block as arguments.

- `getSaveContent.extraProps`: A filter that applies to all blocks returning a WP Element in the `save` function. This filter is used to add extra props to the root element of the `save` function. For example: to add a className, an id, or any valid prop for this element. It receives the current props of the `save` element, the block Type and the block attributes as arguments.

- `BlockEdit`: Used to filter the block's `edit` function receiving the WP element returned from the original block `edit` element.

**Example**

Adding a background by default to all blocks.

```js
// Our filter function
function addBackgroundProp( props ) {
	return Object.assign( props, { backgroundColor: 'red' } );
}

// Adding the filter
window._wpGutenbergEditor.hooks.addFilter(
	'getSaveContent.extraProps',
	'myplugin\add-background',
	addBackgroundProp
);
```


## Extending the editor's UI (Slot and Fill)

Coming soon.