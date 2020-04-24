# Flex

Flex is a layout-based components, which provides a convenient way to align user-interfaces.

## Usage

```jsx
import { __experimentalFlex as Flex } from '@wordpress/components';
import { Icon, wordpress } from '@wordpress/icons';

const Example = () => {
	return (
		<Flex>
			<Flex.Item>
				<Icon icon={ wordpress } />
			</Flex.Item>
			<Flex.Block>
				<h2>WordPress</h2>
			</Flex.Block>
		</Flex>
	);
};
```

## Sub-Components

This component provides a collection of sub-component that can be used to compose various interfaces.

### `Flex.Block`

A layout component that expands to fit the remaining space of `Flex`.

### `Flex.Item`

A layout component to contain items of a fixed width within `Flex`.

## Props

### align

Vertically aligns children components using the CSS [`align-items`](https://developer.mozilla.org/en-US/docs/Web/CSS/align-items) property.

-   Type: `String`
-   Required: No
-   Default: `center`

### gap

Determines the spacing in between children components. The `gap` value is a multiplier to the base value of `4`.

-   Type: `Number`
-   Required: No
-   Default: `2`

### isReversed

Reverses the render order of children components.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

### justify

Horizontally aligns children components using the CSS [`justify-content`](https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content) property.

-   Type: `String`
-   Required: No
-   Default: `space-between`
