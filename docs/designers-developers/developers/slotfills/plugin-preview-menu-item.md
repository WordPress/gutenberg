# PluginPreviewMenuItem

Adds a menu item to the "Preview" menu.

It is designed to be used alongside the `PluginPreview` that renders a custom preview instead of the `VisualEditor` in the block editor.

The presence of the `PluginPreview` component is not necessary.
Selecting a preview will not replace the `VisualEditor` with a custom preview in such a case.
Instead, a plugin author may rely on the `onClick` event handler entirely.

## Available Props

-   **previewId** `string`: A string identifying the preview. When used, must match across `PluginPreviewMenuItem` and `PluginPreview`.
-   **icon** `(string|Element)`: The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug string, or an SVG WP element.
-   **onClick** `Function`: Click handler, e.g. for previews that do not register slot fills.

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
