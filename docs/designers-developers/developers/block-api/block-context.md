# Block Context

Block context is a feature which enables ancestor blocks to provide values which can be consumed by descendent blocks within its own hierarchy. Those descendent blocks can inherit these values without resorting to hard-coded values and without an explicit awareness of the block which provides those values.

This is especially useful in full-site editing where, for example, the contents of a block may depend on the context of the post in which it is displayed. A blogroll template may show excerpts of many different posts. Using block context, there can still be one single "Post Excerpt" block which displays the contents of the post based on an inherited post ID.

If you are familiar with [React Context](https://reactjs.org/docs/context.html), block context adopts many of the same ideas. In fact, the client-side block editor implementation of block context is a very simple application of React Context. Block context is also supported in server-side `render_callback` implementations, demonstrated in the examples below.

## Defining Block Context

Block context is defined in the registered settings of a block. A block can provide a context value, or consume a value it seeks to inherit.

### Providing Block Context

A block can provide a context value by assigning a `providesContext` property in its registered settings. This is an object which maps a context name to one of the block's own attribute. The value corresponding to that attribute value is made available to descendent blocks and can be referenced by the same context name. Currently, block context only supports values derived from the block's own attributes. This could be enhanced in the future to support additional sources of context values.

`record/block.json`

```json
{
	"name": "my-plugin/record",
	"attributes": {
		"recordId": {
			"type": "number"
		}
	},
	"providesContext": {
		"my-plugin/recordId": "recordId"
	}
}
```

As seen in the above example, it is recommended that you include a namespace as part of the name of the context key so as to avoid potential conflicts with other plugins or default context values provided by WordPress. The context namespace should be specific to your plugin, and in most cases can be the same as used in the name of the block itself.

### Consuming Block Context

A block can inherit a context value from an ancestor provider by assigning a `usesContext` property in its registered settings. This should be assigned as an array of the context names the block seeks to inherit.

`record-title/block.json`

```json
{
	"name": "my-plugin/record-title",
	"usesContext": [ "my-plugin/recordId" ]
}
```

## Using Block Context

Once a block has defined the context it seeks to inherit, this can be accessed in the implementation of `edit` (JavaScript) and `render_callback` (PHP). It is provided as an object (JavaScript) or associative array (PHP) of the context values which have been defined for the block. Note that a context value will only be made available if the block explicitly defines a desire to inherit that value.

### JavaScript

`record-title/index.js`

```js
registerBlockType( 'my-plugin/record-title', {
	edit( { context } ) {
		return 'The current record ID is: ' + context[ 'my-plugin/recordId' ];
	},
} );
```

### PHP

A block's context values are available from the `context` property of the `$block` argument passed as the third argument to the `render_callback` function.

`record-title/index.php`

```php
register_block_type( 'my-plugin/record-title', array(
	'render_callback' => function( $attributes, $content, $block ) {
		return 'The current record ID is: ' . $block->context['my-plugin/recordId'];
	},
) );
```
