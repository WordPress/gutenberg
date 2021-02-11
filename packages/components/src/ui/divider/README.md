# Divider

`Divider` is a primitive layout component that separates content with lists and layouts.

## Usage

```jsx
import {
	__experientalDivider as Divider,
	__experimentalView as View,
} from '@wordpress/components';

function Example() {
	return (
		<View>
			<View>One</View>
			<View>Two</View>
			<View>Three</View>
			<Divider />
			<View>Four</View>
			<View>Five</View>
		</View>
	);
}
```

## Props

##### m

**Type**: `number`,`CSS['margin']`

Adjusts the top and bottom `margin` of `Divider`.

##### mb

**Type**: `number`,`CSS['marginBottom']`

Adjusts the bottom `margin` of `Divider`.

##### mt

**Type**: `number`,`CSS['marginTop']`

Adjusts the top `margin` of `Divider`.
