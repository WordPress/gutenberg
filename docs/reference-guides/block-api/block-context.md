# Context

Block context is a feature which enables ancestor blocks to provide values which can be consumed by descendent blocks within its own hierarchy. Those descendent blocks can inherit these values without resorting to hard-coded values and without an explicit awareness of the block which provides those values.

This is especially useful in full-site editing where, for example, the contents of a block may depend on the context of the post in which it is displayed. A blogroll template may show excerpts of many different posts. Using block context, there can still be one single "Post Excerpt" block which displays the contents of the post based on an inherited post ID.

If you are familiar with [React Context](https://react.dev/learn/passing-data-deeply-with-context), block context adopts many of the same ideas. In fact, the client-side block editor implementation of block context is a very simple application of React Context. Block context is also supported in server-side `render_callback` implementations, demonstrated in the examples below.

## Defining block context

Block context is defined in the registered settings of a block. A block can provide a context value, or consume a value it seeks to inherit.

### Providing block context

A block can provide a context value by assigning a `providesContext` property in its registered settings. This is an object which maps a context name to one of the block's own attributes. The value corresponding to that attribute value is made available to descendent blocks and can be referenced by the same context name. Currently, block context only supports values derived from the block's own attributes. This could be enhanced in the future to support additional sources of context values.

```js
	attributes: {
		recordId: {
			type: 'number',
		},
	},

	providesContext: {
		'my-plugin/recordId': 'recordId',
	},
```

For a complete example, refer to the section below.

#### Include a namespace

As seen in the above example, it is recommended that you include a namespace as part of the name of the context key so as to avoid potential conflicts with other plugins or default context values provided by WordPress. The context namespace should be specific to your plugin, and in most cases can be the same as used in the name of the block itself.

### Consuming block context

A block can inherit a context value from an ancestor provider by assigning a `usesContext` property in its registered settings. This should be assigned as an array of the context names the block seeks to inherit.

```js
registerBlockType('my-plugin/record-title', {
	title: 'Record Title',
	category: 'widgets',

	usesContext: ['my-plugin/recordId'],

```

## Using block context

Once a block has defined the context it seeks to inherit, this can be accessed in the implementation of `edit` (JavaScript) and `render_callback` (PHP). It is provided as an object (JavaScript) or associative array (PHP) of the context values which have been defined for the block. Note that a context value will only be made available if the block explicitly defines a desire to inherit that value.

Note: Block Context is not available to `save`.

### JavaScript

```js
registerBlockType('my-plugin/record-title', {

	edit({ context }) {
		return 'The record ID: ' + context['my-plugin/recordId'];
	},

```

### PHP

A block's context values are available from the `context` property of the `$block` argument passed as the third argument to the `render_callback` function.

```php
register_block_type( 'my-plugin/record-title', array(
	'render_callback' => function( $attributes, $content, $block ) {
		return 'The current record ID is: ' . $block->context['my-plugin/recordId'];
	},
) );
```

## Example

1. Create a `record` block.

```
npm init @wordpress/block --namespace my-plugin record
cd record
```

2. Edit `src/index.js`. Insert the `recordId` attribute and `providesContext` property in the `registerBlockType` function and add the registration of the `record-title` block at the bottom:

```js
registerBlockType( 'my-plugin/record', {
	// ... cut ...

	attributes: {
		recordId: {
			type: 'number',
		},
	},

	providesContext: {
		'my-plugin/recordId': 'recordId',
	},

	/**
	 * @see ./edit.js
	 */
	edit: Edit,

	/**
	 * @see ./save.js
	 */
	save,
} );

registerBlockType( 'my-plugin/record-title', {
	title: 'Record Title',
	category: 'widgets',

	usesContext: [ 'my-plugin/recordId' ],

	edit( { context } ) {
		return 'The record ID: ' + context[ 'my-plugin/recordId' ];
	},

	save() {
		return null;
	},
} );
```

3. Edit `src/edit.js` for the `record` block. Replace the `Edit` function with the following code:

```js
import { TextControl } from '@wordpress/components';
import { InnerBlocks } from '@wordpress/block-editor';

export default function Edit( props ) {
	const MY_TEMPLATE = [ [ 'my-plugin/record-title', {} ] ];
	const {
		attributes: { recordId },
		setAttributes,
	} = props;
	return (
		<div>
			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Record ID' ) }
				value={ recordId }
				onChange={ ( val ) =>
					setAttributes( { recordId: Number( val ) } )
				}
			/>
			<InnerBlocks template={ MY_TEMPLATE } templateLock="all" />
		</div>
	);
}
```

4. Edit `src/save.js` for the `record` block. Replace the `save` function with the following code:

```js
export default function save( props ) {
	return <p>The record ID: { props.attributes.recordId }</p>;
}
```

5. Create a new post and add the `record` block. If you type a number in the text box, you'll see the same number is shown in the `record-title` block below it.

![Block Context Example](https://user-images.githubusercontent.com/8876600/93000215-c8570380-f561-11ea-9bd0-0b2bd0ca1752.png)
