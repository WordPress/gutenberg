# CardBody

`CardBody` renders an optional content area for a [`Card`](../card/README.md). Multiple `CardBody` components can be used within `Card` if needed.

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

Note: This component is connected to [`Card`'s Context](../card/README.md#context). Passing the `size` prop directly to this component will override the value derived from context.

### `isScrollable`: `boolean`

Determines if the component is scrollable.

-   Required: No
-   Default: `true`

### `isShady`: `boolean`

Renders with a light gray background color.

-   Required: No
-   Default: `false`

### `size`: `string`

Determines the amount of padding within the component.

- Required: No
- Default: `medium`
- Allowed values: `none`, `xSmall`, `small`, `medium`, `large`
