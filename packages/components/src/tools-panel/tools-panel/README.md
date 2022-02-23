# ToolsPanel

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early
implementation subject to drastic and breaking changes.
</div>
<br />
These panels provide progressive discovery options for their children. For
example the controls provided via block supports.

## Development guidelines

The `ToolsPanel` creates a container with a header including a
dropdown menu. The menu is generated automatically from the panel's children
matching the `ToolsPanelItem` component type.

Each menu item allows for the display of the corresponding child to be
toggled on or off. The control's `onSelect` and `onDeselect` callbacks are fired
allowing for greater control over the child e.g. resetting block attributes when
a block support control is toggled off.

Whether a child control is initially displayed or not is dependent upon
if there has previously been a value set or the child has been flagged as
displaying by default through the `isShownByDefault` prop. Determining whether a
child has a value is done via the `hasValue` function provided through the
child's props.

Components that are not wrapped within a `ToolsPanelItem` are still rendered
however they will not be represented within, or controlled by, the `ToolsPanel`
menu. An example scenario that benefits from this could be displaying
introduction or help text within a panel.

## Usage

```jsx
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import {
	PaddingEdit,
	hasPaddingValue,
	resetPadding,
	useIsPaddingDisabled,
} from './padding';


export function DimensionPanel( props ) {
	const isPaddingDisabled = useIsPaddingDisabled( props );

	const resetAll = () => {
		// Reset attributes for all block support features in this panel.
	};

	return (
		<ToolsPanel label={ __( 'Dimensions' ) } resetAll={ resetAll }>
			<p>
				Select dimensions or spacing related settings from the menu for
				additional controls.
			</p>
			{ ! isPaddingDisabled && (
				<ToolsPanelItem
					hasValue={ () => hasPaddingValue( props ) }
					label={ __( 'Padding' ) }
					onDeselect={ () => resetPadding( props ) }
				>
					<PaddingEdit { ...props } />
				</ToolsPanelItem>
			) }
		</ToolsPanel>
	);
}
```

## Props

### `hasInnerWrapper`: `boolean`

Flags that the items in this ToolsPanel will be contained within an inner
wrapper element allowing the panel to lay them out accordingly.

- Required: No

### `label`: `string`

Text to be displayed within the panel's header and as the `aria-label` for the
panel's dropdown menu.

- Required: Yes

### `panelId`: `string`

If a `panelId` is set, it is passed through the `ToolsPanelContext` and used
to restrict panel items. When a `panelId` is set, items can only register
themselves if the `panelId` is explicitly `null` or the item's `panelId` matches
exactly.

- Required: No

### `resetAll`: `() => void`

A function to call when the `Reset all` menu option is selected. This is passed
through to the panel's header component.

- Required: Yes

### `shouldRenderPlaceholderItems`: `boolean`

Advises the `ToolsPanel` that all of its `ToolsPanelItem` children should render
placeholder content (instead of `null`) when they are toggled off and hidden.

- Required: No
