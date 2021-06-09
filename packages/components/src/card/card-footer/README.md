# CardFooter

`CardFooter` renders an optional footer within a [`Card`](../card/README.md).

## Usage

```jsx
import { Card, CardFooter } from '@wordpress/components';

const Example = () => (
	<Card>
 		<CardBody>...</CardBody>
 		<CardFooter>...</CardFooter>
	</Card>
);
```

### Flex

Underneath, `CardFooter` uses the [`Flex` layout component](../../flex/flex/README.md). This improves the alignment of child items within the component.

```jsx
import {
	Button,
	Card,
	CardFooter,
	FlexItem,
	FlexBlock,
} from '@wordpress/components';

const Example = () => (
	<Card>
		<CardBody>...</CardBody>
		<CardFooter>
			<FlexBlock>Content</FlexBlock>
			<FlexItem>
				<Button>Action</Button>
			</FlexItem>
		</CardFooter>
	</Card>
);
```

Check out [the documentation](../..//flex/flex/README.md) on `Flex` for more details on layout composition.

## Props

Note: This component is connected to [`Card`'s Context](../card/README.md#context). Passing the `size` and `isBorderless` props directly to this component will override the value derived from context.

### `isBorderless`: `boolean`

Renders without a border.

- Required: No
- Default: `false`

### `isShady`: `boolean`

Renders with a light gray background color.

-   Required: No
-   Default: `false`

### `justify`: `CSSProperties[ 'justifyContent' ]`

See the documentation for the `justify` prop for the [`Flex` component](../..//flex/flex/README.md#justify)

### `size`: `string`

Determines the amount of padding within the component.

- Required: No
- Default: `medium`
- Allowed values: `xSmall`, `small`, `medium`, `large`
