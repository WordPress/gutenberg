# Keyboard Shortcuts

The `KeyboardShortcuts` component handles the operation and behavior of keyboard shortcuts in the block editor.

![Keyboard shortcuts examples](https://make.wordpress.org/core/files/2020/09/keyboard-shortcuts-examples.png)

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Displays a block toolbar for a selected block.

```jsx
import { KeyboardShortcuts } from '@wordpress/block-editor';
const MyKeyboardShortcuts = () => (
	<KeyboardShortcuts
		key={ currentPage }
		shortcuts={ {
			left: goLeft,
			right: goRight,
		} }
	/>
);
```

_Note:_ In this example, `goLeft` and `goRight` set the shortcuts keys.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/provider/README.md) in the components tree.
