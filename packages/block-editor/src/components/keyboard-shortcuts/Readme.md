# Keyboard Shortcuts

The `KeyboardShortcuts` component registers and manages keyboard shortcuts for the block editor. It provides a comprehensive set of shortcuts for common block operations, navigation, and text selection.

## Development guidelines

### Usage

```jsx
import { KeyboardShortcuts } from '@wordpress/block-editor';

const MyBlockEditor = () => (
    <BlockEditorProvider>
        <KeyboardShortcuts />
        {/* Other editor components */}
    </BlockEditorProvider>
);
```

_Note:_ The `KeyboardShortcuts` component should be rendered within a `BlockEditorProvider`.

### Available Shortcuts

#### Block Operations
- **Copy** (`Cmd/Ctrl + C`): Copy selected block(s)
- **Cut** (`Cmd/Ctrl + X`): Cut selected block(s)
- **Paste** (`Cmd/Ctrl + V`): Paste block(s)
- **Duplicate** (`Cmd/Ctrl + Shift + D`): Duplicate selected block(s)
- **Remove** (`Cmd/Ctrl + Shift + Backspace`): Remove selected block(s)
- **Group** (`Cmd/Ctrl + G`): Create a group from selected blocks

#### Block Navigation
- **Insert Before** (`Cmd/Ctrl + Alt + T`): Insert block before selection
- **Insert After** (`Cmd/Ctrl + Alt + Y`): Insert block after selection
- **Move Up** (`Ctrl + T`): Move block(s) up
- **Move Down** (`Ctrl + Y`): Move block(s) down

#### Selection
- **Select All** (`Cmd/Ctrl + A`): Select all text/blocks
- **Clear Selection** (`Escape`): Clear current selection
- **Multi-text Selection** (`Shift + Arrow`): Select text across blocks

#### Global
- **Focus Toolbar** (`Alt + F10`): Navigate to nearest toolbar
- **List View Collapse** (`Alt + L`): Collapse all other items in list view

### Implementation

The component uses the WordPress keyboard shortcuts API to register shortcuts:

```jsx
registerShortcut({
    name: 'core/block-editor/copy',
    category: 'block',
    description: __('Copy the selected block(s).'),
    keyCombination: {
        modifier: 'primary',
        character: 'c',
    },
});
```

### Categories

Shortcuts are organized into categories:
- `block`: Block manipulation operations
- `selection`: Text and block selection
- `global`: Editor-wide actions
- `list-view`: List view specific actions

## Related Components

Block Editor components are components that can be used to compose the UI of your block editor. They should be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
