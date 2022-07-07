# CardFooter

`CardFooter` renders an optional footer within a [`Card`](/packages/components/src/card/card/README.md).

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

Underneath, `CardFooter` uses the [`Flex` layout component](/packages/components/src/flex/flex/README.md). This improves the alignment of child items within the component.

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

Check out [the documentation](/packages/components/src/flex/flex/README.md) on `Flex` for more details on layout composition.

## Props

Note: This component is connected to [`Card`'s Context](/packages/components/src/card/card/README.md#context). The value of the `size` and `isBorderless` props is derived from the `Card` parent component (if there is one). Setting these props directly on this component will override any derived values.

### `isBorderless`: `boolean`

Renders without a border.

- Required: No
- Default: `false`

### `isShady`: `boolean`

Renders with a light gray background color.

-   Required: No
-   Default: `false`

### `justify`: `CSSProperties[ 'justifyContent' ]`

See the documentation for the `justify` prop for the [`Flex` component](/packages/components/src/flex/flex/README.md#justify)

### `size`: `string`

Determines the amount of padding within the component.

- Required: No
- Default: `medium`
- Allowed values: `xSmall`, `small`, `medium`, `large`
