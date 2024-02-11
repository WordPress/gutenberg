# Ungroup Button

The `UngroupButton` components adds an icon on the BlockControls toolbar when a group block is selected. Then, it's possible to ungroup the inner blocks. After click on the icon, it removes the group block holding the InnerBlocks components which are moved one level up in the hierarchy.

This only happens in the mobile WordPress apps.

![Ungroup button icon](https://user-images.githubusercontent.com/21242757/65593577-11006000-df91-11e9-8460-1179e9ef46d2.png)

## Development guidelines

### Usage

Display the `UngroupButton` icon.

```jsx
import { UngroupButton } from '@wordpress/block-editor';

const MyUngroupButton = () => <UngroupButton />;
```

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
