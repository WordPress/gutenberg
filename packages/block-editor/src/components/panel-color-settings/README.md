# PanelColorSettings

`PanelColorSettings` is a React component that renders a UI for managing various color settings.
It is essentially a wrapper around the `PanelColorGradientSettings` component, but specifically disables the gradient features.

## Usage

```jsx
/**
 * External dependencies
 */
import { useState } from 'react';

/**
 * WordPress dependencies
 */
import { PanelColorSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

// ...

const MyPanelColorSettings = () => {
	const [ textColor, setTextColor ] = useState( { color: '#000' } );
	const [ backgroundColor, setBackgroundColor ] = useState( {
		color: '#fff',
	} );
	const [ overlayTextColor, setOverlayTextColor ] = useState( {
		color: '#000',
	} );
	const [ overlayBackgroundColor, setOverlayBackgroundColor ] = useState( {
		color: '#eee',
	} );

	return (
		<PanelColorSettings
			__experimentalIsRenderedInSidebar
			title={ __( 'Color' ) }
			colorSettings={ [
				{
					value: textColor.color,
					onChange: setTextColor,
					label: __( 'Text' ),
				},
				{
					value: backgroundColor.color,
					onChange: setBackgroundColor,
					label: __( 'Background' ),
				},
				{
					value: overlayTextColor.color,
					onChange: setOverlayTextColor,
					label: __( 'Submenu & overlay text' ),
				},
				{
					value: overlayBackgroundColor.color,
					onChange: setOverlayBackgroundColor,
					label: __( 'Submenu & overlay background' ),
				},
			] }
		/>
	);
};

/// ...

<MyPanelColorSettings />;
```

## Props

The component accepts the following props:

### colorSettings

A user-provided set of color settings.

- Type: `Array`
- Required: No

Colors settings are provided as an array of objects with the following schema:

| Property | Description                       | Type     |
| -------- | --------------------------------- | -------- |
| value    | The current color of the setting  | string   |
| onChange | Callback on change of the setting | Function |
| label    | Label of the setting              | string   |

Additionally, the following `PanelColorGradientSettings` props are supported and directly passed down to the underlying `PanelColorGradientSettings` instance:

- `className` - added to the underlying `ToolsPanel` instance.
- `colors` - array of colors to be used.
- `gradients` - not recommended to be used since `PanelColorSettings` resets it.
- `disableCustomColors` - whether addition of custom colors is enabled
- `disableCustomGradients` - not recommended to be used since `PanelColorSettings` sets it.
- `children` - displayed below the underlying `PanelColorGradientSettings` instance.
- `settings` - not recommended to be used, since `PanelColorSettings` builds it from the `colorSettings` prop.
- `title` - title of the underlying `ToolsPanel`.
- `showTitle` - whether to show the title of the `ToolsPanel`.
- `__experimentalIsRenderedInSidebar`
- `enableAlpha` - whether to enable setting opacity when specifying a color.

Please refer to the `PanelColorGradientSettings` component for more information.
