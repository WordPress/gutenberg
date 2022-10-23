# PluginDocumentSettingPanel

This SlotFill allows registering a UI to edit Document settings.

## Available Props

-   **name** `string`: A string identifying the panel.
-   **className** `string`: An optional class name added to the sidebar body.
-   **title** `string`: Title displayed at the top of the sidebar.
-   **icon** `(string|Element)`: The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug string, or an SVG WP element.

## Example

```js
import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';

const PluginDocumentSettingPanelDemo = () => (
	<PluginDocumentSettingPanel
		name="custom-panel"
		title="Custom Panel"
		className="custom-panel"
	>
		Custom Panel Contents
	</PluginDocumentSettingPanel>
);

registerPlugin( 'plugin-document-setting-panel-demo', {
	render: PluginDocumentSettingPanelDemo,
	icon: 'palmtree',
} );
```

## Accessing a panel programmatically

Custom panels are namespaced with the plugin name that was passed to `registerPlugin`.
In order to access the panels using function such as `wp.data.dispatch( 'core/edit-post' ).toggleEditorPanelOpened` or `wp.data.dispatch( 'core/edit-post' ).toggleEditorPanelEnabled` be sure to prepend the namespace.

To programmatically toggle the custom panel added in the example above, use the following:

```js
wp.data
	.dispatch( 'core/edit-post' )
	.toggleEditorPanelOpened(
		'plugin-document-setting-panel-demo/custom-panel'
	);
```
