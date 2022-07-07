# Flex

`Flex` is a primitive layout component that adaptively aligns child content horizontally or vertically. `Flex` powers components like `HStack` and `VStack`.

## Usage

`Flex` is used with any of it's two sub-components, `FlexItem` and `FlexBlock`.

```jsx
import {
	Flex,
	FlexBlock,
	FlexItem,
} from '@wordpress/components';

function Example() {
	return (
		<Flex>
			<FlexItem>
				<p>Code</p>
			</FlexItem>
			<FlexBlock>
				<p>Poetry</p>
			</FlexBlock>
		</Flex>
	);
}
```

## Props

##### align

**Type**: `CSSProperties['alignItems']`

Aligns children using CSS Flexbox `align-items`. Vertically aligns content if the `direction` is `row`, or horizontally aligns content if the `direction` is `column`.

##### direction

**Type**: `[ResponsiveCSSValue<CSSProperties['flexDirection']>]`

The direction flow of the children content can be adjusted with `direction`. `column` will align children vertically and `row` will align children horizontally.

##### expanded

**Type**: `[boolean]`

Expands to the maximum available width (if horizontal) or height (if vertical).

##### gap

**Type**: `[number | string]`

Spacing in between each child can be adjusted by using `gap`. The value of `gap` works as a multiplier to the library's grid system (base of `4px`).

##### justify

**Type**: `[CSSProperties['justifyContent']]`

Horizontally aligns content if the `direction` is `row`, or vertically aligns content if the `direction` is `column`.

##### wrap

**Type**: `[boolean]`

Determines if children should wrap.
