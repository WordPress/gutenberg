# Extending Blocks (Experimental)

## Modifying Blocks

To modify the behaviour of existing blocks, Gutenberg exposes the following filters:

#### `blocks.registerBlockType`

Used to filter the block settings. It receives the block settings and the name of the block the registered block as arguments.

#### `blocks.BlockEdit`

Used to modify the block's `edit` component. It receives the original block `edit` component and returns a new wrapped component.

#### `blocks.getSaveElement`

A filter that applies to the result of a block's `save` function. This filter is used to replace or extend the element, for example using `wp.element.cloneElement` to modify the element's props or replace its children, or returning an entirely new element.

#### `blocks.getSaveContent.extraProps`
 
A filter that applies to all blocks returning a WP Element in the `save` function. This filter is used to add extra props to the root element of the `save` function. For example: to add a className, an id, or any valid prop for this element. It receives the current props of the `save` element, the block type and the block attributes as arguments.

_Example:_

Adding a background by default to all blocks.

```js
function addBackgroundColorStyle( props ) {
	return Object.assign( props, { style: { backgroundColor: 'red' } } );
}

wp.hooks.addFilter(
	'blocks.getSaveContent.extraProps',
	'my-plugin/add-background-color-style',
	addBackgroundColorStyle
);
```

_Note:_ This filter must always be run on every page load, and not in your browser's developer tools console. Otherwise, a [block validation](https://wordpress.org/gutenberg/handbook/block-api/block-edit-save/#validation) error will occur the next time the post is edited. This is due to the fact that block validation occurs by verifying that the saved output matches what is stored in the post's content during editor initialization. So, if this filter does not exist when the editor loads, the block will be marked as invalid.

#### `blocks.getBlockDefaultClassName`

Generated HTML classes for blocks follow the `wp-block-{name}` nomenclature. This filter allows to provide an alternative class name.

_Example:_

```js
// Our filter function
function setBlockCustomClassName( className, blockName ) {
	return blockName === 'core/code' ?
		'my-plugin-code' :
		className;
}

// Adding the filter
wp.hooks.addFilter(
	'blocks.getBlockDefaultClassName',
	'my-plugin/set-block-custom-class-name',
	setBlockCustomClassName
);
```

#### `blocks.isUnmodifiedDefaultBlock.attributes`

TBD

#### `blocks.switchToBlockType.transformedBlock`

TBD

## Removing Blocks

### Using a blacklist

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

### Using a whitelist

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

## Hiding blocks from the inserter

On the server, you can filter the list of blocks shown in the inserter using the `allowed_block_types` filter. you can return either true (all block types supported), false (no block types supported), or an array of block type names to allow.

```php
add_filter( 'allowed_block_types', function() {
	return [ 'core/paragraph' ];
} );
```
