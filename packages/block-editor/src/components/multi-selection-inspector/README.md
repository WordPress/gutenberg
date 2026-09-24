# Multi Selection Inspector

The `MultiSelectionInspector` component adds a card in the panel displayed by the [`BlockInspector`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/block-editor/src/components/block-inspector) component when several blocks are selected in the editor.

This card contains information on the number of blocks selected, and in the case where one or more of these blocks contains text, the number of words they contain.

![Multi selection inspector card](https://make.wordpress.org/core/files/2020/09/multi-selection-inspector-card.png)

## Development guidelines

### Usage

Renders the multi selection inspector card.

```jsx
import { <MultiSelectionInspector /> } from '@wordpress/block-editor';

const SelectedBlockCount = getSelectedBlockCount();

if ( SelectedBlockCount > 1 ) {
    const MyMultiSelectionInspector = () => <MultiSelectionInspector />;
}
```

_Note:_ In this example, we detect if more than one block is selected with `getSelectedBlockCount()` before using the `MultiSelectionInspector` component.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
