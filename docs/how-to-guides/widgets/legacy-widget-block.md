# About the Legacy Widget block

The Legacy Widget block allows users to add, edit and preview third party widgets that are registered by plugins and widgets that were added using the classic Widgets Editor.

Third party widgets can be added by inserting a Legacy Widget block using the block inserter and selecting the widget from the block's dropdown.

Third party widgets may also be added by searching for the name of the widget in the block inserter and selecting the widget. A variation of the Legacy Widget block will be inserted.

## Compatibility with the Legacy Widget block

### The `widget-added` event

The Legacy Widget block will display the widget's form in a way similar to the Customizer, and so is compatible with most third party widgets.

If the widget uses JavaScript in its form, it is important that events are added to the DOM after the `'widget-added'` jQuery event is triggered on `document`.

For example, a widget might want to show a "Password" field when the "Change password" checkbox is checked.

```js
( function ( $ ) {
	$( document ).on( 'widget-added', function ( $event, $control ) {
		$control.find( '.change-password' ).on( 'change', function () {
			var isChecked = $( this ).prop( 'checked' );
			$control.find( '.password' ).toggleClass( 'hidden', ! isChecked );
		} );
	} );
} )( jQuery );
```

Note that all of the widget's event handlers are added in the `widget-added` callback.

### Displaying "No preview available."

The Legacy Widget block will display a preview of the widget when the Legacy Widget block is not selected.

A "No preview available." message is automatically shown by the Legacy Widget block when the widget's `widget()` function does not render anything or only renders empty HTML elements.

Widgets may take advantage of this by returning early from `widget()` when a preview should not be displayed.

```php
class ExampleWidget extends WP_Widget {
	...
	public function widget( $instance ) {
		if ( ! isset( $instance['name'] ) ) {
			// Name is required, so display nothing if we don't have it.
			return;
		}
		?>
		<h3>Name: <?php echo esc_html( $instance['name'] ); ?></h3>
		...
		<?php
	}
	...
}
```

### Allowing migration to a block

You can allow users to easily migrate a Legacy Widget block containing a specific widget to a block or multiple blocks. This allows plugin authors to phase out their widgets in favour of blocks which are more intuitive and can be used in more places.

The following steps show how to do this.

#### 1) Display the widget's instance in the REST API

First, we need to tell WordPress that it is OK to display your widget's instance array in the REST API.

This can be safely done if:

-   You know that all of the values stored by your widget in `$instance` can be represented as JSON; and
-   You know that your widget does not store any private data in `$instance` that should be kept hidden from users that have permission to customize the site.

If it is safe to do so, then include a widget option named `show_instance_in_rest` with its value set to `true` when registering your widget.

```php
class ExampleWidget extends WP_Widget {
	...
	/**
	 * Sets up the widget
	 */
	public function __construct() {
		$widget_ops = array(
			// ...other options here
			'show_instance_in_rest' => true,
			// ...other options here
		);
		parent::__construct( 'example_widget', 'ExampleWidget', $widget_ops );
	}
	...
}
```

This allows the block editor and other REST API clients to see your widget's instance array by accessing `instance.raw` in the REST API response.

Note that [versions of WordPress prior to 5.8.0 allowed you to enable this feature by setting `$show_instance_in_rest` to `true`](https://core.trac.wordpress.org/ticket/53332) in the class that extends `WP_Widget`.

```php
class ExampleWidget extends WP_Widget {
	...
	public $show_instance_in_rest = true;
	...
}
```

This is now deprecated in favour of the widget option method.

#### 2) Add a block transform

Now, we can define a [block transform](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-transforms/) which tells the block editor what to replace the Legacy Widget block containing your widget with.

This is done by adding JavaScript code to your block's definition. In this example, we define a transform that turns a widget with ID `'example_widget'` into a block with name `'example/block'`.

```js
transforms: {
	from: [
		{
			type: 'block',
			blocks: [ 'core/legacy-widget' ],
			isMatch: ( { idBase, instance } ) => {
				if ( ! instance?.raw ) {
					// Can't transform if raw instance is not shown in REST API.
					return false;
				}
				return idBase === 'example_widget';
			},
			transform: ( { instance } ) => {
				return createBlock( 'example/block', {
					name: instance.raw.name,
				} );
			},
		},
	]
},
```

#### 3) Hide the widget from the Legacy Widget block

As a final touch, we can tell the Legacy Widget block to hide your widget from the "Select widget" dropdown and from the block inserter. This encourages users to use the block that replaces your widget.

This can be done using the `widget_types_to_hide_from_legacy_widget_block` filter.

```php
function hide_example_widget( $widget_types ) {
	$widget_types[] = 'example_widget';
	return $widget_types;
}
add_filter( 'widget_types_to_hide_from_legacy_widget_block', 'hide_example_widget' );
```

## Using the Legacy Widget block in other block editors (Advanced)

You may optionally allow the Legacy Widget block in other block editors such as
the WordPress post editor. This is not enabled by default.

First, ensure that any styles and scripts required by the legacy widgets are
loaded onto the page. A convenient way of doing this is to manually perform all
of the hooks that ordinarily run when a user browses to the widgets WP Admin
screen.

```php
add_action( 'admin_print_styles', function() {
	if ( get_current_screen()->is_block_editor() ) {
		do_action( 'admin_print_styles-widgets.php' );
	}
} );
add_action( 'admin_print_scripts', function() {
	if ( get_current_screen()->is_block_editor() ) {
		do_action( 'load-widgets.php' );
		do_action( 'widgets.php' );
		do_action( 'sidebar_admin_setup' );
		do_action( 'admin_print_scripts-widgets.php' );
	}
} );
add_action( 'admin_print_footer_scripts', function() {
	if ( get_current_screen()->is_block_editor() ) {
		do_action( 'admin_print_footer_scripts-widgets.php' );
	}
} );
add_action( 'admin_footer', function() {
	if ( get_current_screen()->is_block_editor() ) {
		do_action( 'admin_footer-widgets.php' );
	}
} );
```

Then, register the Legacy Widget block using `registerLegacyWidgetBlock` which
is defined in the `@wordpress/widgets` package.

```php
add_action( 'enqueue_block_editor_assets', function() {
	wp_enqueue_script( 'wp-widgets' );
	wp_add_inline_script( 'wp-widgets', 'wp.widgets.registerLegacyWidgetBlock()' );
} );
```

To load the styles and scripts on the editor for the Legacy Widget block, it's recommended to use constructore of the widget registration class or a widget method. It will ensure style and script being loaded on the iFrame as well.
