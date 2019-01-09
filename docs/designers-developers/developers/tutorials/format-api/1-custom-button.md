# Create a custom button

Through this section you're going to add a custom button to the format toolbar that will match the new format to be created.

## Registering a new format

Before adding the button you'll create the new format the button intends to apply. To register a new format type you use the [`registerFormatType`](/packages/rich-text/README.md#registerFormatType) primitive.

Let's prepare a minimal plugin. Create a new folder and a file named `my-custom-format.php` within it containing the necessary PHP code to register and enqueue the JavaScript assets:

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

Then add a new file named `my-custom-format.js` with the following contents:

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

WordPress maintains the available format types in the `core/rich-text` store, so once the plugin is available and activated, and after a new post/page is loaded in the browser, you may want to check your custom format has been made avaliable as well. Run this code in your browser's console:

	wp.data.select( 'core/rich-text' ).getFormatTypes();

It'll return an array containing the format types, including your own.

## Adding a button attached to the new format

Now that the format is avaible, the next step is to surface it to the UI by using the [`RichTextToolbarButton`](/packages/editor/src/components/rich-text/README.md#RichTextToolbarButton) component.

```js
( function( wp ) {
	var MyCustomButton = function( props ) {
		return wp.element.createElement(
			wp.editor.RichTextToolbarButton, {
				icon: 'editor-code',
				title: 'Sample output',
				onClick: function() {
					console.log( 'toggle format' );
				},
			}
		);
	}
	wp.richText.registerFormatType(
		'my-custom-format/sample-output', {
			title: 'Sample output',
			tagName: 'samp',
			className: null,
			edit: MyCustomButton,
		}
	);
} )( window.wp );
```

Note that you're using two new utilities (`wp.element.createElement`, and `wp.editor.RichTextToolbarButton`) so don't forget adding `wp-element` and `wp-editor` to the dependencies array in the PHP file along with the existing `wp-rich-text`.

Before moving forward, let's check that everything is working as expected so far. Reload the post/page and select a text block. Make sure the new button was added to the format toolbar, it uses the [editor-code dashicon](https://developer.wordpress.org/resource/dashicons/#editor-code), and the hover text is what you set in the title:

![Toolbar with custom button](/docs/designers-developers/assets/toolbar-with-custom-button.png)

You may also want to check that upon clicking the button the `toggle format` message is shown in the console.
