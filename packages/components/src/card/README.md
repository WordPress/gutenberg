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

Name | Type | Default | Description
--- | --- | --- | ---
`isBorderless` | `boolean` | `false` | Determines the border style of the card.
`isElevated` | `boolean` | `false` | Determines the elevation style of the card.
`padding` | `string` | `medium` | Determines the amount of padding within the card.

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
		</CardBody>
		<CardDivider />
		<CardBody>
			...
		</CardBody>
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

`<Card />`'s sub-components are connected to `<Card />` using [Context](https://reactjs.org/docs/context.html). Certain props like `padding` and `variant` are passed through to the sub-components.

In the following example, the `<CardBody />` will render with a padding of `small`:

```jsx
import { Card, CardBody } from '@wordpress/components';

const Example = () => (
	<Card padding="small">
		<CardBody>...</CardBody>
	</Card>
);
```

These sub-components are designed to be flexible. The Context props can be overridden by the sub-component(s) as required. In the following example, the last `<CardBody />` will render it's specified padding:

```jsx
import { Card, CardBody } from '@wordpress/components';

const Example = () => (
	<Card padding="small">
		<CardBody>...</CardBody>
		<CardBody>...</CardBody>
		<CardBody padding="large">...</CardBody>
	</Card>
);
```
