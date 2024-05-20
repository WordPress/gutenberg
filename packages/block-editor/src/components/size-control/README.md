# Size Control

The `SizeControl` component adds a linked unit control and slider component for controlling the size of something within the block editor. It supports passing a label & rangeConfig, and is used for controlling the minimum size dimensions of Group blocks.

_Note:_ It is worth noting that the minimum size option is an opt-in feature. Themes need to declare support for it before it'll be available, and a convenient way to do that is via opting in to the [appearanceTools](/docs/how-to-guides/themes/global-settings-and-styles.md#opt-in-into-ui-controls) UI controls.

## Development guidelines

### Usage

Renders the markup for size control component, to be used in the block inspector.

```jsx
import { useState } from 'react';
import { SizeControl } from '@wordpress/block-editor';

const MyLineSizeControl = () => (
	const [ value, setValue ] = useState();
	<SizeControl
		label={ 'My Size Control' }
		onChange={ setValue }
		value={ value }
	/>
);
```

### Props

#### `value`

-   **Type:** `String` or `Number` or `Undefined`

The value of the current size.

#### `onChange`

-   **Type:** `Function`

A callback function that handles the application of the size value.

#### `label`

-   **Type:** `String`
-   **Default:** `'Size'`

A label for the size control. This is useful when using the size control for a feature that is controlled in the same way as size, but requires a different label. For example, "Minimum size".

#### `rangeConfig`

-   **Type:** `Object`
-   **Default:** `{}`

An object of the shape `{[key: units]:{min?: number; step?: number; max?: number}}` for overriding the min, max & step values.

#### `adaptiveRange`

-   **Type:** `boolean`
-   **Default:** `false`

This is to set the behavior when the value is out of it's specified range. When true, the min/max will adapt to the value.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
