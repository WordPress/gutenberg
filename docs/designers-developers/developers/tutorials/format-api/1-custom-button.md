# Create a custom button

Through this section you're going to add a custom button to the format toolbar to match the new format to be created.

## Registering a new format

As a first step, you'll register the new format type using the [`registerFormatType`](/packages/rich-text/README.md#registerFormatType) primitive. Create a folder for your plugin, and within it a file named `my-custom-format.php` containing the necessary PHP code to register and enqueue the JavaScript assets:

```php
<?php

/**
 * Plugin Name: My custom format
 */

function my_custom_format_script_register() {
	wp_register_script(
		'my-custom-format-js',
		plugins_url( 'my-custom-format.js', __FILE__ ),
		array( 'wp-rich-text' )
	);
}
add_action( 'init', 'my_custom_format_script_register' );

function my_custom_format_enqueue_assets_editor() {
	wp_enqueue_script( 'my-custom-format-js' );
}
add_action( 'enqueue_block_editor_assets', 'my_custom_format_enqueue_assets_editor' );
```

Then create a new file named `my-custom-format.js` with the following contents in the same folder:

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

The registered format types are stored in the `core/rich-text` store, so once the plugin is available and activated, and after a new post/page is loaded in the browser, you may want to check the new registered format is avaliable. Run this code in your browser's console:

	wp.data.select( 'core/rich-text' ).getFormatTypes();

It'll return an array containing the format types, including your own.

## Adding a button attached to the new format

Next step is to surface the new format in the UI by using the [`RichTextToolbarButton`](/packages/editor/src/components/rich-text/README.md#RichTextToolbarButton) component.

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

Don't forget also adding `wp-element` and `wp-editor` to the dependencies array in the PHP file along with the existing `wp-rich-text`.

Let's check that everything worked as expected. Reload the post/page and select a block. Make sure the new button was added to the format toolbar with the [editor-code dashicon](https://developer.wordpress.org/resource/dashicons/#editor-code):

![Toolbar with custom button](/docs/designers-developers/assets/toolbar-with-custom-button.png)
