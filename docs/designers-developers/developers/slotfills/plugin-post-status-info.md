# PluginPostStatusInfo

This slots allows for the insertion of items in the Status & visibility panel of the document sidebar.

## Example

```js
const { registerPlugin } = wp.plugins;
const { PluginPostStatusInfo } = wp.editPost;


const PluginPostStatusInfoTest = () => {
	return(
		<PluginPostStatusInfo>
			<p>Post Status Info SlotFill</p>
		</PluginPostStatusInfo>
	)
}

registerPlugin( 'post-status-info-test', { render: PluginPostStatusInfoTest } );
```

## Location

![Location in the Status & visibility panel](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/assets/plugin-post-status-info-location.png?raw=true)

