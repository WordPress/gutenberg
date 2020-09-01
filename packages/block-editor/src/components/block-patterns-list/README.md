# Block Patterns List

The `BlockPatternList` component makes a list of the different registered block patterns. It uses the `BlockPreview` component to display a preview for each block pattern.

For more infos about blocks patterns, read [this](https://make.wordpress.org/core/2020/07/16/block-patterns-in-wordpress-5-5/).

![Block patterns sidebar in WordPress 5.5](https://make.wordpress.org/core/files/2020/09/blocks-patterns-sidebar-in-wordpress-5-5.png)

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Renders a block patterns list.

```jsx
import { BlockPatternList } from '@wordpress/block-editor';

const MyBreadcrumb = () => (
	<BlockPatternList
		shownPatterns={ currentShownPatterns }
		blockPatterns={ filteredPatterns }
		onClickPattern={ onClick }
	/>
);
```

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/provider/README.md) in the components tree.
