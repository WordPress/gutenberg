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

Name | Type | Default | Description
--- | --- | --- | ---
`isShady` | `boolean` | `false` | Renders with a light gray background color.
`size` | `string` | `medium` | Determines the amount of padding within the component.

Note: This component is connected to [`<Card />`'s Context](../README.md#context). Passing props directly to this component will override the props derived from context.
