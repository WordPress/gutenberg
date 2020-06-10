# ResizableVisualizer

ResizableVisualizer displays the dimensions of an element whenever the width or height of the element changes.

## Usage

```jsx
import { ResizableVisualizer } from '@wordpress/components';

const Example = () => {
	return (
		<div style={ { position: 'relative' } }>
			<ResizableVisualizer />
			...
		</div>
	);
};
```

Be sure that the parent element containing `<ResizableVisualizer />` has the `position` style property defined. This is important as `<ResizableVisualizer />` uses `position` based techniques to determine size changes.

### Variants

`<ResizableVisualizer />` has two style variants;

-   `cursor`
-   `corner`

##### `cursor`

The `cursor` variant (default) renders the dimensions label right above the mouse cursor.

##### `corner`

The `corner` variant renders the dimensions label in the top-right corner of the (parent) element.

    	fadeTimeout = 180,
    	labelRef,

## Props

### fadeTimeout

Duration (in `ms`) before the label disappears after resize event.

-   Type: `Number`
-   Required: No
-   Default: `180`

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

### zIndex

The `z-index` style property for the label.

-   Type: `Number`
-   Required: No
-   Default: `1000`
