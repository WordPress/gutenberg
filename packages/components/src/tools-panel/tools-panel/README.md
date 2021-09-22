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

### `label`: `string`

Text to be displayed within the panel's header and as the `aria-label` for the
panel's dropdown menu.

- Required: Yes

### `panelId`: `string`

If a `panelId` is set, it is passed through the `ToolsPanelContext` and used
to restrict panel items. Only items with a matching `panelId` will be able
to register themselves with this panel.

- Required: No

### `resetAll`: `() => void`

A function to call when the `Reset all` menu option is selected. This is passed
through to the panel's header component.

- Required: Yes
