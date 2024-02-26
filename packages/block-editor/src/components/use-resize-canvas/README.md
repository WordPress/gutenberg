# useResizeCanvas

This React hook generates inline CSS suitable for resizing a container to fit a device's dimensions. It adjusts the CSS according to the current device dimensions.

On-page CSS media queries are also updated to match the width of the device.

Note that this is currently experimental, and is available as `__experimentalUseResizeCanvas`.

## Development guidelines

### Usage

The hook returns a style object which can be applied to a container. It is passed the current device type, which can be obtained from `getDeviceType`.

```jsx
import { __experimentalUseResizeCanvas as useResizeCanvas } from '@wordpress/block-editor';

function ResizedContainer() {
	const deviceType = useSelect( ( select ) => {
		return select( 'core/editor' ).getDeviceType();
	}, [] );
	const inlineStyles = useResizeCanvas( deviceType );

	return <div style={ resizeStyles }>Your content</div>;
}
```

## Props

The hook accepts the following props.

### deviceType

The type of device the container is rendered into. Accepted values are: `Mobile`, `Tablet`, and `Desktop`.

-   Type: `String`
-   Required: Yes
