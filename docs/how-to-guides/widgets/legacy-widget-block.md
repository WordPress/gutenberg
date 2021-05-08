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
( function( $ ) {
	$( document ).on( 'widget-added', function( $control ) {
		$control.find( '.change-password' ).on( 'change', function() {
			var isChecked = $( this ).prop( 'checked' );
			$control.find( '.password' ).toggleClass( 'hidden', ! isChecked );
		} );
	} );
} )( jQuery );
```

Note that all of the widget's event handlers are added in the `widget-added` callback.

### Displaying "No preview available."

The Legacy Widget block will display a preview of the widget when the Legacy Widget block is not selected.

A "No preview available." message is automatically shown by the Legacy Widget block when the widget's `widget()` function does not render anytihng or only renders empty HTML elements.

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

- You know that all of the values stored by your widget in `$instance` can be represented as JSON; and
- You know that your widget does not store any private data in `$instance` that should be kept hidden from users that have permission to customize the site.

If it is safe to do so, then set `$show_instance_in_rest` to `true` in the class that extends `WP_Widget`.

```php
class ExampleWidget extends WP_Widget {
	...
	public $show_instance_in_rest = true;
	...
}
```

This allows the block editor and other REST API clients to see your widget's instance array by accessing `instance.raw` in the REST API response.

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
