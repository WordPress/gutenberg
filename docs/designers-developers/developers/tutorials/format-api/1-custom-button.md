# Create a custom button

The first step in the journey is to add a custom button to the format toolbar.

First, you'll register the new format type using the [`registerFormatType`](/packages/rich-text/README.md#registerFormatType) utility:

```js
( function( wp ) {
	wp.richText.registerFormatType(
		'my-custom-format/sample-output', {
			title: 'Sample output',
			tagName: 'samp',
			className: null,
		}
	);
} )( window.wp );
```

The registered format types are stored in the `core/rich-text` store, so you may want to query it to see the new available format. `wp.data.select( 'core/rich-text' ).getFormatTypes()` should return an array containing the format types, including your own.

Now that it's registered, you're going to actually surface it in the UI by means of a button using the `RichTextToolbarButton` component.

```js
( function( wp ) {
	wp.richText.registerFormatType(
		'my-custom-format/sample-output', {
			title: 'Sample output',
			tagName: 'samp',
			className: null,
			edit: function( props ) {
				return wp.element.createElement(
					wp.editor.RichTextToolbarButton, {
						icon: 'editor-code',
						title: 'Sample output',
						onClick: function() {
							console.log( 'toggle format' );
						},
					}
				);
			},
		}
	);
} )( window.wp );
```

PHP code:

```php
<?php

/**
 * Plugin Name: My custom format
 */

function my_custom_format_script_register() {
	wp_register_script(
		'my-custom-format-js',
		plugins_url( 'my-custom-format.js', __FILE__ ),
		array( 'wp-editor', 'wp-element', 'wp-rich-text' )
	);
}
add_action( 'init', 'my_custom_format_script_register' );

function my_custom_format_enqueue_assets_editor() {
	wp_enqueue_script( 'my-custom-format-js' );
}
add_action( 'enqueue_block_editor_assets', 'my_custom_format_enqueue_assets_editor' );
```

Make plugin available.
Activate plugin.
Check that new button exists.