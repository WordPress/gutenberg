# Block Filters

To modify the behavior of existing blocks, WordPress exposes several APIs:

## Registration

The following filters are available to extend the settings for blocks during their registration.

### `block_type_metadata`

Filters the raw metadata loaded from the `block.json` file when registering a block type on the server with PHP. It allows applying modifications before the metadata gets processed.

The filter takes one param:

-   `$metadata` (`array`) – metadata loaded from `block.json` for registering a block type.

_Example_:

```php
<?php

function filter_metadata_registration( $metadata ) {
	$metadata['apiVersion'] = 1;
	return $metadata;
};
add_filter( 'block_type_metadata', 'filter_metadata_registration' );

register_block_type( __DIR__ );
```

### `block_type_metadata_settings`

Filters the settings determined from the processed block type metadata. It makes it possible to apply custom modifications using the block metadata that isn’t handled by default.

The filter takes two params:

-   `$settings` (`array`) – Array of determined settings for registering a block type.
-   `$metadata` (`array`) – Metadata loaded from the `block.json` file.

_Example:_

```php
function filter_metadata_registration( $settings, $metadata ) {
	$settings['api_version'] = $metadata['apiVersion'] + 1;
	return $settings;
};
add_filter( 'block_type_metadata_settings', 'filter_metadata_registration', 10, 2 );

register_block_type( __DIR__ );
```

### `blocks.registerBlockType`

Used to filter the block settings when registering the block on the client with JavaScript. It receives the block settings and the name of the registered block as arguments. This filter is also applied to each of a block's deprecated settings.

_Example:_

Ensure that List blocks are saved with the canonical generated class name (`wp-block-list`):

```js
function addListBlockClassName( settings, name ) {
	if ( name !== 'core/list' ) {
		return settings;
	}

	return lodash.assign( {}, settings, {
		supports: lodash.assign( {}, settings.supports, {
			className: true,
		} ),
	} );
}

wp.hooks.addFilter(
	'blocks.registerBlockType',
	'my-plugin/class-names/list-block',
	addListBlockClassName
);
```

## Block Editor

The following filters are available to change the behavior of blocks while editing in the block editor.

### `blocks.getSaveElement`

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

