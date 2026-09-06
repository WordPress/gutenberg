# Dimension Control

The `DimensionControl` component provides a comprehensive control for managing dimensions of a block within the block editor. It supports both preset values from theme settings and custom values with unit controls and sliders. It can be used for controlling various dimension-related block supports like height, width, min-height, etc.

_Note:_ It is worth noting that dimension options are opt-in features. Themes need to declare support for them before they'll be available, and a convenient way to do that is via opting in to the [appearanceTools](/docs/how-to-guides/themes/global-settings-and-styles.md#opt-in-into-ui-controls) UI controls.

## Features

- **Preset Support**: Automatically detects and displays dimension presets from `dimensions.dimensionSizes` theme settings
- **Custom Values**: Allows entering custom dimension values with unit selection
- **Unit Conversion**: Intelligently converts between compatible units (px ↔ em/rem, viewport units)
- **Flexible UI**: Shows either a slider (≤8 presets) or dropdown (>8 presets) for preset selection
- **Toggle Between Modes**: Users can switch between preset and custom value modes

## Development guidelines

### Usage

Renders the markup for dimension control component, to be used in the block inspector.

```jsx
import { useState } from 'react';
import { DimensionControl } from '@wordpress/block-editor';

const MyDimensionControl = () => (
	const [ value, setValue ] = useState();
	<DimensionControl
		label={ 'My Dimension Control' }
		onChange={ setValue }
		value={ value }
	/>
);
```

### Props

#### `value`

-   **Type:** `String` or `Number` or `Undefined`

The value of the current dimension.

#### `onChange`

-   **Type:** `Function`

A callback function that handles the application of the dimension value.

#### `label`

-   **Type:** `String`
-   **Default:** `'Dimension'`

A label for the dimension control. This is useful when using the dimension control for different dimension properties. For example, "Height", "Width", "Minimum height", etc.

## Preset Integration

The component automatically integrates with the theme's dimension size presets defined in `dimensions.dimensionSizes`. These presets are merged from:

- **Default presets**: System-defined dimension sizes
- **Theme presets**: Dimension sizes defined by the active theme
- **Custom presets**: User-defined dimension sizes

### Preset Value Format

When a preset is selected, the component returns values in the format:
```
var:preset|dimension|{slug}
```

For example: `var:preset|dimension|medium`

### Theme Configuration

To provide dimension presets, add them to your theme's `theme.json`:

```json
{
  "version": 2,
  "settings": {
    "dimensions": {
      "dimensionSizes": [
        {
          "name": "Small",
          "slug": "small",
          "size": "16px"
        },
        {
          "name": "Medium",
          "slug": "medium",
          "size": "32px"
        },
        {
          "name": "Large",
          "slug": "large",
          "size": "64px"
        }
      ]
    }
  }
}
```

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
