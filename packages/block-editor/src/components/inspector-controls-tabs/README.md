# Inspector Controls Tabs

The `InspectorControlsTabs` component splits the block inspector sidebar into tabs, so a block's settings, styles and list view fills are grouped instead of being stacked in a single scrolling column.

_Note:_ This component is internal to the `@wordpress/block-editor` package. It is not exported from the package and is not part of the public API. It is rendered by [`BlockInspector`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-inspector/README.md), which decides whether tabs are shown at all.

## Development guidelines

The tabs are not authored by the block. Each tab renders [`InspectorControls`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inspector-controls/README.md) slots, so a block populates a tab simply by rendering `InspectorControls` with the matching `group`: the Settings tab renders the default, `position` and `bindings` groups plus the Advanced panel, the Styles tab renders the `color`, `background`, `filter`, `typography`, `dimensions`, `border` and `styles` groups, and the List View tab renders the `list` group.

Which tabs exist is determined by the `useInspectorControlsTabs` hook, which only returns a tab when at least one fill has been rendered into its groups. The hook also honors the `blockInspectorTabs` block editor setting, which can disable tabs globally or per block name. `BlockInspector` renders this component only when the hook returns more than one tab; with a single tab the sections are rendered flat instead.

Two behaviors are worth knowing when consuming the tabs. The List View tab is restricted by an allowlist that currently contains only `core/navigation`, so other blocks never receive it even if they render `list` group fills. And because the tab panel mounts before slot fills arrive, blocks that are known to have a List View tab select it by default via `defaultTabId` rather than falling back to Settings.

Tab labels are rendered as icons with a tooltip. When the `showIconLabels` preference from `@wordpress/preferences` is enabled, the tab title is rendered as text instead.

### Usage

```jsx
import InspectorControlsTabs from '../inspector-controls-tabs';
import useInspectorControlsTabs from '../inspector-controls-tabs/use-inspector-controls-tabs';

function MyBlockInspector( { blockName, clientId, hasBlockStyles } ) {
	const availableTabs = useInspectorControlsTabs( blockName );

	if ( availableTabs.length <= 1 ) {
		return null;
	}

	return (
		<InspectorControlsTabs
			blockName={ blockName }
			clientId={ clientId }
			hasBlockStyles={ hasBlockStyles }
			tabs={ availableTabs }
		/>
	);
}
```

### Props

#### `blockName`

-   **Type:** `String`

The name of the block being inspected, for example `core/navigation`. It is used to decide whether the List View tab is available and to resolve the border panel label. When omitted, the Advanced panel is not rendered in the Settings tab.

#### `clientId`

-   **Type:** `String`

The client ID of the block being inspected. It is used as the key of the tabs panel so that selecting a different block resets the selected tab, and it is passed to the block styles preview in the Styles tab.

#### `hasBlockStyles`

-   **Type:** `Boolean`

Whether the block has registered block styles. When `true`, the Styles tab renders a "Styles" panel with the block style previews above the block support slots.

#### `tabs`

-   **Type:** `Array`

The tabs to render in the tab list, in display order. Each entry is an object with `name`, `title` and `icon`. Pass the value returned by `useInspectorControlsTabs`; only tabs matching the `settings`, `styles` and `list` names have a corresponding panel.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
