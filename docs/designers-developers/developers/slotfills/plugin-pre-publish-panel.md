# PluginPrePublishPanel

This slot allows for injecting items into the bottom of the pre-publish panel that appears to confirm publishing after the user clicks "Publish'.

## Example

```js
const { registerPlugin } = wp.plugins;
const { PluginPrePublishPanel }= wp.editPost;

const PluginPrePublishPanelTest = () => {
	return (
		<PluginPrePublishPanel>
		    <p> Pre Publish Panel </p>
		</PluginPrePublishPanel>
	)
}

registerPlugin( 'pre-publish-panel-test', { render: PluginPrePublishPanelTest } );

```

## Location

![Prepublish panel](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/assets/plugin-pre-publish-panel.png?raw=true)

