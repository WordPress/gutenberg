# Scrollable

<p class="callout callout-alert">This component is deprecated. Write your own CSS instead.</p>

`Scrollable` is a layout component that puts content in a scrollable container.

## Usage

```jsx
import { __experimentalScrollable as Scrollable } from '@wordpress/components';

function Example() {
	return (
		<Scrollable style={ { maxHeight: 200 } }>
			<div style={ { height: 500 } }>...</div>
		</Scrollable>
	);
}
```

## Props

### `children`: `ReactNode`

The children elements.

-   Required: Yes

### `scrollDirection`: `string`

Renders a scrollbar for a specific axis when content overflows.

-   Required: No
-   Default: `y`
-   Allowed values: `x`, `y`, `auto`

### `smoothScroll`: `boolean`

Enables (CSS) smooth scrolling.

-   Required: No
-   Default: `false`
