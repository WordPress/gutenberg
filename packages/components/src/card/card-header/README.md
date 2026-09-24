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

### `size`: `string | object`

Determines the amount of padding within the component. Can be specified either as a single size token or as an object.

- Required: No
- Default: `medium`
- Allowed values:
-   Single size token: `none`, `xSmall`, `small`, `medium`, `large`
-   Object:

    ```ts
    {
      blockStart: 'none' |  'xSmall' | 'small' | 'medium' | 'large';
      blockEnd: 'none' | 'xSmall' | 'small' | 'medium' | 'large';
      inlineStart: 'none' | 'xSmall' | 'small' | 'medium' | 'large';
      inlineEnd: 'none' | 'xSmall' | 'small' | 'medium' | 'large';
    }
    ```
