# PluginBlockSettingsMenuItem

Renders a new item in the block settings menu.

## Usage

```js
// Using ES5 syntax
var __ = wp.i18n.__;
var PluginBlockSettingsMenuItem = wp.blockEditor.PluginBlockSettingsMenuItem;

function doOnClick() {
	// To be called when the user clicks the menu item.
}

function MyPluginBlockSettingsMenuItem() {
	return wp.element.createElement( PluginBlockSettingsMenuItem, {
		allowedBlocks: [ 'core/paragraph' ],
		icon: 'dashicon-name',
		label: __( 'Menu item text' ),
		onClick: doOnClick,
	} );
}
```

```jsx
// Using ESNext syntax
import { __ } from '@wordpress/i18n';
import { PluginBlockSettingsMenuItem } from '@wordpress/block-editor';

const doOnClick = () => {
	// To be called when the user clicks the menu item.
};

const MyPluginBlockSettingsMenuItem = () => (
	<PluginBlockSettingsMenuItem
		allowedBlocks={ [ 'core/paragraph' ] }
		icon="dashicon-name"
		label={ __( 'Menu item text' ) }
		onClick={ doOnClick }
	/>
);
```

_Parameters_

-   _props_ `Object`: Component props.
-   _props.allowedBlocks_ `[Array]`: An array containing a list of block names for which the item should be shown. If not present, it'll be rendered for any block. If multiple blocks are selected, it'll be shown if and only if all of them are in the allowed list.
-   _props.icon_ `[WPBlockTypeIconRender]`: The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug string, or an SVG WP element.
-   _props.label_ `string`: The menu item text.
-   _props.onClick_ `Function`: Callback function to be executed when the user click the menu item.
-   _props.small_ `[boolean]`: Whether to render the label or not.
-   _props.role_ `[string]`: The ARIA role for the menu item.