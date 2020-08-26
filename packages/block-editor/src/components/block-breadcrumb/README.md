# Block Breadcrumb

The block breadcrumb trail displays the hierarchy of the current block selection as a breadcrumb. It also allows, using this hierarchy, to navigate to the parent elements of the current block selection. It is located at the very bottom of the editor interface.

![Button block breadcrumb](https://make.wordpress.org/core/files/2020/08/gutenberg-button-block-breadcrumb.png)

![Image in column block breadcrumb](https://make.wordpress.org/core/files/2020/08/gutenberg-image-in-column-block-breadcrumb.png)

## Table of contents

1. [Development guidelines](#development-guidelines)


## Development guidelines

### Usage

Renders a block breadcrumb with default style.

```jsx
import { BlockBreadcrumb } from '@wordpress/block-editor';

<div className="add-your-class-name">
    <BlockBreadcrumb />
</div>
```
