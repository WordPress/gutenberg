## Use Settings

`useSettings` is a hook that will retrieve the settings for the block instance that's in use.

It does the lookup of the settings in the following order:

1. Third parties can provide the settings for the block using the filter `blockEditor.useSetting.before`.
2. If no third parties have provided this setting, then it looks up in the block instance hierarchy starting from the current block and working its way upwards to its ancestors.
3. If that doesn't prove to be successful in getting a value, then it falls back to the settings from the block editor store.
4. If none of the above steps prove to be successful, then it's likely to be a deprecated setting and the deprecated setting is used instead.

## Development guidelines

### Usage

This will fetch the default color palette based on the block instance.

```jsx
import { useSettings } from '@wordpress/block-editor';

const [ defaultColorPalette ] = useSettings( 'color.palette.default' );
```

Refer [here](https://github.com/WordPress/gutenberg/blob/HEAD/docs/how-to-guides/curating-the-editor-experience.md?plain=1#L330) in order to understand how the filter mentioned above `blockEditor.useSetting.before` can be used.

### Props

This hooks accepts the following arguments.

#### `paths`

-   **Type:** `Array<String>`

Array of paths to the settings to be retrieved. E.g., `[ 'typography.fontSizes' ]`
