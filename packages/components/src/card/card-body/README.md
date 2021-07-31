# CardBody

`CardBody` renders an optional content area for a [`Card`](/packages/components/src/card/card/README.md). Multiple `CardBody` components can be used within `Card` if needed.

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

Note: This component is connected to [`Card`'s Context](/packages/components/src/card/card/README.md#context). The value of the `size` prop is derived from the `Card` parent component (if there is one). Setting this prop directly on this component will override any derived values.

### `isScrollable`: `boolean`

Determines if the component is scrollable.

-   Required: No
-   Default: `false`

### `isShady`: `boolean`

Renders with a light gray background color.

-   Required: No
-   Default: `false`

### `size`: `string`

Determines the amount of padding within the component.

- Required: No
- Default: `medium`
- Allowed values: `xSmall`, `small`, `medium`, `large`
