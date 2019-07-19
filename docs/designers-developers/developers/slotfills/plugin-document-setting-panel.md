# PluginDocumentSettingPanel

This SlotFill allows registering a UI to edit Document settings.

## Available Props
* __name__ `string`: A string identifying the panel.
* __className__ `string`: An optional class name added to the sidebar body.
* __title__ `string`: Title displayed at the top of the sidebar.
* __icon__ `(string|Element)`: The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug string, or an SVG WP element.

## Example
```js
const { registerPlugin } = wp.plugins;
const { PluginDocumentSettingPanel } = wp.editPost;

const PluginDocumentSettingPanelDemo = () => (
	<PluginDocumentSettingPanel
		name="custom-panel"
		title="Custom Panel"
		className="custom-panel"
	>
		Custom Panel Contents
	</PluginDocumentSettingPanel>
);
registerPlugin( 'plugin-document-setting-panel-demo', { render: PluginDocumentSettingPanelDemo, icon: 'palmtree' } );
```