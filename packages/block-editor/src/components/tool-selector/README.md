# Tool Selector

Tools provide different interactions for selecting, navigating, and editing blocks.

<img width="353" alt="Screenshot 2023-06-15 at 1 25 47 AM" src="https://github.com/Sidsector9/gutenberg/assets/17757960/c4d97760-983b-41ca-a740-d1c8f6acfcdd">


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

_Optional._ Accepts props that can be passed to the `Button` component.

### Ref

_Optional._ The component forwards the `ref` property to the underlying `Button` component.


## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/provider/README.md) in the components tree.
