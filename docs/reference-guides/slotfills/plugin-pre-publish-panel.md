# PluginPrePublishPanel

This slot allows for injecting items into the bottom of the pre-publish panel that appears to confirm publishing after the user clicks "Publish".

<div class="callout callout-info">
`PluginPrePublishPanel` was moved from the `@wordpress/edit-post` package to `@wordpress/editor` in Gutenberg 18.1 (to be included in WordPress 6.6). The deprecated export will be removed with WordPress 6.8.
</div>

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

![Prepublish panel](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/plugin-pre-publish-panel.png?raw=true)
