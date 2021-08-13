# DimensionControls

Dimension controls appear under the dimensions block support panel in post
settings sidebar when a block is being edited. `DimensionControls` allow for
blocks to group their own dimensions related controls along side those provided
via block supports.

The dimensions panel is built via the `ToolsPanel` component. Block's can also
add their controls to the `ToolsPanel` menu by wrapping them in a
`ToolsPanelItem` component and providing the required callbacks.

## Usage

```js
import { DimensionsControls } from '@wordpress/block-editor';
import {
	TextControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

function MyBlockEdit( props ) {
	const { attributes, setAttributes } = props;

	return (
		<DimensionControls>
			<ToolsPanelItem
				hasValue={ () => !! attributes.myValue }
				label={ __( 'My dimension control' ) }
				onDeselect={ () => setAttributes( { myValue: undefined } ) }
				resetAllFilter={ ( newAttributes ) => ( {
					...newAttributes,
					myValue: undefined,
				} ) }
				isShownByDefault={ true }
			>
				<TextControl
					label="My dimension"
					value={ attributes.myValue }
					onChange={ ( next ) => setAttributes( { myValue: next } ) ) }
				/>
			</ToolsPanelItem>
		</DimensionControls>
	);
}
```
