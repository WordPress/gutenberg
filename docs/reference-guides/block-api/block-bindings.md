# Bindings

_**Note:** This section is  yet under development._

Block Bindings API lets you “bind” dynamic data to the block’s attributes, which are then reflected in the final HTML markup that is output to the browser on the front end.

An example could be connecting an Image block url attribute to a function that returns random images from an external API.

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


## Compatible blocks and its attributes

Right now, not all blocks attributes are compatible with block bindings. There is some effort going on increasing this compatibility, but, right now, this is the list:

- Paragraph block.
    - content

- Heading block.
    - content

- Image block.
    - ID
    - url
    - title
    - alt

- Button block.
    - text
    - url
    - linkTarget
    - rel

## Registering a custom source

Registering a source consists of defining a **name** for that source and a callback function specifying how to get a value from that source and pass it to a block attribute.

Once a source is registered, any block that supports the Block Bindings API can use a value from that source by setting its `metadata.bindings` attribute to a value that refers to the source.

Registration can be done in the server via PHP or in the editor via JavaScript and both can coexist.

The label defined on server registration will be overridden by the label defined in Editor.

### Server registration

Server registration allows to apply a callback that will be executed on the frontend for the defined bound attribute.

The function to register a custom source is `register_block_bindings_source($name, $args)`.

- `$name` is a `string` that sets the unique id for the custom source.
- `$args` is an `array` that contains:
    - `label` is a `string` with the human readable name of the custom source.
    - `uses_context` is an `array` with the block context that is passed to the callback.
    - `get_value_callback` is the `function` that will run on the bound block render function. It accepts three arguments: `$source_args`, `$block_instance` and `$attribute_name`.

Note that `register_block_bindings_source()` should be called from a handler attached to the `init` hook.

Here is an example:

```php
add_action(
	'init',
	function() {
		register_block_bindings_source(
			'wpmovies/visualization-date',
			array(
				'label'              => __( 'Visualization Date', 'custom-bindings' ),
				'get_value_callback' => function( array $source_args, $block_instance ) {
					$post_id = $block_instance->context['postId'];
					$visualization_date = get_post_meta( $post_id, 'wp_movies_visualization_date', true );
					if ( ! $visualization_date ) {
						$visualization_date = date("m/d/Y");
					}
					return $visualization_date;
				},
				'uses_context'       => array( 'postId', 'postType' ),
			)
		);
	}
);
```

This example needs a `post_meta` registered:

```php
add_action(
	'init',
	function() {
		register_meta(
			'post',
			'wp_movies_visualization_date',
			array(
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'label'				=> __( 'Movie visualization date' ),
			)
		);
	}
);
```

#### Server registration Core examples

There are a few examples in Core that can be used as a reference.

- Post Meta. [Source code](https://github.com/WordPress/wordpress-develop/blob/68d2421d758498095449006a055ad8ce5b7a8a40/src/wp-includes/block-bindings/post-meta.php#L59)
- Pattern overrides. [Source code](https://github.com/WordPress/wordpress-develop/blob/68d2421d758498095449006a055ad8ce5b7a8a40/src/wp-includes/block-bindings/pattern-overrides.php#L36)
- Twenty Twentyfive theme. [Source code](https://github.com/WordPress/wordpress-develop/blob/68d2421d758498095449006a055ad8ce5b7a8a40/src/wp-content/themes/twentytwentyfive/functions.php#L130)


### Editor registration

Editor registration on the client allows to define what the bound block will do when the value is retrieved or when the value is edited.

The function to register a custom source is `registerBlockBindingsSource( args )`.

- `args` is an `object` with the following structure
    - `name` is a `string` with the unique and machine readable name.
    - `label` is a tring with the human readable name of the custom source.
    - `usesContext` is an optional `array` with the block context that the custom source may need.
    - `getValues` is an optional `function` that retrieves the values from the source.
    - `setValues` is an optional `function` that allows to update the values connected to the source.
    - `canUserEditValue` is an optional `function` to determine if the user can edit the value. The user won't be able to edit by default.
    - `getFieldsList` is a private `function`. It cannot be used yet by third party developers. It creates a list for the block bindings UI with post meta.

`label` argument will override the one defined in the server if they are different.


This example will show a custom post meta date on the editor and, if it doesn't exist, it will show today's date.
The user can edit the value of the date. (Caution: this example is not formatting the user input as a date, it's only for educational purposes.)

```js
import {
	registerBlockBindingsSource,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

registerBlockBindingsSource( {
	name: 'wpmovies/visualization-date',
	label: __( 'Visualization Date' ),
	useContext: [ 'postId', 'postType' ],
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
	getValues( { select, context } ) {
		let wpModiesVisualizationDate;
		const { getEditedEntityRecord } = select( coreDataStore );
		if ( context?.postType && context?.postId ) {
			return getEditedEntityRecord(
				'postType',
				context?.postType,
				context?.postId
			).meta?.wp_movies_visualization_date;
		}
		if ( wpModiesVisualizationDate ) {
			return {
				content: wpModiesVisualizationDate,
			};
		}

		return {
			content: new Date().toLocaleDateString( 'en-US' ),
		};
	},
	canUserEditValue( { select, context } ) {
		return true;
	},
} );
```

#### getValues

`getValues` function retrieves the value from the source on block loading. It receives an `object` as an argument with the following properties.

- `bindings` return the bindings object. It must have the attributes as a key, and the value can be a string or an object with arguments.
- `cliendId` returns a `string` with the current block client id.
- `context` returns an `object` of the current block context, defined in the `usesContext` property. [More about block context.](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-context/).
- `select` returns an `object` of a given store selectors. [More info in their docs.](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#select).

The function must return an `object` with this structure:
`{ 'block attribute' : value }`

#### setValues

`setValues` updates all the values of the source of the block bound. It receives an `object` as an argument with the following properties.

- `bindings` return the bindings object. It must have the attributes as a key, and the value can be a string or an object with arguments. This object contains a `newValue` property with the user's input.
- `cliendId` returns a `string` with the current block client id.
- `context` returns an `object` of the current block context, defined in the `usesContext` property. [More about block context.](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-context/).
- `dispatch` returns an `object` of the store's action creators. [More about dispatch](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#dispatch).
- `select` returns an `object` of a given store selectors. [More info in their docs.](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#select).


#### Editor registration Core examples

There are a few examples in Core that can be used as a reference.

- Post Meta. [Source code](https://github.com/WordPress/gutenberg/blob/5afd6c27bfba2be2e06b502257753fbfff1ae9f0/packages/editor/src/bindings/post-meta.js#L74-L146)
- Pattern overrides. [Source code](https://github.com/WordPress/gutenberg/blob/5afd6c27bfba2be2e06b502257753fbfff1ae9f0/packages/editor/src/bindings/pattern-overrides.js#L8-L100)

## Unregistering a source

`unregisterBlockBindingsSource` unregisters a block bindings source by providing its name.

```js
import { unregisterBlockBindingsSource } from '@wordpress/blocks';

unregisterBlockBindingsSource( 'plugin/my-custom-source' );
```


