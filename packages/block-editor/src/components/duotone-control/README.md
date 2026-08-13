# DuotoneControl

A control for applying duotone filters to media elements. It provides a dropdown menu with predefined filters and options for custom duotone settings.

## Usage

Render the component passing in the required props:

```jsx
import { useState } from '@wordpress/element';
import { DuotoneControl } from '@wordpress/block-editor';

function Example() {
    const [value, setValue] = useState('unset');

    return (
        <DuotoneControl
            id="example-duotone-control"
            colorPalette={[
                { color: '#000000', name: 'Black' },
                { color: '#FFFFFF', name: 'White' },
                { color: '#FF0000', name: 'Red' },
            ]}
            duotonePalette={[
                { colors: ['#000000', '#FFFFFF'], name: 'Grayscale' },
                { colors: ['#FF0000', '#00FF00'], name: 'Sunset' },
            ]}
            disableCustomColors={false}
            disableCustomDuotone={false}
            value={value}
            onChange={(newValue) => setValue(newValue)}
        />
    );
}
```

## Props

### `id`

-   **Type:** `string`
-   **Default:** `undefined`

An optional ID for the component instance. If not provided, an ID will be generated automatically.

### `colorPalette`

-   **Type:** `Array`
-   **Default:** `undefined`

An array of colors to display in the color palette.

### `duotonePalette`

-   **Type:** `Array`
-   **Default:** `undefined`

An array of duotone filters to display in the dropdown menu. Each filter should be an object containing `colors`.

### `disableCustomColors`

-   **Type:** `boolean`
-   **Default:** `false`

Whether to disable custom color selection in the palette.

### `disableCustomDuotone`

-   **Type:** `boolean`
-   **Default:** `false`

Whether to disable the ability to create custom duotone filters.

### `value`

-   **Type:** `Array|String`
-   **Default:** `undefined`

The currently selected duotone filter. Can be `null` or `'unset'` for no filter, or an array of two colors for custom filters.

### `onChange`

-   **Type:** `function`
-   **Default:** `undefined`

Callback function called when the selected duotone filter changes. Receives the new value as a parameter.

