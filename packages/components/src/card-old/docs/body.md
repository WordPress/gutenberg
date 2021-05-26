# CardBody

CardBody renders an optional content area for a [`<Card />`](../).

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

Note: This component is connected to [`<Card />`'s Context](../README.md#context). Passing props directly to this component will override the props derived from context.
