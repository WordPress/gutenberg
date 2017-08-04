Popover
=======

Popover is a React component to render a floating content modal. It is similar in purpose to a tooltip, but renders content of any sort, not only simple text. It anchors itself to its parent node, optionally by a specified direction. If the popover exceeds the bounds of the page in the direction it opens, its position will be flipped automatically.

## Usage

Render a Popover within the parent to which it should anchor:

```jsx
import { Popover } from '@wordpress/components';

function ToggleButton( { isVisible, toggleVisible } ) {
	return (
		<button onClick={ toggleVisible }>
			Toggle Popover!
			<Popover
				isOpen={ isVisible }
				onClose={ toggleVisible }
				onClick={ ( event ) => event.stopPropagation() }
			>
				Popover is toggled!
			</Popover>
		</button>
	);
}
```

## Props

The component accepts the following props:

### position

The direction in which the popover should open relative to its parent node. Specify y- and x-axis as a space-separated string. Supports `"top"`, `"bottom"` y axis, and `"left"`, `"center"`, `"right"` x axis.

- Type: `String`
- Required: No
- Default: `"top center"`

### children

The content to be displayed within the popover.

- Type: `Element`
- Required: Yes

### className

An optional additional class name to apply to the rendered popover.

- Type: `String`
- Required: No
