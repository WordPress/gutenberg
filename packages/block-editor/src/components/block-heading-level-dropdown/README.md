# Heading Level Dropdown

`<HeadingLevelDropdown>` Adds a dropdown for selecting H1-H6 and paragraph HTML tags from the block toolbar.
Uses `<ToolbarDropdownMenu>`.

## Usage

```jsx

import { BlockControls, HeadingLevelDropdown } from '@wordpress/block-editor';

const HEADING_LEVELS = [ 0, 1, 2, 3, 4, 5, 6 ];

const MyHeadingLevelToolbar = () => (
	<BlockControls group="block">
		<HeadingLevelDropdown
			options={ HEADING_LEVELS }
			value={ tag }
			onChange={ ( newTag ) =>
				setAttributes( { tag: newTag } )
			}
		/>
	</BlockControls>
);
```

### Props

#### options

The list of available heading levels, passed from the block.

-   Type: `Object`
-   Required: no

#### value

The chosen heading level.

-   Type: `number`
-   Required: no

#### onChange

Function called with the selected value changes.

-   Type: `() => number`
-   Required: yes

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
