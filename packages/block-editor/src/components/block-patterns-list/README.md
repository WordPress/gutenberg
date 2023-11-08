# Patterns List

The `BlockPatternList` component makes a list of the different registered patterns. It uses the `BlockPreview` component to display a preview for each pattern.

For more infos about blocks patterns, read [this](https://make.wordpress.org/core/2020/07/16/block-patterns-in-wordpress-5-5/).

![Patterns sidebar in WordPress 5.5](https://make.wordpress.org/core/files/2020/09/blocks-patterns-sidebar-in-wordpress-5-5.png)

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Renders a patterns list.

```jsx
import { BlockPatternList } from '@wordpress/block-editor';

const MyBlockPatternList = () => (
	<BlockPatternList
		blockPatterns={ shownBlockPatterns }
		shownPatterns={ shownBlockPatterns }
		onClickPattern={ onSelectBlockPattern }
	/>
);
```

### Props

#### blockPatterns

An array of patterns that can be shown in the patterns list.

-   Type: `Array`
-   Required: Yes

#### shownPatterns

An array of shown patterns objects.

-   Type: `Array`
-   Required: Yes

#### onClickPattern

The performed event after a click on a pattern. In most cases, the pattern is inserted in the block editor.

-   Type: `Function`
-   Required: Yes

#### isDraggable

Enables drag and drop functionality to the available patterns.

-   Type: `boolean`
-   Required: No

#### orientation

The orientation value determines which arrow keys can be used to move focus. Available options are (`vertical`|`horizontal`). If not provided all arrow keys work.

-   Type: `string`
-   Required: No

#### label

The aria label for the patterns list.

-   Type: `string`
-   Required: No
-   Default: `Patterns`

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
