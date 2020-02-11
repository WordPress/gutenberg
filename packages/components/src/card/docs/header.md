# CardHeader

CardHeader renders an optional header within a [`<Card />`](../).

## Usage

```jsx
import { Card, CardHeader } from '@wordpress/components';

const Example = () => (
	<Card>
		<CardHeader>...</CardHeader>
	</Card>
);
```

## Props

Name | Type | Default | Description
--- | --- | --- | ---
`isBorderless` | `boolean` | `false` | Determines the border style of the card.
`isElevated` | `boolean` | `false` | Determines the elevation style of the card.
`isShady` | `boolean` | `false` | Renders with a light gray background color.
`size` | `string` | `medium` | Determines the amount of padding within the component.

Note: This component is connected to [`<Card />`'s Context](../README.md#context). Passing props directly to this component will override the props derived from context.
