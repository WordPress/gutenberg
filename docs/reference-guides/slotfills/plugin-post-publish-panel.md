# PluginPostPublishPanel

This slot allows for injecting items into the bottom of the post-publish panel that appears after a post is published.

## Example

```js
import { registerPlugin } from '@wordpress/plugins';
import { PluginPostPublishPanel } from '@wordpress/editor';

const PluginPostPublishPanelTest = () => (
	<PluginPostPublishPanel>
		<p>Post Publish Panel</p>
	</PluginPostPublishPanel>
);

registerPlugin( 'post-publish-panel-test', {
	render: PluginPostPublishPanelTest,
} );
```

## Location

![post publish panel](https://developer.wordpress.org/files/2026/06/plugin-post-publish-panel.png)
