# ZStack

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

## Usage

`ZStack` allows you to stack things along the Z-axis.

```jsx
import { __experimentalZStack as ZStack } from '@wordpress/components';

function Example() {
	return (
		<ZStack offset={ 20 } isLayered>
			<ExampleImage />
			<ExampleImage />
			<ExampleImage />
		</ZStack>
	);
}
```

## Props

### `isLayered`: `boolean`

Layers children elements on top of each other (first: highest z-index, last: lowest z-index).

-   Required: No
-   Default: `true`

### `isReversed`: `boolean`

Reverse the layer ordering (first: lowest z-index, last: highest z-index).

-   Required: No
-   Default: `false`

### `offset`: `number`

The amount of space between each child element. Its value is automatically inverted (i.e. from positive to negative, and viceversa) when switching from LTR to RTL.

-   Required: No
-   Default: `0`

### `children`: `ReactNode`

The children to stack.

-   Required: Yes
