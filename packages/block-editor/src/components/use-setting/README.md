## Use Setting

`UseSetting` is a hook that will retrive the given setting for the block instance that's in use. 

It does the lookup of the setting in the following order:

1. Third parties can provide the settings for the block using the filter `blockEditor.useSetting.before`.
2. If no third parties have provided this setting, then it looks up in the block instance hierachy starting from the current block and working its way upwards to its ancestors.
3. If that doesn't prove to be successful in getting a value, then it falls back to the settings from the block editor store.
4. If none of the above steps prove to be successful, then it's likely to be a deprecated setting and the deprecated setting is used instead.

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Fetches the font sizes available based on the block instance. The font sizes retrived can now be used for building something like a fontSize picker.

```jsx
import { useSetting } from '@wordpress/block-editor';

const fontSizes = useSetting( 'typography.fontSizes' );
```

Refer [here](https://github.com/WordPress/gutenberg/blob/HEAD/docs/how-to-guides/curating-the-editor-experience.md?plain=1#L330) in order to understand how the filter mentioned above `blockEditor.useSetting.before` can be used.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.