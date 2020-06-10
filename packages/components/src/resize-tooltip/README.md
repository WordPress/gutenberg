# ResizeTooltip

ResizeTooltip displays the dimensions of an element whenever the width or height of the element changes.

## Usage

```jsx
import { ResizeTooltip } from '@wordpress/components';

const Example = () => {
	return (
		<div style={ { position: 'relative' } }>
			<ResizeTooltip />
			...
		</div>
	);
};
```

Be sure that the parent element containing `<ResizeTooltip />` has the `position` style property defined. This is important as `<ResizeTooltip />` uses `position` based techniques to determine size changes.

### Variants

`<ResizeTooltip />` has two style variants;

-   `cursor`
-   `corner`

##### `cursor`

The `cursor` variant (default) renders the dimensions label right above the mosuse cursor.

##### `corner`

The `corner` variant renders the dimensions label in the top-right corner of the (parent) element.

    	fadeTimeout = 180,
    	labelRef,

## Props

### axis

Limits the label to render corresponding to the axis. By default, the label will automatically render based on both `x` and `y` changes.

-   Type: `String`
-   Required: No
-   Values: `x` | `y`

### fadeTimeout

Duration (in `ms`) before the label disappears after resize event.

-   Type: `Number`
-   Required: No
-   Default: `180`

### isEnabled

Determines if the label can render.

-   Type: `Boolean`
-   Required: No
-   Default: `true`

### labelRef

Callback [Ref](https://reactjs.org/docs/forwarding-refs.html) for the label element.

-   Type: `Function`
-   Required: No

### onMove

Callback function when the (observed) element resizes, specifically with a `mousemove` based event.

-   Type: `Function`
-   Required: No

### onResize

Callback function when the (observed) element resizes.

-   Type: `Function`
-   Required: No

### showPx

Renders a `PX` unit suffix after the width or height value in the label.

-   Type: `Boolean`
-   Required: No
-   Default: `true`

### variant

The style variant for the label.

-   Type: `String`
-   Required: No
-   Default: `cursor`
-   Values: `corner` |`cursor`

### zIndex

The `z-index` style property for the label.

-   Type: `Number`
-   Required: No
-   Default: `1000`
