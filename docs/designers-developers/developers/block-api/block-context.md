# Block Context

Block context is a feature which enables ancestor blocks to provide values which can be consumed by descendent blocks within its own hierarchy. Those descendent blocks can inherit these values without resorting to hard-coded values and without an explicit awareness of the block which provides those values.

This is especially useful in full-site editing where, for example, the contents of a block may depend on the context of the post in which it is displayed. A blogroll template may show excerpts of many different posts. Using block context, there can still be one single "Post Excerpt" block which displays the contents of the post based on an inherited post ID.

If you are familiar with [React Context](https://reactjs.org/docs/context.html), block context adopts many of the same ideas. In fact, the client-side block editor implementation of block context is a very simple application of React Context. Block context is also supported in server-side `render_callback` implementations, demonstrated in the examples below.

## Defining Block Context

Block context is defined in the registered settings of a block. A block can provide a context value, or consume a value it seeks to inherit.

### Providing Block Context

A block can provide a context value by assigning a `providesContext` property in its registered settings. This is an array of the attribute names which will be made available to descendent blocks via context. Currently, block context only supports values derived from the block's own attributes. This could be enhanced in the future to support additional sources of context values.

Note that when context is assigned, names of context keys provided by a block are automatically namespaced using the same namespace defined in the block's name. For the core set of blocks defined by WordPress, the namespace is omitted.

`post/block.json`

```json
{
	"name": "core/post",
	"attributes": {
		"postId": {
			"type": "number"
		}
	},
	"providesContext": [ "postId" ]
}
```

`record/block.json`

```json
{
	"name": "my-plugin/record",
	"attributes": {
		"recordId": {
			"type": "number"
		}
	},
	"providesContext": [ "recordId" ]
}
```

### Consuming Block Context

A block can inherit a context value from an ancestor provider by assigning a `context` property in its registered settings. This should be assigned as an array of the context names the block seeks to inherit.

Note that when context is assigned, names of context keys provided by a block are automatically namespaced using the same namespace defined in the block's name. For the core set of blocks defined by WordPress, the namespace is omitted.

`post-title/block.json`

```json
{
	"name": "core/post-excerpt",
	"context": [ "postId" ]
}
```

`record-title/block.json`

```json
{
	"name": "my-plugin/record-title",
	"attributes": {
		"recordId": {
			"type": "number"
		}
	},
	"context": [ "my-plugin/recordId" ]
}
```

## Using Block Context

Once a block has defined the context it seeks to inherit, this can be accessed in the implementation of `edit` (JavaScript) and `render_callback` (PHP). It is provided as an object (JavaScript) or associative array (PHP) of the context values which have been defined for the block. Note that even if there is an ancestor which provides a context value, the value will only be made available if the block explicitly defines a desire to inherit that value.

### JavaScript

_post-excerpt/edit.js_

```js
function edit( { context } ) {
	return 'The current post ID is: ' + context.postId;
}
```

### PHP

Note that in PHP, block context is accessed using the `$block` global which is assigned at the time a block is registered. This is unlike block attributes or block content, which are provided as arguments to the `render_callback` function. At some point in the future, block context may be integrated into the function arguments signature of `render_callback`, or an alternative block settings configuration may enable a render callback to receive the full block array as its argument.

_post-excerpt/index.php_

```js
function render_block_core_post_excerpt() {
	global $block;

	return 'The current post ID is: ' . $block['context']['postId'];
}
```
