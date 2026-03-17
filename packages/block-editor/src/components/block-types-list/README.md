# Block Types List

The `BlockTypesList` component lets users display a list of blocks in different interfaces or as a result of certain actions. It is also possible to select one of the blocks in the list to insert it into the editor.

This component is present in the block insertion tab, the reusable blocks tab and the quick block insertion modal in the editor.

![Block types list in the block inserter tab](https://make.wordpress.org/core/files/2020/09/block-types-list-emplacement-1.png)

![Block types list in the reusables blocks tab](https://make.wordpress.org/core/files/2020/09/block-types-list-emplacement-2.png)

![Block types list in the quick inserter modal](https://make.wordpress.org/core/files/2020/09/block-types-list-emplacement-3.png)

## Development guidelines

### Usage

Renders a list of blocks types.

```jsx
import { BlockTypesList } from '@wordpress/block-editor';

const MyBlockTypesList = () => <BlockTypesList items={ filteredItems } />;
```

### Props

#### items

The blocks that will be displayed in the block list.

-   Type: `Array<Block>`
-   Required: Yes
-   Platform: Web | Mobile

#### name

Name of the list to be used as part of component's key.

-   Type: `String`
-   Required: Yes
-   Platform: Mobile

#### listProps

Extra `FlatList` props for customizing the list.

On Mobile usually this component is rendered inside `BottomSheet` component, which already [generates these props](<(https://github.com/WordPress/gutenberg/blob/1ca1fe0c64dfe1a385221399fc94b0fb14f34199/packages/components/src/mobile/bottom-sheet/index.native.js#L355-L372)>) for this component.

-   Type: `String`
-   Required: No
-   Platform: Mobile

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
