# PluginPostPublishPanel

This slot allows for injecting items into the bottom of the post-publish panel that appears after a post is published.

## Example

```js
const { registerPlugin } = wp.plugins;
const { PluginPostPublishPanel } = wp.editPost;

const PluginPostPublishPanelTest = () => {
	return (
		<PluginPostPublishPanel>
			<p> Post Publish Panel </p>
		</PluginPostPublishPanel>
	)
}

registerPlugin( 'post-publish-panel-test', { render: PluginPostPublishPanelTest } );

```
## Location

![post publish panel](../../assets/plugin-post-publish-panel.png?raw=true)

[Back to SlotFills](../)
