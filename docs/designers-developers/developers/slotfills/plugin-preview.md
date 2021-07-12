# PluginPreview

Renders the main content area when that menu item is chosen.

A component used to define a custom preview menu item and optional content.

The children of this component will be displayed in the main area of the
block editor, instead of the `VisualEditor` component.

The `title` and `icon` are used to populate the Preview menu item.

## Available Props

-   **children** `WPElement`: Preview content.
-   **icon** `WPIcon`: Menu item icon to be rendered.
-   **name** `string`: A unique name of the custom preview.
-   **onClick** `Function`: Menu item click handler, e.g. for previews that provide no content (`children`).
-   **title** `string`: Menu item title.

## Example

```js
import { __ } from '@wordpress/i18n';
import { PluginPreview } from '@wordpress/block-editor';
import { registerPlugin } from '@wordpress/plugins';
import { external } from '@wordpress/icons';

const PluginPreviewTest = () => (
	<>
		<PluginPreview
			name="preview-custom-1"
			title={ __( 'Custom Preview 1' ) }
		>
			<h1>
				{ __( 'Custom Preview 1 Content' ) }
			</h1>
		</PluginPreview>

		<PluginPreview
			name="preview-custom-2"
			title={ __( 'Custom Preview 2' ) }
			onClick={ ( event ) => console.log( event  ) }
		>
			<h1>
				{ __( 'Custom Preview 2 Content' ) }
			</h1>
		</PluginPreview>

		<PluginPreview
			name="custom-action"
			title={ __( 'Custom Action' ) }
			icon={ external }
			onClick={ ( event ) => console.log( event ) }
		/>
	</>
);

registerPlugin( "plugin-preview-test", {
	render: PluginPreviewTest,
} );
```
