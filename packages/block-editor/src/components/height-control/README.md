# Height Control

The `HeightControl` component adds a linked unit control and slider component for controlling the height of a block within the block editor. It supports passing a label, and is used for controlling the minimum height dimensions of Group blocks.

_Note:_ It is worth noting that the minimum height option is an opt-in feature. Themes need to declare support for it before it'll be available, and a convenient way to do that is via opting in to the [appearanceTools](/docs/how-to-guides/themes/theme-json/#opt-in-into-ui-controls) UI controls.

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Renders the markup for height control component, to be used in the block inspector.

```jsx
import { HeightControl } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

const MyLineHeightControl = () => (
	const [ value, setValue ] = useState();
	<HeightControl
		label={ 'My Height Control' }
		onChange={ setValue }
		value={ value }
	/>
);
```

### Props

#### `value`

-   **Type:** `String` or `Number` or `Undefined`

The value of the current height.

#### `onChange`

-   **Type:** `Function`

A callback function that handles the application of the height value.

#### `label`

-   **Type:** `String`
-   **Default:** `'Height'`

A label for the height control. This is useful when using the height control for a feature that is controlled in the same way as height, but requires a different label. For example, "Min. height".

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
