# Inserter List Item

The `InserterListItem` component allows to display a modal with a list of blocks that can be added in the editor by clicking on one of them.

Each of the elements of this list is a group formed by the icon of a block and its name.

![Inserter List item](https://make.wordpress.org/core/files/2020/08/gutenberg-button-block-breadcrumb.png)


## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)


## Development guidelines

### Usage

Renders a block breadcrumb with default style.

```jsx
import { BlockBreadcrumb } from '@wordpress/block-editor';

const MyBreadcrumb = () => <BlockBreadcrumb />;
```

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/provider/README.md) in the components tree. 
