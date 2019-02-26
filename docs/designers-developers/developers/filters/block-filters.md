# Block Filters

To modify the behavior of existing blocks, WordPress exposes several APIs:

### Block Style Variations

Block Style Variations allow providing alternative styles to existing blocks. They work by adding a className to the block's wrapper. This className can be used to provide an alternative styling for the block if the style variation is selected. See the [Getting Started with JavaScript tutorial](/docs/designers-developers/developers/tutorials/javascript/) for a full example.

_Example:_

```js
wp.blocks.registerBlockStyle( 'core/quote', {
	name: 'fancy-quote',
	label: 'Fancy Quote'
} );
```

The example above registers a block style variation named `fancy-quote` to the `core/quote` block. When the user selects this block style variation from the styles selector, an `is-style-fancy-quote` className will be added to the block's wrapper.

By adding `isDefault: true` you can mark the registered style variation as the one that is recognized as active when no custom class name is provided. It also means that there will be no custom class name added to the HTML output for the style that is marked as default.

To remove a block style variation use `wp.blocks.unregisterBlockStyle()`.

_Example:_

```js
wp.blocks.unregisterBlockStyle( 'core/quote', 'large' );
```

The above removes the variation named `large` from the `core/quote` block.

**Important:** When unregistering a block style, there can be a [race condition](https://en.wikipedia.org/wiki/Race_condition) on which code runs first: registering the style, or unregistering the style. You want your unregister code to run last. The way to do that is specify the component that is registering the style as a dependency, in this case `wp-edit-post`. Additionally, using `wp.domReady()` ensures the unregister code runs once the dom is loaded.

Enqueue your JavaScript with the following PHP code:

```php
function myguten_enqueue() {
	wp_enqueue_script(
		'myguten-script',
		plugins_url( 'myguten.js', __FILE__ ),
		array( 'wp-blocks', 'wp-dom-ready', 'wp-edit-post' ),
		filemtime( plugin_dir_path( __FILE__ ) . '/myguten.js' )
	);
}
add_action( 'enqueue_block_editor_assets', 'myguten_enqueue' );
```

The JavaScript code in `myguten.js`:

```js
wp.domReady( function() {
	wp.blocks.unregisterBlockStyle( 'core/quote', 'large' );
} );
```

### Filters

Extending blocks can involve more than just providing alternative styles, in this case, you can use one of the following filters to extend the block settings.

#### `blocks.registerBlockType`

Used to filter the block settings. It receives the block settings and the name of the block the registered block as arguments.

_Example:_

Ensure that List blocks are saved with the canonical generated class name (`wp-block-list`):

```js
function addListBlockClassName( settings, name ) {
	if ( name !== 'core/list' ) {
		return settings;
	}

	return lodash.assign( {}, settings, {
		supports: lodash.assign( {}, settings.supports, {
			className: true
		} ),
	} );
}

wp.hooks.addFilter(
	'blocks.registerBlockType',
	'my-plugin/class-names/list-block',
	addListBlockClassName
);
```

#### `blocks.getSaveElement`

A filter that applies to the result of a block's `save` function. This filter is used to replace or extend the element, for example using `wp.element.cloneElement` to modify the element's props or replace its children, or returning an entirely new element.

The filter's callback receives an element, a block type and the block attributes as arguments. It should return an element.

#### `blocks.getSaveContent.extraProps`

A filter that applies to all blocks returning a WP Element in the `save` function. This filter is used to add extra props to the root element of the `save` function. For example: to add a className, an id, or any valid prop for this element.

The filter receives the current `save` element's props, a block type and the block attributes as arguments. It should return a props object.

_Example:_

Adding a background by default to all blocks.

```js
function addBackgroundColorStyle( props ) {
	return lodash.assign( props, { style: { backgroundColor: 'red' } } );
}

wp.hooks.addFilter(
	'blocks.getSaveContent.extraProps',
	'my-plugin/add-background-color-style',
	addBackgroundColorStyle
);
```

_Note:_ This filter must always be run on every page load, and not in your browser's developer tools console. Otherwise, a [block validation](/docs/designers-developers/developers/block-api/block-edit-save.md#validation) error will occur the next time the post is edited. This is due to the fact that block validation occurs by verifying that the saved output matches what is stored in the post's content during editor initialization. So, if this filter does not exist when the editor loads, the block will be marked as invalid.

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

#### `blocks.switchToBlockType.transformedBlock`

Used to filter an individual transform result from block transformation. All of the original blocks are passed since transformations are many-to-many, not one-to-one.

#### `blocks.getBlockAttributes`

Called immediately after the default parsing of a block's attributes and before validation to allow a plugin to manipulate attribute values in time for validation and/or the initial values rendering of the block in the editor.

#### `editor.BlockEdit`

Used to modify the block's `edit` component. It receives the original block `BlockEdit` component and returns a new wrapped component.

_Example:_

{% codetabs %}
{% ES5 %}
```js
var el = wp.element.createElement;

var withInspectorControls = wp.compose.createHigherOrderComponent( function( BlockEdit ) {
	return function( props ) {
		return el(
			wp.element.Fragment,
			{},
			el(
				BlockEdit,
				props
			),
			el(
				wp.editor.InspectorControls,
				{},
				el(
					wp.components.PanelBody,
					{},
					'My custom control'
				)
			)
		);
	};
}, 'withInspectorControls' );

wp.hooks.addFilter( 'editor.BlockEdit', 'my-plugin/with-inspector-controls', withInspectorControls );
```
{% ESNext %}
```js
const { createHigherOrderComponent } = wp.compose;
const { Fragment } = wp.element;
const { InspectorControls } = wp.editor;
const { PanelBody } = wp.components;

const withInspectorControls =  createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		return (
			<Fragment>
				<BlockEdit { ...props } />
				<InspectorControls>
					<PanelBody>
						My custom control
					</PanelBody>
				</InspectorControls>
			</Fragment>
		);
	};
}, "withInspectorControl" );

wp.hooks.addFilter( 'editor.BlockEdit', 'my-plugin/with-inspector-controls', withInspectorControls );
```
{% end %}

#### `editor.BlockListBlock`

Used to modify the block's wrapper component containing the block's `edit` component and all toolbars. It receives the original `BlockListBlock` component and returns a new wrapped component.

_Example:_

{% codetabs %}
{% ES5 %}

```js
var el = wp.element.createElement;

var withClientIdClassName = wp.compose.createHigherOrderComponent( function( BlockListBlock ) {
	return function( props ) {
		var newProps = lodash.assign(
			{},
			props,
			{
				className: "block-" + props.clientId,
			}
		);

		return el(
			BlockListBlock,
			newProps
		);
	};
}, 'withClientIdClassName' );

wp.hooks.addFilter( 'editor.BlockListBlock', 'my-plugin/with-client-id-class-name', withClientIdClassName );

```
{% ESNext %}
```js
const { createHigherOrderComponent } = wp.compose;

const withClientIdClassName = createHigherOrderComponent( ( BlockListBlock ) => {
	return ( props ) => {
		return <BlockListBlock { ...props } className={ "block-" + props.clientId } />;
	};
}, 'withClientIdClassName' );

wp.hooks.addFilter( 'editor.BlockListBlock', 'my-plugin/with-client-id-class-name', withClientIdClassName );
```

{% end %}

## Removing Blocks

### Using a blacklist

Adding blocks is easy enough, removing them is as easy. Plugin or theme authors have the possibility to "unregister" blocks.

```js
// my-plugin.js
wp.domReady( function() {
	wp.blocks.unregisterBlockType( 'core/verse' );
} );
```

and load this script in the Editor

```php
<?php
// my-plugin.php

function my_plugin_blacklist_blocks() {
	wp_enqueue_script(
		'my-plugin-blacklist-blocks',
		plugins_url( 'my-plugin.js', __FILE__ ),
		array( 'wp-blocks', 'wp-dom-ready', 'wp-edit-post' )
	);
}
add_action( 'enqueue_block_editor_assets', 'my_plugin_blacklist_blocks' );
```

### Using a whitelist

If you want to disable all blocks except a whitelisted list, you can adapt the script above like so:

```js
// my-plugin.js

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

On the server, you can filter the list of blocks shown in the inserter using the `allowed_block_types` filter. You can return either true (all block types supported), false (no block types supported), or an array of block type names to allow. You can also use the second provided param `$post` to filter block types based on its content.

```php
<?php
// my-plugin.php

function my_plugin_allowed_block_types( $allowed_block_types, $post ) {
	if ( $post->post_type !== 'post' ) {
		return $allowed_block_types;
	}
	return array( 'core/paragraph' );
}

add_filter( 'allowed_block_types', 'my_plugin_allowed_block_types', 10, 2 );
```

## Managing block categories

It is possible to filter the list of default block categories using the `block_categories` filter. You can do it on the server by implementing a function which returns a list of categories. It is going to be used during blocks registration and to group blocks in the inserter. You can also use the second provided param `$post` to generate a different list depending on the post's content.

```php
<?php
// my-plugin.php

function my_plugin_block_categories( $categories, $post ) {
	if ( $post->post_type !== 'post' ) {
		return $categories;
	}
	return array_merge(
		$categories,
		array(
			array(
				'slug' => 'my-category',
				'title' => __( 'My category', 'my-plugin' ),
				'icon'  => 'wordpress',
			),
		)
	);
}
add_filter( 'block_categories', 'my_plugin_block_categories', 10, 2 );
```

You can also display an icon with your block category by setting an `icon` attribute. The value can be the slug of a [WordPress Dashicon](https://developer.wordpress.org/resource/dashicons/).

It is possible to set an SVG as the icon of the category if a custom icon is needed. To do so, the icon should be rendered and set on the frontend, so it can make use of WordPress SVG, allowing mobile compatibility and making the icon more accessible.

To set an SVG icon for the category shown in the previous example, add the following example JavaScript code to the editor calling `wp.blocks.updateCategory` e.g:
```js
( function() {
	var el = wp.element.createElement;
	var SVG = wp.components.SVG;
	var circle = el( 'circle', { cx: 10, cy: 10, r: 10, fill: 'red', stroke: 'blue', strokeWidth: '10' } );
	var svgIcon = el( SVG, { width: 20, height: 20, viewBox: '0 0 20 20'}, circle);
	wp.blocks.updateCategory( 'my-category', { icon: svgIcon } );
} )();
```

