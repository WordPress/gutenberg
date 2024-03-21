# SpacingSizesControl

This Gutenberg `block-editor` component, `SpacingSizesControl`, provides a user-friendly interface for adjusting spacing sizes within WordPress blocks. It includes various input controls and options to customize spacing for different sides of a block.

## Table of Contents
- [Introduction](#introduction)
- [Usage](#usage)
- [Props](#props)
- [Dependencies](#dependencies)
- [Contributing](#contributing)
- [License](#license)

## Introduction
The `SpacingSizesControl` component is designed to enhance the Gutenberg block editor by allowing users to easily adjust spacing sizes for individual sides or axially (horizontally and vertically). It provides a comprehensive set of input controls and options for customizing padding or margin values.

## Usage
To use this component, import it into your Gutenberg block and include it within your block's settings or controls. Here's a basic example of how to incorporate `SpacingSizesControl` into your block:

```jsx
import SpacingSizesControl from './SpacingSizesControl';

function MyCustomBlockEdit( { attributes, setAttributes } ) {
    return (
        <div>
            <SpacingSizesControl
                // Add necessary props here
            />
            {/* Add other block controls or settings */}
        </div>
    );
}
```

## Props

The `SpacingSizesControl` component accepts the following props:

- `inputProps`: Additional props to be passed to input controls.
- `label`: Label for the spacing control.
- `minimumCustomValue`: Minimum value allowed for custom spacing.
- `onChange`: Function called when spacing values are changed.
- `onMouseOut`: Function called when the mouse pointer moves out of the control.
- `onMouseOver`: Function called when the mouse pointer moves over the control.
- `showSideInLabel`: Whether to show the side label in the main label.
- `sides`: Array of sides to display controls for (e.g., top, bottom, left, right).
- `useSelect`: Whether to use select dropdown for input controls.
- `values`: Initial spacing values.

## Dependencies

- `@wordpress/components`: Component library provided by WordPress.
- `@wordpress/element`: Element library provided by WordPress.
- `@wordpress/i18n`: Internationalization utilities provided by WordPress.

## Contributing

Contributions to this Gutenberg block-editor component are welcome! If you encounter any issues or have suggestions for improvements, feel free to open an issue or submit a pull request on the GitHub repository.


