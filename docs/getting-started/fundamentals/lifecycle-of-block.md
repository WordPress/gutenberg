# Lifecycle of a block

A block is not a single thing. It starts as a block type definition, becomes a JavaScript object while a post is open in the Editor, is stored as HTML with [block delimiters](https://developer.wordpress.org/block-editor/getting-started/fundamentals/markup-representation-block/) in the database, and finally becomes the HTML sent to the browser.

This article follows a block through those phases and shows which format it takes in each one. Knowing where a phase runs—the browser or the server—tells you where a given piece of code belongs.

![Lifecycle of a block: a registered block type becomes a block object in the Editor, is serialized as HTML with block delimiters in post_content, and is rendered as HTML on the front end](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/block-lifecycle.svg)

## Registration

Registration tells WordPress that a block type exists. It runs on every request, on both the server and the client, and it says nothing about any specific block in any specific post. [Registration of a block](https://developer.wordpress.org/block-editor/getting-started/fundamentals/registration-of-a-block/) covers this phase in depth, but two details shape everything that follows:

-   Registering on the server is what makes the block metadata available to PHP and to the REST API. A block registered only in JavaScript is unknown to the server, so it cannot render dynamically.
-   The assets declared in `block.json` are _registered_ here, not enqueued, and each property has its own behavior: `editorScript` and `editorStyle` load in the Editor, `script` and `style` load in both the Editor and the front end, and `viewScript`, `viewScriptModule`, and `viewStyle` load only on the front end when the page contains the block. The [block metadata reference](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/) documents each one.

The [`block.json`](https://developer.wordpress.org/block-editor/getting-started/fundamentals/block-json/) file is the canonical description of a block type. The examples in this article all follow the same one:

```json
{
	"$schema": "https://schemas.wp.org/trunk/block.json",
	"apiVersion": 3,
	"name": "my-plugin/message",
	"title": "Message",
	"category": "text",
	"attributes": {
		"content": {
			"type": "string",
			"source": "html",
			"selector": "p"
		}
	},
	"editorScript": "file:./index.js",
	"style": "file:./style-index.css"
}
```

The `content` attribute is declared with a `source` and a `selector`, which means its value lives in the block's markup rather than in the block delimiter. Keep that in mind, as it shows up again in the phases below.

## Parsing

When a post is opened in the Editor, its `post_content` is a string of HTML. The [`parse()`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-blocks/#parse) function from `@wordpress/blocks` turns that string into a tree of block objects:

```js
{
	clientId: '6a8b1c4e-...',
	name: 'my-plugin/message',
	attributes: { content: 'Hello from a block' },
	innerBlocks: [],
	isValid: true,
}
```

Attributes come from two places. Those stored as JSON in the opening delimiter are read directly, and those declared with a `source` (like `content` above) are extracted from the saved markup using the `selector`.

Parsing is also when [block validation](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#validation) happens: the parsed attributes are passed back through the `save` function, and the result is compared with the markup found in the database. When the two do not match, the Editor tries the block's [deprecations](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/) and, if none apply, marks the block as invalid. This is why changing the output of `save` in an existing block requires a deprecation.

## Editing

Once parsed, blocks live in the `core/block-editor` data store, and `edit` renders each one as a React component. The component receives the block's current attributes and a `setAttributes` function to update them:

```js
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function Edit( { attributes, setAttributes } ) {
	const { content } = attributes;

	return (
		<RichText
			{ ...useBlockProps() }
			tagName="p"
			value={ content }
			onChange={ ( newContent ) =>
				setAttributes( { content: newContent } )
			}
		/>
	);
}
```

Everything in this phase is in-memory and browser-only. Calling `setAttributes` updates the block object in the store and re-renders the component, but nothing reaches the database until the post is saved. `edit` also has no counterpart on the front end, so markup, event handlers, and controls defined here never ship to visitors.

## Saving and serialization

Saving the post reverses parsing. Each block object is passed to its `save` function, and the returned markup is wrapped in block delimiters by [`serialize()`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-blocks/#serialize):

```js
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	return (
		<RichText.Content
			{ ...useBlockProps.save() }
			tagName="p"
			value={ attributes.content }
		/>
	);
}
```

The resulting string is what gets stored in `post_content`:

```html
<!-- wp:my-plugin/message -->
<p class="wp-block-my-plugin-message">Hello from a block</p>
<!-- /wp:my-plugin/message -->
```

Notice that `content` does not appear in the delimiter. Attributes declared with a `source` are read back out of the markup when the post is parsed again, so only the remaining attributes are serialized as JSON.

Blocks that rely on [dynamic rendering](https://developer.wordpress.org/block-editor/getting-started/fundamentals/static-dynamic-rendering/) usually return `null` from `save`, and that changes how their attributes are declared. With no saved markup, there is nothing for a `source` to read from, so a dynamic version of this block declares `content` without one:

```json
"attributes": {
	"content": {
		"type": "string"
	}
}
```

The value is then stored in the delimiter instead of in markup, and the whole block is serialized as a single self-closing comment:

```html
<!-- wp:my-plugin/message {"content":"Hello from a block"} /-->
```

## Rendering on the front end

On the front end the Editor is gone, and the stored HTML is processed in PHP. [`do_blocks()`](https://developer.wordpress.org/reference/functions/do_blocks/), which runs on the `the_content` filter, parses `post_content` and calls [`render_block()`](https://developer.wordpress.org/reference/functions/render_block/) for every block:

-   **Static blocks** have their saved markup returned as is.
-   **Dynamic blocks** discard the saved markup and generate fresh output from the `render` file declared in `block.json`, or from a `render_callback` passed to `register_block_type()`.

A `render.php` file receives the block's attributes, its saved inner markup, and the `WP_Block` instance:

```php
<?php
/**
 * @var array    $attributes Block attributes.
 * @var string   $content    Block default content.
 * @var WP_Block $block      Block instance.
 */
?>
<p <?php echo get_block_wrapper_attributes(); ?>>
	<?php echo esc_html( $attributes['content'] ); ?>
</p>
```

Whichever path a block takes, the output passes through the `render_block` and `render_block_{$block_name}` filters before it reaches the page, so other code can still alter it.

## The formats of a block

| Format                          | Where it exists                           | Produced by                                       |
| ------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| Block type definition           | JavaScript and PHP registries             | `registerBlockType()` and `register_block_type()` |
| Block object                    | Editor memory (`core/block-editor` store) | `parse()`, or inserting a block                   |
| Serialized HTML with delimiters | `post_content` in the database            | `serialize()` and `save`                          |
| Rendered HTML                   | The front-end response                    | `do_blocks()` and `render_block()`                |

The same block moves between all four, and each transition is a place where behavior can be added: registration for metadata and assets, the Editor for the authoring experience, `save` for what is stored, and the render callback for what visitors see.

## Additional resources

-   [Data flow and data format](https://developer.wordpress.org/block-editor/explanations/architecture/data-flow/)
-   [Markup representation of a block](https://developer.wordpress.org/block-editor/getting-started/fundamentals/markup-representation-block/)
-   [Static or dynamic rendering of a block](https://developer.wordpress.org/block-editor/getting-started/fundamentals/static-dynamic-rendering/)
-   [`edit` and `save`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/)
-   [Block deprecation](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/)
