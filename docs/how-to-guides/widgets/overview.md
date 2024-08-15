# Widgets Block Editor overview

## Widgets Block Editor

The new Widgets Editor is a WordPress feature which upgrades widget areas to allow using blocks alongside widgets. It offers a new widget management experience built using the familiar WordPress block editor.

You can access the new Widgets Editor by navigating to Appearance → Widgets or Appearance → Customize → Widgets and choose a widget area.

The Widgets Block Editor allows you to insert blocks and widgets into any of the [Widget Areas or Sidebars](https://developer.wordpress.org/themes/functionality/sidebars/) defined by the site's active theme, via a standalone editor or through the Customizer.

### Customizer Widgets Block Editor

The new Widgets Editor also replaces the Widgets section in the Customizer with the new block-based editor.

You can access the Customizer Widgets Block Editor by navigating to Appearance → Customize, selecting Widgets, and then selecting a Widget Area.

Using the new Widgets Editor through the Customizer goes beyond inserting blocks and widgets into a selected Widget Area, making use of the live preview of the changes, to the right of the editor, and of all the other Customizer specific features such as scheduling and sharing changes.

## Compatibility

Widgets that were added to a Widget Area before the new Widgets Editor will continue to work - via the Legacy Widget block.

The Legacy Widget block is the compatibility mechanism which allows us to edit and preview changes to a classic widget within the new block based Widgets Editor.

Any third party widgets registered by plugins can still be inserted in widget areas by adding and setting them up through a Legacy Widget block.

The Widgets Editor stores blocks using an underlying "Block" widget that is invisible to the user. This means that plugins and themes will continue to work normally, and that the Widgets Block Editor can be disabled without any data loss.

Themes may disable the Widgets Block Editor using `remove_theme_support( 'widgets-block-editor' )`.

Users may disable the Widgets Block Editor by installing the [Classic Widgets plugin](https://wordpress.org/plugins/classic-widgets/).
