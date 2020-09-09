# Block Card

The `BlockCard` component allows to display a "card" which contains the title of a block, its icon and its description.

In the editor, this component is displayed in two different places: in the block inspector by selecting a block, and as a modal by hovering over a block in the block insertion panel.

![Heading block card in the block inspector](https://make.wordpress.org/core/files/2020/09/screenshot-wordpress.org-2020.09.08-14_19_21.png)


## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)


## Development guidelines

### Usage

Renders a block card with default style.

```jsx
import { BlockCard } from '@wordpress/block-editor';

const MyBlockCard = () => <BlockCard blockType={ blockType } />;

```

### props

#### blockType

The type of the block that is being displayed in

Type: `Object`


## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/provider/README.md) in the components tree. 
