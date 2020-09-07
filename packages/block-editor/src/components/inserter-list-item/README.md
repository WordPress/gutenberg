# Inserter List Item

The `InserterListItem` component allows you to display a group of elements for each of the blocks that are present in the editor's block type list interfaces.

These groups are made up of a block icon and its name.

In practice, a click on these groups allows you to insert the corresponding block in the editor.

![Paragraph block inserter list item](https://make.wordpress.org/core/files/2020/09/paragraph-inserter-list-item.png)

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Renders a block inserter list item.

```jsx
import { InserterListItem } from '@wordpress/block-editor';

const MyInserterListItem = () => (
	<InserterListItem />
);
```

### Props

#### icon

-   Type: `any`

#### onClick

-   Type: `any`

#### isDisabled

-   Type: `any`

#### title

-   Type: `any`

#### className

-   Type: `any`

#### composite

-   Type: `any`


## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/provider/README.md) in the components tree.
