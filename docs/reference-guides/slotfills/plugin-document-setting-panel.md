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
import { PluginDocumentSettingPanel } from '@wordpress/editor';

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

Core and custom panels can be accessed programmatically using their panel name. The core panel names are:

-   Summary Panel: `post-status`
-   Categories Panel: `taxonomy-panel-category`
-   Tags Panel: `taxonomy-panel-post_tag`
-   Featured Image Panel: `featured-image`
-   Excerpt Panel: `post-excerpt`
-   DiscussionPanel: `discussion-panel`

Custom panels are namespaced with the plugin name that was passed to `registerPlugin`.
In order to access the panels using function such as `toggleEditorPanelOpened` or `toggleEditorPanelEnabled` be sure to prepend the namespace.

To programmatically toggle panels, use the following:

```js
import { useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

const Example = () => {
	const { toggleEditorPanelOpened } = useDispatch( editorStore );
	return (
		<Button
			variant="primary"
			onClick={ () => {
				// Toggle the Summary panel
				toggleEditorPanelOpened( 'post-status' );

				// Toggle the Custom Panel introduced in the example above.
				toggleEditorPanelOpened(
					'plugin-document-setting-panel-demo/custom-panel'
				);
			} }
		>
			Toggle Panels
		</Button>
	);
};
```

It is also possible to remove panels from the admin using the `removeEditorPanel` function by passing the name of the registered panel.

```js
import { useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

const Example = () => {
	const { removeEditorPanel } = useDispatch( editorStore );
	return (
		<Button
			variant="primary"
			onClick={ () => {
				// Remove the Featured Image panel.
				removeEditorPanel( 'featured-image' );

				// Remove the Custom Panel introduced in the example above.
				removeEditorPanel(
					'plugin-document-setting-panel-demo/custom-panel'
				);
			} }
		>
			Toggle Panels
		</Button>
	);
};
```
