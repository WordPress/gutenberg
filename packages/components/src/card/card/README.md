# Card

`Card` provides a flexible and extensible content container.

## Usage

`Card` also provides a convenient set of [sub-components](#sub-components) such as `CardBody`, `CardHeader`, `CardFooter`, and more (see below).

```jsx
import {
	Card,
	CardHeader,
	CardBody,
	CardFooter,
	__experimentalText as Text,
	__experimentalHeading as Heading,
} from '@wordpress/components';

function Example() {
	return (
		<Card>
			<CardHeader>
				<Heading level={ 4 }>Card Title</Heading>
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

Size of the elevation shadow, based on the Style system's elevation system. This may be helpful in highlighting certain content. For more information, check out [`Elevation`](/packages/components/src/elevation/README.md).

- Required: No
- Default: `0`

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
- Allowed values: `xSmall`, `small`, `medium`, `large`

### Inherited props

`Card` also inherits all of the [`Surface` props](/packages/components/src/surface/README.md#props).

## Sub-Components

This component provides a collection of sub-component that can be used to compose various interfaces.

-   [`<CardBody />`](/packages/components/src/card/card-body/README.md)
-   [`<CardDivider />`](/packages/components/src/card/card-divider/README.md)
-   [`<CardFooter />`](/packages/components/src/card/card-footer/README.md))
-   [`<CardHeader />`](/packages/components/src/card/card-header/README.md))
-   [`<CardMedia />`](/packages/components/src/card/card-media/README.md))

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
		<CardFooter>...</CardFooter>
	</Card>
);
```

### Context

`<Card />`'s sub-components are connected to `<Card />` using [Context](https://react.dev/learn/passing-data-deeply-with-context). Certain props like `size` and `isBorderless` are passed through to some of the sub-components.

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