_Note:_ A [block validation](/docs/reference-guides/block-api/block-edit-save.md#validation) error will occur if this filter modifies existing content the next time the post is edited. The editor verifies that the content stored in the post matches the content output by the `save()` function.

To avoid this validation error, use `render_block` server-side to modify existing post content instead of this filter. See [render_block documentation](https://developer.wordpress.org/reference/hooks/render_block/).

### `blocks.getBlockDefaultClassName`

Generated HTML classes for blocks follow the `wp-block-{name}` nomenclature. This filter allows to provide an alternative class name.

_Example:_

```js
// Our filter function
function setBlockCustomClassName( className, blockName ) {
	return blockName === 'core/code' ? 'my-plugin-code' : className;
}

// Adding the filter
wp.hooks.addFilter(
	'blocks.getBlockDefaultClassName',
	'my-plugin/set-block-custom-class-name',
	setBlockCustomClassName
);
```

### `blocks.switchToBlockType.transformedBlock`

Used to filter an individual transform result from block transformation. All of the original blocks are passed since transformations are many-to-many, not one-to-one.

### `blocks.getBlockAttributes`

Called immediately after the default parsing of a block's attributes and before validation to allow a plugin to manipulate attribute values in time for validation and/or the initial values rendering of the block in the editor.

### `editor.BlockEdit`

Used to modify the block's `edit` component. It receives the original block `BlockEdit` component and returns a new wrapped component.

_Example:_

{% codetabs %}
{% JSX %}

```js
const { createHigherOrderComponent } = wp.compose;
const { Fragment } = wp.element;
const { InspectorControls } = wp.blockEditor;
const { PanelBody } = wp.components;

const withInspectorControls = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		return (
			<Fragment>
				<BlockEdit { ...props } />
				<InspectorControls>
					<PanelBody>My custom control</PanelBody>
				</InspectorControls>
			</Fragment>
		);
	};
}, 'withInspectorControl' );

wp.hooks.addFilter(
	'editor.BlockEdit',
	'my-plugin/with-inspector-controls',
	withInspectorControls
);
```

{% Plain %}

```js
var el = wp.element.createElement;

var withInspectorControls = wp.compose.createHigherOrderComponent( function (
	BlockEdit
) {
	return function ( props ) {
		return el(
			wp.element.Fragment,
			{},
			el( BlockEdit, props ),
			el(
				wp.blockEditor.InspectorControls,
				{},
				el( wp.components.PanelBody, {}, 'My custom control' )
			)
		);
	};
},
'withInspectorControls' );

wp.hooks.addFilter(
	'editor.BlockEdit',
	'my-plugin/with-inspector-controls',
	withInspectorControls
);
```

{% end %}

#### `editor.BlockListBlock`

Used to modify the block's wrapper component containing the block's `edit` component and all toolbars. It receives the original `BlockListBlock` component and returns a new wrapped component.

_Example:_

{% codetabs %}
{% JSX %}

```js
const { createHigherOrderComponent } = wp.compose;

const withClientIdClassName = createHigherOrderComponent(
	( BlockListBlock ) => {
		return ( props ) => {
			return (
				<BlockListBlock
					{ ...props }
					className={ 'block-' + props.clientId }
				/>
			);
		};
	},
	'withClientIdClassName'
);

wp.hooks.addFilter(
	'editor.BlockListBlock',
	'my-plugin/with-client-id-class-name',
	withClientIdClassName
);
```

{% Plain %}

```js
var el = wp.element.createElement;

var withClientIdClassName = wp.compose.createHigherOrderComponent( function (
	BlockListBlock
) {
	return function ( props ) {
		var newProps = lodash.assign( {}, props, {
			className: 'block-' + props.clientId,
		} );

		return el( BlockListBlock, newProps );
	};
},
'withClientIdClassName' );

wp.hooks.addFilter(
	'editor.BlockListBlock',
	'my-plugin/with-client-id-class-name',
	withClientIdClassName
);
```

{% end %}

Adding new properties to the block's wrapper component can be achieved by adding them to the `wrapperProps` property of the returned component.

_Example:_

{% codetabs %}
{% JSX %}

```js
const { createHigherOrderComponent } = wp.compose;
const withMyWrapperProp = createHigherOrderComponent( ( BlockListBlock ) => {
	return ( props ) => {
		const wrapperProps = {
			...props.wrapperProps,
			'data-my-property': 'the-value',
		};
		return <BlockListBlock { ...props } wrapperProps={ wrapperProps } />;
	};
}, 'withMyWrapperProp' );
wp.hooks.addFilter(
	'editor.BlockListBlock',
	'my-plugin/with-my-wrapper-prop',
	withMyWrapperProp
);
```

{% Plain %}

```js
var el = wp.element.createElement;
var hoc = wp.compose.createHigherOrderComponent;

var withMyWrapperProp = hoc( function ( BlockListBlock ) {
	return function ( props ) {
		var newProps = {
			...props,
			wrapperProps: {
				...props.wrapperProps,
				'data-my-property': 'the-value',
			},
		};
		return el( BlockListBlock, newProps );
	};
}, 'withMyWrapperProp' );
wp.hooks.addFilter(
	'editor.BlockListBlock',
	'my-plugin/with-my-wrapper-prop',
	withMyWrapperProp
);
```

{% end %}

## Removing Blocks

### Using a deny list

Adding blocks is easy enough, removing them is as easy. Plugin or theme authors have the possibility to "unregister" blocks.

{% codetabs %}
{% JSX %}

```js
// my-plugin.js
import { unregisterBlockType } from '@wordpress/blocks';
import domReady from '@wordpress/dom-ready';

domReady( function () {
	unregisterBlockType( 'core/verse' );
} );
```

{% Plain %}

```js
// my-plugin.js
wp.domReady( function () {
	wp.blocks.unregisterBlockType( 'core/verse' );
} );
```

{% end %}

and load this script in the Editor

```php
<?php
// my-plugin.php

function my_plugin_deny_list_blocks() {
	wp_enqueue_script(
		'my-plugin-deny-list-blocks',
		plugins_url( 'my-plugin.js', __FILE__ ),
		array( 'wp-blocks', 'wp-dom-ready', 'wp-edit-post' )
	);
}
add_action( 'enqueue_block_editor_assets', 'my_plugin_deny_list_blocks' );
```

**Important:** When unregistering a block, there can be a [race condition](https://en.wikipedia.org/wiki/Race_condition) on which code runs first: registering the block, or unregistering the block. You want your unregister code to run last. The way to do that is specify the component that is registering the block as a dependency, in this case `wp-edit-post`. Additionally, using `wp.domReady()` ensures the unregister code runs once the dom is loaded.

### Using an allow list

If you want to disable all blocks except an allow list, you can adapt the script above like so:

```js
// my-plugin.js

var allowedBlocks = [
	'core/paragraph',
	'core/image',
	'core/html',
	'core/freeform',
];

wp.blocks.getBlockTypes().forEach( function ( blockType ) {
	if ( allowedBlocks.indexOf( blockType.name ) === -1 ) {
		wp.blocks.unregisterBlockType( blockType.name );
	}
} );
```

## Hiding blocks from the inserter

### `allowed_block_types_all`

_**Note:** Before WordPress 5.8 known as `allowed_block_types`. In the case when you want to support older versions of WordPress you might need a way to detect which filter should be used – the deprecated one vs the new one. The recommended way to proceed is to check if the `WP_Block_Editor_Context` class exists._

On the server, you can filter the list of blocks shown in the inserter using the `allowed_block_types_all` filter. You can return either true (all block types supported), false (no block types supported), or an array of block type names to allow. You can also use the second provided param `$editor_context` to filter block types based on its content.

```php
<?php
// my-plugin.php

function filter_allowed_block_types_when_post_provided( $allowed_block_types, $editor_context ) {
	if ( ! empty( $editor_context->post ) ) {
		return array( 'core/paragraph', 'core/heading' );
	}
	return $allowed_block_types;
}

add_filter( 'allowed_block_types_all', 'filter_allowed_block_types_when_post_provided', 10, 2 );
```

## Managing block categories

### `block_categories_all`

_**Note:** Before WordPress 5.8 known as `block_categories`. In the case when you want to support older versions of WordPress you might need a way to detect which filter should be used – the deprecated one vs the new one. The recommended way to proceed is to check if the `WP_Block_Editor_Context` class exists._

It is possible to filter the list of default block categories using the `block_categories_all` filter. You can do it on the server by implementing a function which returns a list of categories. It is going to be used during blocks registration and to group blocks in the inserter. You can also use the second provided param `$editor_context` to filter the based on its content.

```php
<?php
// my-plugin.php

function filter_block_categories_when_post_provided( $block_categories, $editor_context ) {
	if ( ! empty( $editor_context->post ) ) {
		array_push(
			$block_categories,
			array(
				'slug'  => 'custom-category',
				'title' => __( 'Custom Category', 'custom-plugin' ),
				'icon'  => null,
			)
		);
	}
	return $block_categories;
}

add_filter( 'block_categories_all', 'filter_block_categories_when_post_provided', 10, 2 );
```

### `wp.blocks.updateCategory`

You can also display an icon with your block category by setting an `icon` attribute. The value can be the slug of a [WordPress Dashicon](https://developer.wordpress.org/resource/dashicons/).

You can also set a custom icon in SVG format. To do so, the icon should be rendered and set on the frontend, so it can make use of WordPress SVG, allowing mobile compatibility and making the icon more accessible.

To set an SVG icon for the category shown in the previous example, add the following example JavaScript code to the editor calling `wp.blocks.updateCategory` e.g:

```js
( function () {
	var el = wp.element.createElement;
	var SVG = wp.primitives.SVG;
	var circle = el( 'circle', {
		cx: 10,
		cy: 10,
		r: 10,
		fill: 'red',
		stroke: 'blue',
		strokeWidth: '10',
	} );
	var svgIcon = el(
		SVG,
		{ width: 20, height: 20, viewBox: '0 0 20 20' },
		circle
	);
	wp.blocks.updateCategory( 'my-category', { icon: svgIcon } );
} )();
```
