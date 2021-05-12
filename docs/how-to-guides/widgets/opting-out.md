# Restoring the classic Widgets Editor

There are several ways to disable the new Widgets Block Editor.

## Using `remove_theme_support`

Themes may disable the Widgets Block Editor by calling `remove_theme_support( 'widgets-block-editor' )`.

For example, a theme may have the following PHP code in `functions.php`.

```php
function example_theme_support() {
	remove_theme_support( 'widgets-block-editor' );
}
add_action( 'after_setup_theme', example_theme_support' );
```

## Using the Classic Widgets plugin

End users may disable the Widgets Block Editor by installing and activating the [Classic Widgets plugin](https://wordpress.org/plugins/classic-widgets/).

With this plugin installed, the Widgets Block Editor can be toggled on and off by deactivating and activating the plugin.

## Using a filter

the `gutenberg_use_widgets_block_editor` filter controls whether or not the Widgets Block Editor is enabled.

For example, a site administrator may include the following PHP code in a mu-plugin to disable the Widgets Block Editor.

```php
add_filter( 'gutenberg_use_widgets_block_editor', '__return_false' );
```

For more advanced uses, you may supply your own function. In this example, the Widgets Block Editor is disabled for a specific user.

```php
function example_use_widgets_block_editor( $use_widgets_block_editor ) {
	if ( 123 === get_current_user_id() ) {
		return false;
	}
	return $use_widgets_block_editor;
}
add_filter( 'gutenberg_use_widgets_block_editor', 'example_use_widgets_block_editor' );
```
