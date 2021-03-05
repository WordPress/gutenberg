# Flex

Flex is a layout-based component, which provides a convenient way to align user-interfaces.

## Usage

```jsx
import { Flex, FlexItem, FlexBlock } from '@wordpress/components';
import { Icon, wordpress } from '@wordpress/icons';

const Example = () => {
	return (
		<Flex>
			<FlexItem>
				<Icon icon={ wordpress } />
			</FlexItem>
			<FlexBlock>
				<h2>WordPress</h2>
			</FlexBlock>
		</Flex>
	);
};
```

The most common use-case for `<Flex />` would be to automatically align two (or more) child items of varying sizes. By default, `<Flex />` would vertically center align them, and evenly spread the inner content horizontally, starting at the edges.

Child items can be added directly. However, it is recommended that they are wrapped with `<FlexItem />` (which helps normalize layout styles).

![Flex aligning and distributing 2 items of varying heights](https://make.wordpress.org/design/files/2020/06/flex-2-items.png)

Adding more than 2 child items will spread them across with even gaps in between each item.

![Flex aligning 3 items](https://make.wordpress.org/design/files/2020/06/flex-3-items.png)

### Items and Blocks

`<Flex />` provides 2 sub-components:

-   `<FlexItem />`
-   `<FlexBlock />`

These components can be used in combination to achieve flexible adaptive layouts.

`<FlexBlock />` components will grow their widths to take up the remaining space within the `<Flex />` wrapper.

![Flex item with block](https://make.wordpress.org/design/files/2020/06/flex-item-block.png)

`<Flex />` automatically provides "gap" spacing in-between all child items. This value can be adjusted using the `gap` component prop.

`<FlexItem />` and `<FlexBlock />` can be used in combination.

![Multiple Flex items with Flex block](https://make.wordpress.org/design/files/2020/06/flex-item-block-item.png)

## Sub-Components

This component provides a collection of sub-component that can be used to compose various interfaces.

### `FlexBlock`

A layout component that expands to fit the remaining space of `Flex`.

### `FlexItem`

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
