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

<!-- prettier-ignore -->
Name | Type | Default | Description
--- | --- | --- | ---
`size` | `string` | `md` | Determines the amount of padding within the card.
`variant` | `string` | `default` | Determines the style of the card.

## Sub-Components

This component provides a collection of sub-component that can be used to compose various interfaces.

-   [`<CardBody />`](./docs/body.md)
-   [`<CardDivider />`](./docs/divider.md)
-   [`<CardFooter />`](./docs/footer.md)
-   [`<CardHeader />`](./docs/header.md)
-   [`<CardMedia />`](./docs/media.md)

### Sub-Components Example

```jsx
import {
	Card,
	CardBody,
	CardDivider,
	CardFooter,
	CardHeader,
	CardMedia
} from '@wordpress/components';

const Example = () => (
	<Card>
		<CardHeader>
			...
		</CardHeader>
		<CardBody>
			...
		<CardBody>
		<CardDivider />
		<CardBody>
			...
		<CardBody>
		<CardMedia>
			<img src="..." />
		</CardMedia>
		<CardHeader>
			...
		</CardHeader>
	</Card>
);
```

### Context

Card's sub-components are connected to `<Card />` using [Context](https://reactjs.org/docs/context.html). Certain props like `size` and `variant` are passed through to the sub-components.

In the following example, the `<CardBody />` will render with a size of `sm`:

```jsx
import { Card, CardBody } from '@wordpress/components';

const Example = () => (
	<Card size="xs">
		<CardBody>...</CardBody>
	</Card>
);
```
