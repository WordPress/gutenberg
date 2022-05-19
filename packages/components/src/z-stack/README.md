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

When `true`, the children are stacked on top of each other. When `false`, the children follow the normal flow of the layout. Defaults to `true`.

### `isReversed`: `boolean`

Reverse the layer ordering. When `true`, the first child has the lowest `z-index` and the last child has the highest `z-index`. When `false`, the first child has the highest `z-index` and the last child has the lowest `z-index`. Defaults to `false`.

### `offset`: `number`

The amount of space between each child element. Defaults to `0`. Its value is automatically inverted (i.e. from positive to negative, and viceversa) when switching from LTR to RTL.

### `children`: `ReactNode`

The children to stack.
