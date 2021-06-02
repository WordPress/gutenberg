# Card

`Card` provides a flexible and extensible content container.

## Usage

`Card` also provides a convenient set of [sub-components](#sub-components) such as `CardBody`, `CardHeader`, `CardFooter`, and more (see below).

```jsx live
import {
	Card,
	CardHeader,
	CardBody,
	CardFooter,
	Text,
	Heading,
} from '@wordpress/components';

function Example() {
	return (
		<Card>
			<CardHeader>
				<Heading size={ 4 }>Card Title</Heading>
			</CardHeader>
			<CardBody>
				<Text>Card Content</Text>
			</CardBody>
			<CardFooter>
				<Text>Card Footer</Text>
			</CardFooter>
		</Card>
	);
}
```

## Props

### `elevation`: `number`

Size of the elevation shadow, based on the Style system's elevation system.
Elevating a `Card` can be done by adjusting the `elevation` prop. This may be helpful in highlighting certain content. For more information, check out `Elevation`.

- Required: No
- Default: `2`

### `isBorderless`: `boolean`

Renders without a border.

- Required: No
- Default: `false`

### `isRounded`: `boolean`

Renders with rounded corners.

- Required: No
- Default: `true`

### `size`: `string`

Determines the amount of padding within the component.

- Required: No
- Default: `medium`
- Allowed values: `none`, `xSmall`, `small`, `medium`, `large`

### Inherited props

`Card` also inherits all of the [`Surface` props](../../ui/surface/README.md#props).

## Sub-Components

This component provides a collection of sub-component that can be used to compose various interfaces.

-   [`<CardBody />`](../card-body/README.md)
-   [`<CardDivider />`](../card-divider/README.md)
-   [`<CardFooter />`](../card-footer/README.md))
-   [`<CardHeader />`](../card-header/README.md))
-   [`<CardMedia />`](../card-media/README.md))

### Sub-Components Example

```jsx
import {
	Card,
	CardBody,
	CardDivider,
	CardFooter,
	CardHeader,
	CardMedia,
} from '@wordpress/components';

const Example = () => (
	<Card>
		<CardHeader>...</CardHeader>
		<CardBody>...</CardBody>
		<CardDivider />
		<CardBody>...</CardBody>
		<CardMedia>
			<img src="..." />
		</CardMedia>
		<CardHeader>...</CardHeader>
	</Card>
);
```

### Context

`<Card />`'s sub-components are connected to `<Card />` using [Context](https://reactjs.org/docs/context.html). Certain props like `size` and `isBorderless` are passed through to some of the sub-components.

In the following example, the `<CardBody />` will render with a size of `small`:

```jsx
import { Card, CardBody } from '@wordpress/components';

const Example = () => (
	<Card size="small">
		<CardBody>...</CardBody>
	</Card>
);
```

These sub-components are designed to be flexible. The Context props can be overridden by the sub-component(s) as required. In the following example, the last `<CardBody />` will render it's specified size:

```jsx
import { Card, CardBody } from '@wordpress/components';

const Example = () => (
	<Card size="small">
		<CardBody>...</CardBody>
		<CardBody>...</CardBody>
		<CardBody size="large">...</CardBody>
	</Card>
);
```
