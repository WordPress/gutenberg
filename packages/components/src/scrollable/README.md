# Scrollable

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Scrollable` is a layout component that content in a scrollable container.

## Usage

```jsx
import {__experimentalScrollable as Scrollable } from '@wordpress/components';

function Example() {
	return (
		<Scrollable style={ { maxHeight: 200 } }>
			<div style={ { height: 500 } }>...</div>
		</Scrollable>
	);
}
```

## Props

### `scrollDirection`: `string`

- Required: No
- Default: `y`
- Allowed values: `x`, `y`, `auto`

Renders a scrollbar for a specific axis when content overflows.

### `smoothScroll`: `boolean`

- Required: No
- Default: `false`

Enables (CSS) smooth scrolling.
