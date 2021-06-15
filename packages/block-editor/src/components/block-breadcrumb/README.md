# Block Breadcrumb

The block breadcrumb trail displays the hierarchy of the current block selection as a breadcrumb. It also allows, using this hierarchy, to navigate to the parent elements of the current block selection. It is located at the very bottom of the editor interface.

![Button block breadcrumb](https://make.wordpress.org/core/files/2020/08/gutenberg-button-block-breadcrumb.png)

![Image in column block breadcrumb](https://make.wordpress.org/core/files/2020/08/gutenberg-image-in-column-block-breadcrumb.png)

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

#### Props

##### rootLabelText

Label text for the root element (the first `<li />`) of the breadcrumb trail.

-   Type: `String`
-   Required: No

### Usage

Renders a block breadcrumb with default style.

```jsx
import { BlockBreadcrumb } from '@wordpress/block-editor';

const MyBreadcrumb = () => <BlockBreadcrumb />;
```

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
