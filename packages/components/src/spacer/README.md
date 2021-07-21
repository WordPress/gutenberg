# Spacer

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Spacer` is a primitive layout component that providers inner (`padding`) or outer (`margin`) space in-between components. It can also be used to adaptively provide space within an `HStack` or `VStack`.

## Table of contents

## Usage

`Spacer` comes with a bunch of shorthand props to adjust `margin` and `padding`. The values of these props work as a multiplier to the library's grid system (base of `4px`).

```jsx
import {
	__experimentalSpacer as Spacer,
	__experimentalHeading as Heading,
	__experimentalView as View,
} from '@wordpress/components';

function Example() {
	return (
		<View>
			<Spacer>
				<Heading>WordPress.org</Heading>
			</Spacer>
			<Text>Code is Poetry</Text>
		</View>
	);
}
```

## Props

##### margin

**Type**: `number`

Adjusts all margins.

##### marginBottom

**Type**: `number`

Adjusts bottom margins.

##### marginLeft

**Type**: `number`

Adjusts left margins.

##### marginRight

**Type**: `number`

Adjusts right margins.

##### marginTop

**Type**: `number`

Adjusts top margins.

##### marginX

**Type**: `number`

Adjusts left and right margins.

##### marginY

**Type**: `number`

Adjusts top and bottom margins.

##### padding

**Type**: `number`

Adjusts all padding.

##### paddingBottom

**Type**: `number`

Adjusts bottom padding.

##### paddingLeft

**Type**: `number`

Adjusts left padding.

##### paddingRight

**Type**: `number`

Adjusts right padding.

##### paddingTop

**Type**: `number`

Adjusts top padding.

##### paddingX

**Type**: `number`

Adjusts left and right padding.

##### paddingY

**Type**: `number`

Adjusts top and bottom padding.
