# ToolSelector

The `ToolSelector` component provides a dropdown menu for selecting between different editing modes in the WordPress block editor.

## Usage

```jsx
/**
 * WordPress dependencies
 */
import { ToolSelector } from '@wordpress/block-editor';

const MyEditor = () => {
    return (
        <div>
            <ToolSelector />
            {/* Other editor content */}
        </div>
    );
}

export default MyEditor;
```

## Props

- **ref**: A reference to the component instance. Useful for accessing the DOM node or component instance.
  - *Type*: React.ref
  - *Required*: No

### Other Props

Additionally, the `ToolSelector` component accepts all props supported by the `Button` component from `@wordpress/components`.

## Components Used

The `ToolSelector` component internally uses the following WordPress components:

- `Button`: For rendering the toggle button.
- `Dropdown`: For managing the dropdown menu.
- `MenuItemsChoice`: For rendering the choices within the dropdown menu.
- `NavigableMenu`: For rendering a navigable menu within the dropdown.

## Internal Dependencies

The `ToolSelector` component relies on the following internal WordPress dependencies:

- `store`: The block editor's data store for managing editor state.

## Icon Usage

The `ToolSelector` component utilizes icons from `@wordpress/icons` for rendering mode selection icons.

## Editor Modes

The `ToolSelector` component allows switching between the following editor modes:

- **Edit Mode**: Enables editing blocks.
- **Navigation Mode**: Enables selecting blocks.

## Accessibility

The `ToolSelector` component ensures accessibility by providing appropriate ARIA attributes and keyboard navigation support.

### Accessibility in Edit Mode

In edit mode, the `ToolSelector` ensures that:

- The toggle button has an appropriate label for screen readers.
- Keyboard navigation is supported for opening and closing the dropdown menu.

### Accessibility in Navigation Mode

In navigation mode, the `ToolSelector` ensures that:

- The toggle button has an appropriate label for screen readers.
- Keyboard navigation is supported for opening and closing the dropdown menu.

## Contributing

Feel free to contribute to this component by submitting pull requests, reporting issues, or suggesting improvements.

