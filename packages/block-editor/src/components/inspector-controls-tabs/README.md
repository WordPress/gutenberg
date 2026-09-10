# Inspector Controls Tabs

The `InspectorControlsTabs` component splits the block inspector sidebar into tabs, so a block's content, list view, settings and styles are grouped instead of being stacked in a single scrolling column.

_Note:_ This component is internal to the `@wordpress/block-editor` package. It is not exported from the package and is not part of the public API. It is rendered by [`BlockInspector`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-inspector/README.md), which decides whether tabs are shown at all.

## Development guidelines

The tabs are not authored by the block. Each tab renders [`InspectorControls`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inspector-controls/README.md) slots, so a block populates a tab simply by rendering `InspectorControls` with the matching `group`. There are four tabs, rendered in this order when available: Content (the `content` group), List View (the `list` group), Settings (the default and `bindings` groups, plus the Advanced panel) and Styles (the `typography`, `color`, `background`, `filter`, `layout`, `dimensions`, `border`, `elements`, `position` and `styles` groups).

Which tabs exist is determined by the `useInspectorControlsTabs` hook, which returns a tab when fills have been rendered into its groups. `BlockInspector` renders this component only when the hook returns more than one tab; with a single tab the sections are rendered flat instead. The hook also honors the `blockInspectorTabs` block editor setting, which can disable tabs globally or per block name.

Tab labels are rendered as icons with a tooltip. When the `showIconLabels` preference from `@wordpress/preferences` is enabled, the tab title is rendered as text instead.

### Usage

```jsx
import InspectorControlsTabs from '../inspector-controls-tabs';
import useInspectorControlsTabs from '../inspector-controls-tabs/use-inspector-controls-tabs';

function MyBlockInspector( {
	blockName,
	clientId,
	hasBlockStyles,
	isSectionBlock,
	contentClientIds,
} ) {
	const availableTabs = useInspectorControlsTabs(
		blockName,
		contentClientIds,
		isSectionBlock,
		hasBlockStyles
	);

	if ( availableTabs.length <= 1 ) {
		return null;
	}

	return (
		<InspectorControlsTabs
			blockName={ blockName }
			clientId={ clientId }
			hasBlockStyles={ hasBlockStyles }
			tabs={ availableTabs }
			isSectionBlock={ isSectionBlock }
			contentClientIds={ contentClientIds }
		/>
	);
}
```

### Props

#### `blockName`

-   **Type:** `String`

The name of the block being inspected, for example `core/group`. It is used to resolve the border panel label, and `core/template-part` is excluded from the curated section styles described under `isSectionBlock`. When omitted, the Advanced panel is not rendered in the Settings tab.

#### `clientId`

-   **Type:** `String`

The client ID of the block being inspected. It is used as the key of the tabs panel so that selecting a different block resets the selected tab, and it is passed to the block styles preview in the Styles tab.

#### `hasBlockStyles`

-   **Type:** `Boolean`

Whether the block has registered block styles. When `true`, the Styles tab renders the block style previews above the block support panels.

#### `tabs`

-   **Type:** `Array`

The tabs to render in the tab list, in display order. Each entry is an object with `name`, `title` and `icon`. Pass the value returned by `useInspectorControlsTabs`; only tabs matching the `content`, `list`, `settings` and `styles` names have a corresponding panel.

#### `isSectionBlock`

-   **Type:** `Boolean`

Whether the block being inspected is a section. When `true`, the Styles tab replaces the full set of block support panels with a curated subset — typography, background and elements — restricted to the supports a section should expose. Template parts are excluded and keep the full panel set.

#### `contentClientIds`

-   **Type:** `Array`

The client IDs of the content blocks within a section. The Content tab lists them as quick navigation links to select a nested block, and the Styles tab uses them to decide which element color controls to show by default.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
