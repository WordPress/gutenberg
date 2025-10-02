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

Right now, not all block attributes are compatible with block bindings. There is some ongoing effort to increase this compatibility, but for now, this is the list:

| Supported Blocks    | Supported Attributes       |
| ----------------    | --------------------       |
| Paragraph           | content                    |
| Heading             | content                    |
| Image               | id, url, title, alt        |
| Button              | text, url, linkTarget, rel |

## Registering a custom source

Registering a source requires defining at least `name`, a `label` and a `callback` function that gets a value from the source and passes it back to a block attribute.

Once a source is registered, any supporting block's `metadata.bindings` attribute can be configured to read a value from that source.

Registration can be done on the server via PHP or in the editor via JavaScript, and both can coexist.

The label defined in server registration will be overridden by the label defined in the editor.

### Server registration

Server registration allows applying a callback that will be executed on the frontend for the bound attribute.

The function to register a custom source is `register_block_bindings_source($name, $args)`:

- `name`: `string` that sets the unique ID for the custom source.
- `args`: `array` that contains:
    - `label`: `string` with the human-readable name of the custom source.
    - `uses_context`: `array` with the block context that is passed to the callback (optional).
    - `get_value_callback`: `function` that will run on the bound block's render function. It accepts three arguments: `source_args`, `block_instance` and `attribute_name`. This value can be overridden with the filter `block_bindings_source_value`.

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

- `value`: The value to be filtered.
- `name`: The name of the source.
- `source_args`: `array` containing source arguments.
- `block_instance`: The block instance object.
- `attribute_name`: The name of the attribute.

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

#### Server registration Core examples

There are a few examples in Core that can be used as reference.

- Post Meta. [Source code](https://github.com/WordPress/wordpress-develop/blob/trunk/src/wp-includes/block-bindings/post-meta.php)
- Pattern overrides. [Source code](https://github.com/WordPress/wordpress-develop/blob/trunk/src/wp-includes/block-bindings/pattern-overrides.php)
- Twenty Twenty-Five theme. [Source code](https://github.com/WordPress/wordpress-develop/blob/trunk/src/wp-content/themes/twentytwentyfive/functions.php)


### Editor registration

_**Note:** Since WordPress 6.7._

Editor registration on the client allows defining what the bound block will do when the value is retrieved or when the value is edited.

The function to register a custom source is `registerBlockBindingsSource( args )`:

- `args`: `object` with the following structure:
    - `name`: `string` with the unique and machine-readable name.
    - `label`: `string` with the human readable name of the custom source. In case it was defined already on the server, the server label will be overridden by this one, in that case, it is not recommended to be defined here. (optional)
    - `usesContext`: `array` with the block context that the custom source may need. In case it was defined already on the server, it should not be defined here. (optional)
    - `getValues`: `function` that retrieves the values from the source. (optional)
    - `setValues`: `function` that allows updating the values connected to the source. (optional)
    - `canUserEditValue`: `function` to determine if the user can edit the value. The user won't be able to edit by default. (optional)


This example will show a custom post meta date in the editor and, if it doesn't exist, it will show today's date. The user can edit the value of the date. (Caution: This example does not format the user input as a date—it's only for educational purposes.)

```js
import {
	registerBlockBindingsSource,
} from '@wordpress/blocks';
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

- `bindings` returns the bindings object of the specific source. It must have the attributes as a key, and the value can be a `string` or an `object` with arguments.
- `clientId` returns a `string` with the current block client ID.
- `context` returns an `object` of the current block context, defined in the `usesContext` property. [More about block context.](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-context/).
- `select` returns an `object` of a given store's selectors. [More info in their docs.](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#select).

The function must return an `object` with this structure:
`{ 'block attribute' : value }`

#### setValues

The `setValues` function updates all the values of the source of the block bound. It receives an `object` as an argument with the following properties:

- `bindings` returns the bindings object of the specific source. It must have the attributes as a key, and the value can be a `string` or an `object` with arguments. This object contains a `newValue` property with the user's input.
- `clientId` returns a `string` with the current block client ID.
- `context` returns an `object` of the current block context, defined in the `usesContext` property. [More about block context.](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-context/).
- `dispatch` returns an `object` of the store's action creators. [More about dispatch](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#dispatch).
- `select` returns an `object` of a given store's selectors. [More info in their docs.](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#select).


#### Editor registration Core examples

There are a few examples in Core that can be used as reference.

- Post Meta. [Source code](https://github.com/WordPress/gutenberg/blob/5afd6c27bfba2be2e06b502257753fbfff1ae9f0/packages/editor/src/bindings/post-meta.js#L74-L146)
- Pattern overrides. [Source code](https://github.com/WordPress/gutenberg/blob/5afd6c27bfba2be2e06b502257753fbfff1ae9f0/packages/editor/src/bindings/pattern-overrides.js#L8-L100)

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
	updateBlockBindings({
		url: {
			source: 'myplugin/new-source',
		}
	})
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



