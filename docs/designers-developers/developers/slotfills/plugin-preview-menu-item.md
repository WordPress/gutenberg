# PluginPreviewMenuItem

This is designed to be used alongside the PluginPreview.

-   PluginPreviewMenuItem: Adds a menu item to the "Preview" menu.
-   PluginPreview: Renders the main content area when that menu item is chosen.

Each of these takes 2 props, `deviceName`, and `children`.

-   `deviceName` - A string that serves as an internal identifier for your
    preview. Must match across PluginPreviewMenuItem and PluginPreview.
-   `children` - What gets rendered in that spot.

## Example

```js
import { registerPlugin } from '@wordpress/plugins';
import { PluginPreview, PluginPreviewMenuItem } from '@wordpress/block-editor';
import { Fragment } from '@wordpress/element';

const PluginPreviewTest = () => (
	<Fragment>
		<PluginPreviewMenuItem deviceName="preview-custom-1">
			Custom Preview 1 Menu Text
		</PluginPreviewMenuItem>
		<PluginPreview deviceName="preview-custom-1">
			<div>
				<h4>Custom Preview 1 Content</h4>
			</div>
		</PluginPreview>
	</Fragment>
);

registerPlugin( 'plugin-preview-test', {
	render: PluginPreviewTest,
} );
```
