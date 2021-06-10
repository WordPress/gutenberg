# Card

Card provides a flexible and extensible content container.

## Usage

```jsx
import { Card, CardBody } from '@wordpress/components';

const Example = () => (
	<Card>
		<CardBody>...</CardBody>
	</Card>
);
```

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

### size

Determines the amount of padding within the component.

-   Type: `String`
-   Required: No
-   Default: `medium`

## Sub-Components

This component provides a collection of sub-component that can be used to compose various interfaces.

-   [`<CardBody />`](../card-body/README.md)
-   [`<CardDivider />`](../card-divider/README.md)
-   [`<CardFooter />`](../card-footer/README.md)
-   [`<CardHeader />`](../card-header/README.md)
-   [`<CardMedia />`](../card-media/README.md)

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

`<Card />`'s sub-components are connected to `<Card />` using [Context](https://reactjs.org/docs/context.html). Certain props like `size` and `variant` are passed through to the sub-components.

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
