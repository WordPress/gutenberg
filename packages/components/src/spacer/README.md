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

### `children`: `ReactNode`

The children elements.

-   Required: No

### `margin`: `number`

Adjusts all margins.

-   Required: No

### `marginBottom`: `number`

Adjusts bottom margin, potentially overriding the value from the more generic `margin` and `marginY` props.

-   Required: No
-   Default: `2`

### `marginLeft`: `number`

Adjusts left margin, potentially overriding the value from the more generic `margin` and `marginX` props.

-   Required: No

### `marginRight`: `number`

Adjusts right margin, potentially overriding the value from the more generic `margin` and `marginX` props.

-   Required: No

### `marginTop`: `number`

Adjusts top margin, potentially overriding the value from the more generic `margin` and `marginY` props.

-   Required: No

### `marginX`: `number`

Adjusts left and right margins, potentially overriding the value from the more generic `margin` prop.

-   Required: No

### `marginY`: `number`

Adjusts top and bottom margins, potentially overriding the value from the more generic `margin` prop.

-   Required: No

### `padding`: `number`

Adjusts all padding.

-   Required: No

### `paddingBottom`: `number`

Adjusts bottom padding, potentially overriding the value from the more generic `padding` and `paddingY` props.

-   Required: No

### `paddingLeft`: `number`

Adjusts left padding, potentially overriding the value from the more generic `padding` and `paddingX` props.

-   Required: No

### `paddingRight`: `number`

Adjusts right padding, potentially overriding the value from the more generic `padding` and `paddingX` props.

-   Required: No

### `paddingTop`: `number`

Adjusts top padding, potentially overriding the value from the more generic `padding` and `paddingY` props.

-   Required: No

### `paddingX`: `number`

Adjusts left and right padding, potentially overriding the value from the more generic `padding` prop.

-   Required: No

### `paddingY`: `number`

Adjusts top and bottom padding, potentially overriding the value from the more generic `padding` prop.

-   Required: No
