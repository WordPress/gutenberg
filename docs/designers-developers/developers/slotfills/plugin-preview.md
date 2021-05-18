# PluginPreview

Renders the main content area when that menu item is chosen.

It is designed to be used alongside the `PluginPreviewMenuItem` that adds a custom menu item to the "Preview" menu.

## Available Props

-   **previewId** `string`: A string identifying the preview. Must match across `PluginPreviewMenuItem` and `PluginPreview`.

## Example

```js
import { registerPlugin } from '@wordpress/plugins';
import { PluginPreview, PluginPreviewMenuItem } from '@wordpress/block-editor';
import { external } from '@wordpress/icons';

const PluginPreviewTest = () => (
		<>
			<PluginPreviewMenuItem previewId="preview-custom-1">
				Custom preview 1
			</PluginPreviewMenuItem>
			<PluginPreview previewId="preview-custom-1">
				<div>
					<h1>Custom Preview 1 Content</h1>
				</div>
			</PluginPreview>

			<PluginPreviewMenuItem
					previewId="preview-custom-2"
					onClick={ ( event ) => console.log( event ) }
			>
				Custom preview 2
			</PluginPreviewMenuItem>
			<PluginPreview previewId="preview-custom-2">
				<div>
					<h1>Custom Preview 2 Content</h1>
				</div>
			</PluginPreview>

			<PluginPreviewMenuItem
					icon={ external }
					onClick={ ( event ) => console.log( event ) }
			>
				Custom action (no preview)
			</PluginPreviewMenuItem>
		</>
);

registerPlugin( 'plugin-preview-test', {
	render: PluginPreviewTest,
} );
```
