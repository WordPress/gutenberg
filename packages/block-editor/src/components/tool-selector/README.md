# Tool Selector

Tools provide different interactions for selecting, navigating, and editing blocks.

## Table of contents


1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Renders the tool selector component.

```jsx
import { ToolSelector } from '@wordpress/block-editor';

const MyToolSelector = () => <ToolSelector />
```

### Props

_Optional._ Accepts all the props that can be passed to the `Button` component.

### Ref

_Optional._ The component forwards the `ref` property to the `Button` component.


## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/provider/README.md) in the components tree.
