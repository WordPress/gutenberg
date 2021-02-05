# HStack

`HStack` (Horizontal Stack) arranges child elements in a horizontal line.

## Usage

`HStack` can render anything inside.

```jsx 
function Example() {
	return (
		<HStack>
			<View css={ [ ui.background.blue ] }>
				<Text>Ana</Text>
			</View>
			<View css={ [ ui.background.blue ] }>
				<Text>Elsa</Text>
			</View>
			<View css={ [ ui.background.blue ] }>
				<Text>Olaf</Text>
			</View>
		</HStack>
	);
}
```

## Props

##### alignment

**Type**: `HStackAlignment` | `CSS[ 'alignItems' ]`

Determines how the child elements are aligned.

-   `top`: Aligns content to the top.
-   `topLeft`: Aligns content to the top/left.
-   `topRight`: Aligns content to the top/right.
-   `left`: Aligns content to the left.
-   `center`: Aligns content to the center.
-   `right`: Aligns content to the right.
-   `bottom`: Aligns content to the bottom.
-   `bottomLeft`: Aligns content to the bottom/left.
-   `bottomRight`: Aligns content to the bottom/right.
-   `edge`: Aligns content to the edges of the container.
-   `stretch`: Stretches content to the edges of the container.

##### direction

**Type**: `FlexDirection`

The direction flow of the children content can be adjusted with `direction`. `column` will align children vertically and `row` will align children horizontally.

##### expanded

**Type**: `boolean`

Expands to the maximum available width (if horizontal) or height (if vertical).

##### justify

**Type**: `CSS['justifyContent']`

Horizontally aligns content if the `direction` is `row`, or vertically aligns content if the `direction` is `column`.
In the example below, `flex-start` will align the children content to the left.

##### spacing

**Type**: `CSS['width']`

The amount of space between each child element. Spacing in between each child can be adjusted by using `spacing`.
The value of `spacing` works as a multiplier to the library's grid system (base of `4px`).

##### wrap

**Type**: `boolean`

Determines if children should wrap.

## Spacer

When a `Spacer` is used within an `HStack`, the `Spacer` adaptively expands to take up the remaining space.

```jsx live
import { HStack, Spacer, Text, View } from '@wp-g2/components';
import { ui } from '@wp-g2/styles';

function Example() {
	return (
		<HStack>
			<View css={[ui.background.blue]}>
				<Text>Ana</Text>
			</View>
			<Spacer css={[ui.background.blue]}>
				<Text>Elsa</Text>
			</Spacer>
			<View css={[ui.background.blue]}>
				<Text>Olaf</Text>
			</View>
		</HStack>
	);
}
```

`Spacer` also be used in-between items to push them apart.

```jsx live
import { HStack, Spacer, Text, View } from '@wp-g2/components';
import { ui } from '@wp-g2/styles';

function Example() {
	return (
		<HStack>
			<View css={[ui.background.blue]}>
				<Text>Ana</Text>
			</View>
			<Spacer />
			<View css={[ui.background.blue]}>
				<Text>Elsa</Text>
			</View>
			<View css={[ui.background.blue]}>
				<Text>Olaf</Text>
			</View>
		</HStack>
	);
}
```

