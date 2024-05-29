# Block Inspector

The Block inspector is one of the panels that is displayed in the editor; it is mainly used to view and modify the settings of the selected block.

![Paragraph block inspector](https://make.wordpress.org/core/files/2020/08/paragraph-block-inspector.png)

## Development guidelines

### Usage

Render the block inspector component.

```jsx
import { BlockInspector } from '@wordpress/block-editor';

const MyBlockInspector = () => <BlockInspector />;
```

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [BlockEditorProvider](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
