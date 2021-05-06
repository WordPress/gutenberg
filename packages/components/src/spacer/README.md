# Spacer

`Spacer` is a primitive layout component that providers inner (`padding`) or outer (`margin`) space in-between components. It can also be used to adaptively provide space within an `HStack` or `VStack`.

## Table of contents

## Usage

`Spacer` comes with a bunch of shorthand props to adjust `margin` and `padding`. The values of these props work as a multiplier to the library's grid system (base of `4px`).

```jsx
import {
	__experimentalSpacer as Spacer,
	__experimentalHeading as Heading,
	__experimentalView as View
} from '@wordpress/components';

function Example() {
	return (
		<View>
			<Spacer>
				<Heading>WordPress.org</Heading>
			</Spacer>
			<Text>
				Code is Poetry
			</Text>
		</View>
	);
}
```

## Props

##### m

**Type**: `number`

Adjusts all margins.

##### mb

**Type**: `number`

Adjusts bottom margins.

##### ml

**Type**: `number`

Adjusts left margins.

##### mr

**Type**: `number`

Adjusts right margins.

##### mt

**Type**: `number`

Adjusts top margins.

##### mx

**Type**: `number`

Adjusts left and right margins.

##### my

**Type**: `number`

Adjusts top and bottom margins.

##### p

**Type**: `number`

Adjusts all padding.

##### pb

**Type**: `number`

Adjusts bottom padding.

##### pl

**Type**: `number`

Adjusts left padding.

##### pr

**Type**: `number`

Adjusts right padding.

##### pt

**Type**: `number`

Adjusts top padding.

##### px

**Type**: `number`

Adjusts left and right padding.

##### py

**Type**: `number`

Adjusts top and bottom padding.
