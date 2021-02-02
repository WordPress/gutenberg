# Flex

`Flex` is a primitive layout component that adaptively aligns child content horizontally or vertically. `Flex` powers components like `HStack` and `VStack`.

## Usage

`Flex` is used with any of it's two sub-components, `FlexItem` and `FlexBlock`.

```jsx live
import { Flex, FlexItem, FlexBlock, Text, View } from '@wordpress/components/ui';

function Example() {
	return (
		<Flex>
			<FlexItem>
				<View css={[ui.background.blue]}>
					<Text>Ana</Text>
				</View>
			</FlexItem>
			<FlexBlock>
				<View css={[ui.background.blue]}>
					<Text>Elsa</Text>
				</View>
			</FlexBlock>
		</Flex>
	);
}
```

## Props

##### align

**Type**: `CSS['alignItems']`

Aligns children using CSS Flexbox `align-items`. Vertically aligns content if the `direction` is `row`, or horizontally aligns content if the `direction` is `column`.

In the example below, `flex-start` will align the children content to the top.

##### direction

**Type**: `FlexDirection`

The direction flow of the children content can be adjusted with `direction`. `column` will align children vertically and `row` will align children horizontally.

```jsx live
import { Flex, Text, View } from '@wordpress/components/ui';
import { ui } from '@wp-g2/styles';

function Example() {
	return (
		<Flex direction="column">
			<View css={[ui.background.blue]}>
				<Text>Ana</Text>
			</View>
			<View css={[ui.background.blue]}>
				<Text>Elsa</Text>
			</View>
		</Flex>
	);
}
```

##### expanded

**Type**: `boolean`

Expands to the maximum available width (if horizontal) or height (if vertical).

```jsx live
import { Flex, Text, View } from '@wordpress/components/ui';
import { ui } from '@wp-g2/styles';

function Example() {
	return (
		<Flex direction="row" expanded>
			<View css={[ui.background.blue]}>
				<Text>Ana</Text>
			</View>
			<View css={[ui.background.blue]}>
				<Text>Elsa</Text>
			</View>
		</Flex>
	);
}
```

##### gap

**Type**: `number`

Spacing in between each child can be adjusted by using `gap`. The value of `gap` works as a multiplier to the library's grid system (base of `4px`).

```jsx live
import { Flex, Text, View } from '@wordpress/components/ui';
import { ui } from '@wp-g2/styles';

function Example() {
	return (
		<Flex justify="flex-start" gap={8}>
			<View css={[ui.background.blue]}>
				<Text>Ana</Text>
			</View>
			<View css={[ui.background.blue]}>
				<Text>Elsa</Text>
			</View>
		</Flex>
	);
}
```

##### justify

**Type**: `CSS['justifyContent']`

Horizontally aligns content if the `direction` is `row`, or vertically aligns content if the `direction` is `column`.
In the example below, `flex-start` will align the children content to the left.

##### wrap

**Type**: `boolean`

Determines if children should wrap.

```jsx live
import { Flex, Text, View } from '@wordpress/components/ui';
import { ui } from '@wp-g2/styles';

function Example() {
	return (
		<Flex justify="flex-start" wrap>
			<View css={[ui.background.blue, { width: 200 }]}>
				<Text>Ana</Text>
			</View>
			<View css={[ui.background.blue, { width: 200 }]}>
				<Text>Elsa</Text>
			</View>
			<View css={[ui.background.blue, { width: 200 }]}>
				<Text>Olaf</Text>
			</View>
			<View css={[ui.background.blue, { width: 200 }]}>
				<Text>Kristoff</Text>
			</View>
			<View css={[ui.background.blue, { width: 200 }]}>
				<Text>Queen Iduna</Text>
			</View>
			<View css={[ui.background.blue, { width: 200 }]}>
				<Text>King Agnarr</Text>
			</View>
			<View css={[ui.background.blue, { width: 200 }]}>
				<Text>Yelena</Text>
			</View>
		</Flex>
	);
}
```
