# Block Tag Selection

`<TagSelectionDropdown>` Adds a dropdown with a list of selectable HTML tags to the block toolbar.
Uses `<ToolbarDropdownMenu>`.

## Usage

```jsx

import { BlockControls, TagSelectionDropdown } from '@wordpress/block-editor';

// Default HTML tags
const DEFAULT_TAGS = [
	{
		tag: 'h1',
		title: __( 'Heading 1' ),
	},
	{
		tag: 'h2',
		title: __( 'Heading 2' ),
	},
	{
		tag: 'h3',
		title: __( 'Heading 3' ),
	},
	{
		tag: 'h4',
		title: __( 'Heading 4' ),
	},
	{
		tag: 'h5',
		title: __( 'Heading 5' ),
	},
	{
		tag: 'h6',
		title: __( 'Heading 6' ),
	},
];

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

-   Type: `Object`
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
