# Bindings

<div class="callout callout-alert">
Block Bindings API is only available for WordPress 6.5 and above.
</div>

The Block Bindings API lets you “bind” dynamic data to the block’s attributes, which are then reflected in the final HTML markup that is output to the browser on the front end.

An example could be connecting an Image block `url` attribute to a function that returns random images from an external API.

```html
<!-- wp:image {
	"metadata":{
		"bindings":{
			"url":{
				"source":"my-plugin/get-random-images"
			}
		}
	}
} -->
```

## Compatible blocks and their attributes

Right now, not all block attributes are compatible with block bindings. There is some ongoing effort to increase this compatibility, but for now, this is the default list:

| Supported Blocks         | Supported Attributes              |
| ------------------------ | --------------------------------- |
| core/image               | id, url, title, alt, caption      |
| core/heading             | content                           |
| core/paragraph           | content                           |
| core/button              | url, text, linkTarget, rel        |
| core/navigation-link     | url                               |
| core/navigation-submenu  | url                               |
| core/post-date           | datetime                          |

## Core Sources

WordPress includes several built-in block bindings sources that you can use without any custom registration.

- [core/post-meta](#corepost-meta)
- [core/post-data](#corepost-data)
- [core/term-data](#coreterm-data)
- [core/pattern-overrides](#corepattern-overrides)

### core/post-meta

The `core/post-meta` source allows you to bind block attributes to post meta fields.

**Requirements:**

-   Post meta must be registered with `show_in_rest => true`
-   Post meta keys cannot start with an underscore (protected keys are not accessible)

**Example usage:**

First, register your post meta:

```php
register_meta(
	'post',
	'my_custom_field',
	array(
		'show_in_rest' => true,
		'single'       => true,
		'type'         => 'string',
	)
);
```

Then bind it to a block attribute:

```html
<!-- wp:paragraph {
	"metadata":{
		"bindings":{
			"content":{
				"source":"core/post-meta",
				"args":{"key":"my_custom_field"}
			}
		}
	}
} -->
<p>Fallback content</p>
<!-- /wp:paragraph -->
```

### core/post-data

_**Note:** Since WordPress 6.9._

The `core/post-data` source provides access to post data fields.

**Available fields:**

-   `date` - The post publication date
-   `modified` - The post last modified date
-   `link` - The post permalink

**Example usage:**

```html
<!-- wp:paragraph {
	"metadata":{
		"bindings":{
			"content":{
				"source":"core/post-data",
				"args":{"field":"date"}
			}
		}
	}
} -->
<p>Fallback content</p>
<!-- /wp:paragraph -->
```

### core/term-data

_**Note:** Since WordPress 6.9._

The `core/term-data` source provides access to taxonomy term data fields when term context is available. It requires `termId` and `taxonomy` to be available from block context to function properly.

#### Available Fields

| Field | Description | Example Output |
|-------|-------------|----------------|
| `id` | Term ID | `123` |
| `name` | Term name | `Category Name` |
| `link` | URL to term archive | `https://example.com/category/news` |
| `slug` | URL-friendly slug | `category-slug` |
| `description` | Term description | `A description of the category` |
| `parent` | Parent term ID (hierarchical taxonomies) | `0` |
| `count` | Number of posts in this term | `5` | 

#### Example Usage

**Display term names in a list:**

```html
<!-- wp:terms-query {"termQuery":{"taxonomy":"category","perPage":5}} -->
<div class="wp-block-terms-query">
	<!-- wp:term-template {"layout":{"type":"default"}} -->
	<!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"core/term-data","args":{"field":"name"}}}}} -->
	<p>Category Name</p>
	<!-- /wp:paragraph -->
	<!-- /wp:term-template -->
</div>
<!-- /wp:terms-query -->
```

**Create linked term archives:**

```html
<!-- wp:terms-query {"termQuery":{"taxonomy":"post_tag","perPage":10}} -->
<div class="wp-block-terms-query">
	<!-- wp:term-template {"layout":{"type":"default"}} -->
	<!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"core/term-data","args":{"field":"name"}}}}} -->
	<p><a href="#">Tag Name</a></p>
	<!-- /wp:paragraph -->
	<!-- /wp:term-template -->
</div>
<!-- /wp:terms-query -->
```

#### Context Requirements

The [`core/term-data`](https://github.com/WordPress/gutenberg/tree/trunk/packages/editor/src/bindings/term-data.js) source works in these contexts:

1. **Any block providing term context** - Built-in blocks like [`core/term-template`](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/term-template), or custom blocks that provide `termId` and `taxonomy` via block context
2.  **Navigation Blocks** - Special backwards compatibility handling for `core/navigation-link` and `core/navigation-submenu` (these read from block attributes instead of context)

### core/pattern-overrides

The `core/pattern-overrides` source enables pattern instances to have their content overridden on a per-instance basis. This is particularly useful for synced patterns where you want to allow specific blocks to be customized while keeping the rest of the pattern synchronized .

**How it works:**

-   Pattern blocks can define which attributes are overridable using `metadata.bindings`
-   Each pattern instance stores its override values in the `content` attribute
-   The binding connects the block attribute to the override value using the block's `metadata.name` as a key
-   The context structure follows: `pattern/overrides → {block_name} → {attribute_name}`

**Example usage:**

In the pattern definition, mark blocks as overridable:

```html
<!-- wp:paragraph {
   "metadata":{
      "bindings":{
         "content":{
            "source":"core/pattern-overrides"
         }
      },
      "name":"custom-heading"
   }
} -->
<p>Default heading text</p>
<!-- /wp:paragraph -->
```

When the pattern is instantiated, users can override the content for that specific instance:

```html
<!-- wp:block {"ref":123,"content":{"custom-heading":{"content":"My custom heading text"}}} / -->
```

In this example:

-   **`custom-heading`** is a unique identifier for the `core/paragraph` block within the `core/pattern-overrides` system.
-   It acts as a key in the overrides context structure: `pattern/overrides → custom-heading → content`.
-   This identifier allows multiple blocks of the same type (e.g., `core/paragraph`) within a pattern to have distinct, per-instance attribute overrides using `metadata.name`.

For instance, `"custom-heading"` links the specific paragraph block's `content` attribute to its override value (`"My custom heading text"`) for a particular pattern instance.

### Extending supported attributes

_**Note:** Since WordPress 6.9._

Developers can extend the list of supported attributes using the `block_bindings_supported_attributes` filter. This filter allows adding support for additional block attributes.

There are two filters available:

- `block_bindings_supported_attributes`: A general filter that receives the supported attributes array and the block type name.
- `block_bindings_supported_attributes_{$block_type}`: A dynamic filter specific to a block type (e.g., `block_bindings_supported_attributes_core/image`).

Example of adding support for the `caption` attribute on the Image block:

```php
add_filter(
	'block_bindings_supported_attributes_core/image',
	function ( $supported_attributes ) {
		$supported_attributes[] = 'caption';
		return $supported_attributes;
	}
);
```

Example of adding support for a custom block:

```php
add_filter(
	'block_bindings_supported_attributes_my-plugin/my-block',
	function ( $supported_attributes ) {
		$supported_attributes[] = 'title';
		$supported_attributes[] = 'description';
		return $supported_attributes;
	}
);
```

This filter also affects which blocks and attributes are available for Pattern Overrides, as both features share the same underlying supported attributes configuration.

### Accessing Pattern Override values in dynamic blocks

When creating a dynamic block that supports Pattern Overrides, you can access the override values within your `render_callback` function. The Pattern block (`core/block`) provides override values to nested blocks via the `pattern/overrides` context.

**Step 1: Register your block with the required context and supported attributes**

```php
add_action( 'init', function() {
	// Register supported attributes for pattern overrides
	add_filter(
		'block_bindings_supported_attributes_my-plugin/my-block',
		function ( $supported_attributes ) {
			$supported_attributes[] = 'title';
			$supported_attributes[] = 'description';
			return $supported_attributes;
		}
	);

	register_block_type( 'my-plugin/my-block', array(
		'attributes'   => array(
			'title'       => array( 'type' => 'string', 'default' => '' ),
			'description' => array( 'type' => 'string', 'default' => '' ),
			'metadata'    => array( 'type' => 'object' ),
		),
		// Declare that you need the pattern/overrides context
		'uses_context'    => array( 'pattern/overrides' ),
		'render_callback' => 'my_block_render_callback',
	) );
} );
```

**Step 2: Access override values in your render callback**

The override values are stored in `$block->context['pattern/overrides']` as an associative array. The keys are block metadata names (assigned when enabling overrides), and the values are arrays of attribute overrides.

```php
function my_block_render_callback( $attributes, $content, $block ) {
	// Get the block's metadata name (set when enabling overrides)
	$block_name = $attributes['metadata']['name'] ?? null;

	// Get the pattern overrides from context
	$overrides = array();
	if ( $block_name && isset( $block->context['pattern/overrides'][ $block_name ] ) ) {
		$overrides = $block->context['pattern/overrides'][ $block_name ];
	}

	// Get attribute values, preferring overrides when available
	// Note: An empty string in overrides means "reset to default"
	$title = $attributes['title'];
	if ( isset( $overrides['title'] ) && $overrides['title'] !== '' ) {
		$title = $overrides['title'];
	}

	$description = $attributes['description'];
	if ( isset( $overrides['description'] ) && $overrides['description'] !== '' ) {
		$description = $overrides['description'];
	}

	return sprintf(
		'<div class="my-block"><h3>%s</h3><p>%s</p></div>',
		esc_html( $title ),
		esc_html( $description )
	);
}
```

**Key points to keep in mind:**

- **`uses_context`**: Your block must declare `pattern/overrides` in its `uses_context` to receive override data from parent Pattern blocks.
- **Block metadata name**: Each overridable block instance has a unique name stored in `$attributes['metadata']['name']`. This name is assigned when the user enables overrides on the block in the editor.
- **Empty string convention**: An empty string (`""`) in the overrides represents a reset to the default value. Your code should handle this appropriately.
- **Fallback behavior**: Always provide fallback values from `$attributes` in case the block is not inside a pattern or overrides are not set.

## Registering a custom source

Registering a source requires defining at least `name`, a `label` and a `callback` function that gets a value from the source and passes it back to a block attribute.

Once a source is registered, any supporting block's `metadata.bindings` attribute can be configured to read a value from that source.

Registration can be done on the server via PHP or in the editor via JavaScript, and both can coexist.

The label defined in server registration will be overridden by the label defined in the editor.

### Server registration

Server registration allows applying a callback that will be executed on the frontend for the bound attribute.

The function to register a custom source is `register_block_bindings_source($name, $args)`:

-   `name`: `string` that sets the unique ID for the custom source.
-   `args`: `array` that contains:
    -   `label`: `string` with the human-readable name of the custom source.
    -   `uses_context`: `array` with the block context that is passed to the callback (optional).
    -   `get_value_callback`: `function` that will run on the bound block's render function. It accepts three arguments: `source_args`, `block_instance` and `attribute_name`. This value can be overridden with the filter `block_bindings_source_value`.

Note that `register_block_bindings_source()` should be called from a handler attached to the `init` hook.

Here is an example:

```php
add_action(
	'init',
	function () {
		register_block_bindings_source(
			'wpmovies/visualization-date',
			array(
				'label'              => __( 'Visualization Date', 'custom-bindings' ),
				'get_value_callback' => function ( array $source_args, $block_instance ) {
					$post_id = $block_instance->context['postId'];
					if ( isset( $source_args['key'] ) ) {
						return get_post_meta( $post_id, $source_args['key'], true );
					}
				},
				'uses_context'       => array( 'postId' ),
			)
		);
	}
);
```

This example needs a `post_meta` registered, and, also, a filter can be used to return a default `$visualization_date` value, which will be shown in the next heading.

```php
add_action(
	'init',
	function () {
		register_meta(
			'post',
			'wp_movies_visualization_date',
			array(
				'show_in_rest' => true,
				'single'       => true,
				'type'         => 'string',
				'label'        => __( 'Movie visualization date', 'custom-bindings' ),
			)
		);
	}
);
```

<div class="callout callout-alert">
<strong>Note:</strong> Post meta keys that begin with an underscore (e.g. `_example_key`) are protected and cannot be used with Block Bindings. Additionally, post meta must be registered with `show_in_rest = true` to be available through the Block Bindings API.
</div>

#### Block bindings source value filter

_**Note:** Since WordPress 6.7._

The value returned by `get_value_callback` can be modified with the `block_bindings_source_value` filter.
The filter has the following parameters:

-   `value`: The value to be filtered.
-   `name`: The name of the source.
-   `source_args`: `array` containing source arguments.
-   `block_instance`: The block instance object.
-   `attribute_name`: The name of the attribute.

Example:

```php
function wpmovies_format_visualization_date( $value, $name ) {
	// Prevent the filter to be applied to other sources.
	if ( $name !== 'wpmovies/visualization-date' ) {
		return $value;
	}
	if ( ! $value ) {
		return date( 'm/d/Y' );
	}
	return date( 'm/d/Y', strtotime( $value ) );
}

add_filter( 'block_bindings_source_value', 'wpmovies_format_visualization_date', 10, 2 );
```

#### Customizing supported attributes filter

_**Note:** Since WordPress 6.9._

The `block_bindings_supported_attributes_{$block_type}` filter allows developers to customize which of a block's attributes can be connected to a Block Bindings source. This filter enables the Block Bindings UI in the editor for the specified attributes.

This filter provides a way to extend or restrict which attributes of a specific block type can be bound to dynamic sources. The attributes registered through this filter will appear as options in the block binding interface.

<div class="callout callout-warning">This filter has no impact on pattern overrides as they are handled independently.</div>

Example:

```php
// Allow binding the 'caption' attribute for image blocks
add_filter( 'block_bindings_supported_attributes_core/image', function( $supported_attributes ) {
    $supported_attributes[] = 'caption';
    return $supported_attributes;
} );
```

#### Server registration Core examples

There are a few examples in Core that can be used as reference.

-   Post Meta. [Source code](https://github.com/WordPress/wordpress-develop/blob/trunk/src/wp-includes/block-bindings/post-meta.php)
-   Post Data. [Source code](https://github.com/WordPress/wordpress-develop/blob/trunk/src/wp-includes/block-bindings/post-data.php)
-   Term Data. [Source code](https://github.com/WordPress/wordpress-develop/blob/trunk/src/wp-includes/block-bindings/term-data.php)
-   Pattern overrides. [Source code](https://github.com/WordPress/wordpress-develop/blob/trunk/src/wp-includes/block-bindings/pattern-overrides.php)
-   Twenty Twenty-Five theme. [Source code](https://github.com/WordPress/wordpress-develop/blob/trunk/src/wp-content/themes/twentytwentyfive/functions.php)

### Editor registration

_**Note:** Since WordPress 6.7._

Editor registration on the client allows defining what the bound block will do when the value is retrieved or when the value is edited.

The function to register a custom source is `registerBlockBindingsSource( args )`:

-   `args`: `object` with the following structure:
    -   `name`: `string` with the unique and machine-readable name.
    -   `label`: `string` with the human readable name of the custom source. In case it was defined already on the server, the server label will be overridden by this one, in that case, it is not recommended to be defined here. (optional)
    -   `usesContext`: `array` with the block context that the custom source may need. In case it was defined already on the server, it should not be defined here. (optional)
    -   `getValues`: `function` that retrieves the values from the source. (optional)
    -   `setValues`: `function` that allows updating the values connected to the source. (optional)
    -   `canUserEditValue`: `function` to determine if the user can edit the value. The user won't be able to edit by default. (optional)
    -   `getFieldsList`: `function` that returns available fields for the UI dropdown selector. (_Since WordPress 6.9_) (optional)

This example will show a custom post meta date in the editor and, if it doesn't exist, it will show today's date. The user can edit the value of the date. (Caution: This example does not format the user input as a date—it's only for educational purposes.)

```js
import { registerBlockBindingsSource } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { store as coreDataStore } from '@wordpress/core-data';

registerBlockBindingsSource( {
	name: 'wpmovies/visualization-date',
	label: __( 'Visualization Date', 'custom-bindings' ), // We can skip the label, as it was already defined in the server in the previous example.
	usesContext: [ 'postType' ], // We can skip postId, as it was already defined in the server in the previous example.
	getValues( { select, context } ) {
		let wpMoviesVisualizationDate;
		const { getEditedEntityRecord } = select( coreDataStore );
		if ( context?.postType && context?.postId ) {
			wpMoviesVisualizationDate = getEditedEntityRecord(
				'postType',
				context?.postType,
				context?.postId
			).meta?.wp_movies_visualization_date;
		}
		if ( wpMoviesVisualizationDate ) {
			return {
				content: wpMoviesVisualizationDate,
			};
		}

		return {
			content: new Date().toLocaleDateString( 'en-US' ),
		};
	},
	setValues( { select, dispatch, context, bindings } ) {
		dispatch( coreDataStore ).editEntityRecord(
			'postType',
			context?.postType,
			context?.postId,
			{
				meta: {
					wp_movies_visualization_date: bindings?.content?.newValue,
				},
			}
		);
	},
	canUserEditValue( { select, context } ) {
		return true;
	},
} );
```

#### getValues

The `getValues` function retrieves the value from the source on block loading. It receives an `object` as an argument with the following properties:

-   `bindings` returns the bindings object of the specific source. It must have the attributes as a key, and the value can be a `string` or an `object` with arguments.
-   `clientId` returns a `string` with the current block client ID.
-   `context` returns an `object` of the current block context, defined in the `usesContext` property. [More about block context.](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-context/).
-   `select` returns an `object` of a given store's selectors. [More info in their docs.](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#select).

The function must return an `object` with this structure:
`{ 'block attribute' : value }`

#### setValues

The `setValues` function updates all the values of the source of the block bound. It receives an `object` as an argument with the following properties:

-   `bindings` returns the bindings object of the specific source. It must have the attributes as a key, and the value can be a `string` or an `object` with arguments. This object contains a `newValue` property with the user's input.
-   `clientId` returns a `string` with the current block client ID.
-   `context` returns an `object` of the current block context, defined in the `usesContext` property. [More about block context.](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-context/).
-   `dispatch` returns an `object` of the store's action creators. [More about dispatch](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#dispatch).
-   `select` returns an `object` of a given store's selectors. [More info in their docs.](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#select).

#### getFieldsList

_**Note:** Since WordPress 6.9._

The `getFieldsList` function enables custom sources to appear in the Block Bindings UI dropdown selector. When a user selects an option from the dropdown, the source is automatically bound to the block attribute with the corresponding `args` from the selected field. This function must return an array of field objects that define the available binding options.

Each field object in the array should have the following properties:

-   `label`: `string` that defines the label shown in the dropdown selector. Defaults to the source label if not provided.
-   `type`: `string` that defines the attribute value type. It must match the attribute type it binds to; otherwise, it won't appear in the UI. For example, an `id` attribute that accepts only numbers should only display fields that return numeric values.
-   `args`: `object` that defines the source arguments that are applied when a user selects the field from the dropdown.

Example:

```js
registerBlockBindingsSource( {
	name: 'my-plugin/custom-fields',
	label: 'Custom Fields',
	getFieldsList() {
		return [
			{
				label: 'Author Name',
				type: 'string',
				args: {
					field: 'author_name',
				},
			},
			{
				label: 'Publication Year',
				type: 'string',
				args: {
					field: 'publication_year',
				},
			},
			{
				label: 'Page Count',
				type: 'number',
				args: {
					field: 'page_count',
				},
			},
		];
	},
	getValues( { bindings } ) {
		// Implementation to retrieve values based on args.field
	},
} );
```

With this implementation, users will see "Author Name", "Publication Year", and "Page Count" as options in the Block Bindings UI dropdown when binding block attributes to your custom source.

<div class="callout callout-info">
Check the <a href="https://github.com/WordPress/block-development-examples/tree/trunk/plugins/editor-bindings">Editor Bindings</a> example from the <a href="https://github.com/WordPress/block-development-examples/">Block Development Examples</a> repo
</div>

#### Editor registration Core examples

There are a few examples in Core that can be used as reference.

-   Post Meta. [Source code](https://github.com/WordPress/gutenberg/blob/5afd6c27bfba2be2e06b502257753fbfff1ae9f0/packages/editor/src/bindings/post-meta.js#L74-L146)
-   Pattern overrides. [Source code](https://github.com/WordPress/gutenberg/blob/5afd6c27bfba2be2e06b502257753fbfff1ae9f0/packages/editor/src/bindings/pattern-overrides.js#L8-L100)

## Unregistering a source

_**Note:** Since WordPress 6.7._

`unregisterBlockBindingsSource` unregisters a block bindings source by providing its name.

```js
import { unregisterBlockBindingsSource } from '@wordpress/blocks';

unregisterBlockBindingsSource( 'plugin/my-custom-source' );
```

## Getting all sources

_**Note:** Since WordPress 6.7._

`getBlockBindingsSources` returns all registered block bindings sources.

```js
import { getBlockBindingsSources } from '@wordpress/blocks';

const registeredSources = getBlockBindingsSources();
```

## Getting one specific source

_**Note:** Since WordPress 6.7._

`getBlockBindingsSource` return a specific block bindings source by its name.

```js
import { getBlockBindingsSource } from '@wordpress/blocks';

const blockBindingsSource = getBlockBindingsSource( 'plugin/my-custom-source' );
```

## Block Bindings Utils

_**Note:** Since WordPress 6.7._

UseBlockBindingUtils is a hook with two helpers that allows developers to edit the `metadata.bindings` attribute easily.

It accepts a `clientId` string as a parameter, if it is not set, the function will use the current block client ID from the context.

Example:

```js
import { useBlockBindingsUtils } from '@wordpress/block-editor';

const { updateBlockBindings } = useBlockBindingsUtils('my-block-client-id-12345');
...
```

### updateBlockBindings

`updateBlockBindings` works similarly to `updateBlockAttributes`, and can be used to create, update, or remove specific connections.

```js
import { useBlockBindingsUtils } from '@wordpress/block-editor';

const { updateBlockBindings } = useBlockBindingsUtils();

function updateBlockBindingsURLSource( url ) {
	updateBlockBindings( {
		url: {
			source: 'myplugin/new-source',
		},
	} );
}

// Remove binding from url attribute.
function removeBlockBindingsURLSource() {
	updateBlockBindings( { url: undefined } );
}
```

### removeAllBlockBindings

`removeAllBlockBindings` will remove all existing connections in a block by removing the `metadata.bindings` attribute.

```js
import { useBlockBindingsUtils } from '@wordpress/block-editor';

const { removeAllBlockBindings } = useBlockBindingsUtils();

function clearBlockBindings() {
	removeAllBlockBindings();
}
```
