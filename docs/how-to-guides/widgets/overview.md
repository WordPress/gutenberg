# Widgets Block Editor overview

## Widgets Block Editor screen

Gutenberg replaces the Widgets screen in WP Admin with a new screen built using the familiar WordPress block editor.

You can access the new Widgets Block Editor by navigating to Appearance → Widgets.

The Widgets Block Editor allows you to insert blocks and widgets into any of the [Widget Areas or Sidebars](https://developer.wordpress.org/themes/functionality/sidebars/) defined by the site's active theme.

## Customizer Widgets Block Editor

Gutenberg also replaces the Widgets editor in the Customizer with a new block-based editor.

You can access the Customizer Widgets Block Editor by navigating to Appearance → Customize, selecting Widgets, and then selecting a Widget Area.

The Customizer Widgets Block Editor allows you to insert blocks and widgets into the selected Widget Area. A live preview of the changes appears to the right of the editor.

## Compatibility

Widgets that were added to a Widget Area before activating Gutenberg will continue to work via the Legacy Widget block.

The Legacy Widget block allows you to edit and preview changes to a widget within the block editor.

Third party widgets registered by plugins can be inserted by adding a new Legacy Widget block.

The Widgets Block Editor stores blocks using an underlying "Block" widget that is invisible to the user. This means that plugins and themes will contibue to work normally, and that the Widgets Block Editor can be disabled without any data loss.

Themes may disable the Widgets Block Editor using `remove_theme_support( 'widgets-block-editor' )`.

Users may disable the Widgets Block Editor by installing the [Classic Widgets plugin](https://wordpress.org/plugins/classic-widgets/).
