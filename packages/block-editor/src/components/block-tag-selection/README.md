# Block Tag Selection

`<TagSelectionDropdown>` Adds a dropdown with a list of selectable HTML tags to the block toolbar.
Uses `<ToolbarDropdownMenu>`.

## Usage

```jsx

import { BlockControls, TagSelectionDropdown } from '@wordpress/block-editor';

const DEFAULT_TAGS = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p' ];

const MyTagSelectionToolbar = () => (
	<BlockControls group="block">
		<TagSelectionDropdown
			tags={ DEFAULT_TAGS }
			selectedTag={ tag }
			onChange={ ( newTag ) =>
				setAttributes( { tag: newTag } )
			}
		/>
	</BlockControls>
);
```

### Props

#### tags

The list of available HTML tags, passed from the block.

-   Type: `Array`
-   Required: no

#### selectedTag

The chosen HTML tag.

-   Type: `string`
-   Required: no

#### onChange

Callback to run when toolbar value is changed.

-   Type: `string`
-   Required: yes

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
