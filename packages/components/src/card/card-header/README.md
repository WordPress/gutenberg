# CardHeader

CardHeader renders an optional header within a [`<Card />`](/packages/components/src/card/card/README.md).

## Usage

```jsx
import { Card, CardHeader } from '@wordpress/components';

const Example = () => (
	<Card>
		<CardHeader>...</CardHeader>
	</Card>
);
```

### Flex

Underneath, CardHeader uses the layout component [`<Flex/>`](/packages/components/src/flex/flex/README.md). This improves the alignment of child items within the component.

```jsx
import {
	Button,
	Card,
	CardHeader,
	FlexItem,
	FlexBlock,
} from '@wordpress/components';

const Example = () => (
	<Card>
		<CardHeader>
			<FlexBlock>Content</FlexBlock>
			<FlexItem>
				<Button>Action</Button>
			</FlexItem>
		</CardHeader>
	</Card>
);
```

Check out [the documentation](/packages/components/src/flex/flex/README.md) on `<Flex/>` for more details on layout composition.

## Props

### isBorderless

Determines the border style of the card.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

### isElevated

Determines the elevation style of the card.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

### isShady

Renders with a light gray background color.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

### size

Determines the amount of padding within the component.

-   Type: `String`
-   Required: No
-   Default: `medium`

Note: This component is connected to [`<Card />`'s Context](/packages/components/src/card/card/README.md#context). Passing props directly to this component will override the props derived from context.
