# CardHeader

`CardHeader` renders an optional header within a [`Card`](/packages/components/src/card/card/README.md).

## Usage

```jsx
import { Card, CardHeader } from '@wordpress/components';

const Example = () => (
	<Card>
 		<CardHeader>...</CardHeader>
 		<CardBody>...</CardBody>
	</Card>
);
```

## Props

Note: This component is connected to [`Card`'s Context](/packages/components/src/card/card/README.md#context). The value of the `size` and `isBorderless` props is derived from the `Card` parent component (if there is one). Setting these props directly on this component will override any derived values.

### `isBorderless`: `boolean`

Renders without a border.

- Required: No
- Default: `false`

### `isShady`: `boolean`

Renders with a light gray background color.

-   Required: No
-   Default: `false`

### `size`: `string`

Determines the amount of padding within the component.

- Required: No
- Default: `medium`
- Allowed values: `xSmall`, `small`, `medium`, `large`
