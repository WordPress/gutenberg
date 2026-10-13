# Background Image Control

The `BackgroundImageControl` component provides an interface for selecting, positioning, and configuring background images in the WordPress block editor.

_Note:_ This is an internal component. It is not exported from `@wordpress/block-editor` and is not part of the public API; it is rendered by the Global Styles [background panel](../global-styles/background-panel.jsx).

## Features

-   Upload or select a background image from the media library.
-   Adjust background position using a focal point picker.
-   Toggle background repeat and attachment properties.
-   Set background size (cover, contain, auto, or custom units).
-   Remove or replace the background image.
-   Drag and drop image uploads.

## Development guidelines

### Usage

Renders the background image controls, to be used within a `ToolsPanelItem` in the block inspector.

```jsx
import { useState } from 'react';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import BackgroundImageControl from '../background-image-control';

const MyBackgroundImageControl = () => {
	const [ style, setStyle ] = useState( {} );
	return (
		<ToolsPanel label={ 'Background' } panelId="my-panel">
			<ToolsPanelItem
				label={ 'Image' }
				panelId="my-panel"
				isShownByDefault
				hasValue={ () => !! style?.background?.backgroundImage }
				onDeselect={ () => setStyle( {} ) }
			>
				<BackgroundImageControl
					value={ style }
					onChange={ setStyle }
					settings={ {
						background: {
							backgroundImage: true,
							backgroundSize: true,
						},
					} }
				/>
			</ToolsPanelItem>
		</ToolsPanel>
	);
};
```

### Props

#### `value`

-   **Type:** `Object`

The style object the controls read from and write to. Background values live under the `background` key, for example `{ background: { backgroundImage: { url, id, title }, backgroundSize: 'cover' } }`.

#### `onChange`

-   **Type:** `Function`

A callback that receives the updated style object whenever a background property changes.

#### `inheritedValue`

-   **Type:** `Object`
-   **Default:** the `value` prop

A style object with the values inherited from global styles, used as the fallback when `value` has none. `ref` pointers within it are resolved before use.

#### `settings`

-   **Type:** `Object`

The theme settings object. The background size, position, and repeat controls are only rendered when at least one of `settings.background.backgroundSize`, `settings.background.backgroundPosition`, or `settings.background.backgroundRepeat` is enabled.

#### `defaultValues`

-   **Type:** `Object`
-   **Default:** `{}`

Default values for the background properties, used as placeholders when nothing is set.

#### `showInheritanceLabelIndicators`

-   **Type:** `Boolean`
-   **Default:** whether global styles inheritance is enabled

Whether to show the inherited-value label treatment, including the local-override affordance on the reset control.

## Utility functions

### `coordsToBackgroundPosition( value )`

Converts `FocalPointPicker` x/y values to a CSS `background-position` value.

```js
coordsToBackgroundPosition( { x: 0.5, y: 0.5 } ); // '50% 50%'
coordsToBackgroundPosition( { x: 0.5 } ); // '50% 50%' — a missing coord falls back to 0.5
coordsToBackgroundPosition( undefined ); // undefined
```

### `backgroundPositionToCoords( value )`

Converts a CSS `background-position` value to `FocalPointPicker` coordinates.

```js
backgroundPositionToCoords( '50% 50%' ); // { x: 0.5, y: 0.5 }
backgroundPositionToCoords( '50%' ); // { x: 0.5, y: 0.5 } — y falls back to x
backgroundPositionToCoords( undefined ); // { x: undefined, y: undefined }
```

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
