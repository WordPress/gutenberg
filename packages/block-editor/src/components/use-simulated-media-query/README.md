# useSimulatedMediaQuery

Manipulates stylesheet media queries to simulate a given viewport width that may not necessarily match the current device. That is, you can simulate tablet media queries while on a desktop device.

The simulation works by enabling or disabling particular media queries based upon a given size. That is, if you set the size to be `600px` then it will enable all media queries that
are applied to a `600px` breakpoint, and will disable those that aren't.

Queries are only modified if they are present within a section of CSS that is contained within a start and end marker. See Setup below.

The original media queries are restored once the simulated query is no longer needed.

Note that this is currently experimental, and is available as `__experimentalUseSimulatedMediaQuery`.

## Table of contents

1. [Development guidelines](#development-guidelines)

## Development guidelines

### Usage

The function monitors the `width` value and updates media queries that match that width.

```jsx
import { __experimentalUseSimulatedMediaQuery as useSimulatedMediaQuery } from '@wordpress/block-editor';

function SimulatedTabletContainer() {
	useSimulatedMediaQuery( 'resizable-section', 780 );

	return (
		<div className="simulated-container">
			Your content
		</div>
	)
}
```

This should be matched with CSS:

```css
#start-resizable-section {
	display: none;
}

@media (min-width: 600px) {
	.simulated-container {
		background-color: blue;
	}
}

@media (min-width: 780px) {
	.simulated-container {
		background-color: red;
	}
}

#end-resizable-section {
	display: none;
}
```

## Props

The functions accepts the following props.

### marker

The unique marker name for the section of CSS where queries are modified. The marker name should be a valid CSS identifier, and it is used to generated the actual CSS identifier for the start and end of the modifiable CSS.

Note: the start CSS identifier will be `#start-<marker>` and the end will be `#end-<marker>`

-  Type: `String`
-  Required: Yes

### width

The current media query width. Media queries that match this width are enabled, and all other queries are disabled.

-   Type: `Number`
-   Required: Yes

## Related components

This is typically used with [`useResizeCanvas`](https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/use-resize-canvas/README.md) to adjust a container to a known device  width.
