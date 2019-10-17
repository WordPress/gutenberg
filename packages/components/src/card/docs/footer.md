# CardFooter

CardFooter renders an optional footer within a [`<Card />`](../).

## Usage

```jsx
import { Card, CardFooter } from '@wordpress/components';

const Example = () => (
	<Card>
		<CardFooter>...</CardFooter>
	</Card>
);
```

## Props

Name | Type | Default | Description
--- | --- | --- | ---
`isShady` | `boolean` | `false` | Renders with a light gray background color.
`size` | `string` | `medium` | Determines the amount of padding within the card.
`variant` | `string` | `default` | Determines the style of the card.a

Note: This component is connected to [`<Card />`'s Context](../README.md#context). Passing props directly to this component will override the props derived from context.
