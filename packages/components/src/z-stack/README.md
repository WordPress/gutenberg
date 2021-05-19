# ZStack

> **Experimental!**

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

Layers children elements on top of each other (first: highest z-index, last: lowest z-index). Defaults to `true`.

### `isReversed`: `boolean`

Reverse the layer ordering (first: lowest z-index, last: highest z-index). Defaults to `false`.

### `offset`: `number`

The amount of space between each child element. Defaults to `0`.

### `children`: `ReactNode`

The children to stack.
