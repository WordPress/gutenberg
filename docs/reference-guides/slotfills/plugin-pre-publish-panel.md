# PluginPrePublishPanel

This slot allows for injecting items into the bottom of the pre-publish panel that appears to confirm publishing after the user clicks "Publish".

## Example

```js
import { registerPlugin } from '@wordpress/plugins';
import { PluginPrePublishPanel } from '@wordpress/editor';

const PluginPrePublishPanelTest = () => (
	<PluginPrePublishPanel>
		<p>Pre Publish Panel</p>
	</PluginPrePublishPanel>
);

registerPlugin( 'pre-publish-panel-test', {
	render: PluginPrePublishPanelTest,
} );
```

## Location

![Prepublish panel](https://developer.wordpress.org/files/2026/06/plugin-pre-publish-panel.png)
