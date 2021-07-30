# ProgressiveDisclosurePanel

These panels provide progressive discovery options for their children. For
example the controls provided via block supports.

## Development guidelines

The `ProgressiveDisclosurePanel` creates a container with a header including a
dropdown menu. The menu is generated automatically from the panel's children
matching the `ProgressiveDisclosurePanelItem` component type.

Each menu item allows for the display of the corresponding child to be
toggled on or off. The control's `onSelect` and `onDeselect` callbacks are fired
allowing for greater control over the child e.g. resetting block attributes when
a block support control is toggled off.

Whether a child control is initially displayed or not is dependent upon
if there has previously been a value set or the child has been flagged as
displaying by default through the `isShownByDefault` prop. Determining whether a
child has a value is done via the `hasValue` function provided through the
child's props.

### Usage

```jsx
import {
	__experimentalProgressiveDisclosurePanel as ProgressiveDisclosurePanel,
	__experimentalProgressiveDisclosurePanelItem as ProgressiveDisclosurePanelItem,
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
		<ProgressiveDisclosurePanel
			label={ __( 'Dimensions options' ) }
			title={ __( 'Dimensions' ) }
			resetAll={ resetAll }
		>
			{ ! isPaddingDisabled && (
				<ProgressiveDisclosurePanelItem
					hasValue={ () => hasPaddingValue( props ) }
					label={ __( 'Padding' ) }
					onDeselect={ () => resetPadding( props ) }
				>
					<PaddingEdit { ...props } />
				</ProgressiveDisclosurePanelItem>
			) }
		</ProgressiveDisclosurePanel>
	);
}
```

### Props

#### label

The label for the panel's dropdown menu.

#### resetAll

A function to call when the `Reset all` menu option is selected. This is passed
through to the panel's title component.

#### title

Title to be displayed within the panel's title.

### Sub-Components

#### ProgressiveDisclosurePanelItem

This component acts a wrapper and controls the display of items to contained
within a ProgressiveDisclosurePanel. An item is displayed if it is
flagged as a default control or the corresponding panel menu item, provided via
context, is toggled on for this item.

##### Props
###### isShownByDefault

This prop identifies the current item as being displayed by default. This means
it will show regardless of whether it has a value set or is toggled on in the
panel's menu.

-   Type: `boolean`
-   Required: Yes

###### label

The label acts as a key to locate the corresponding item in the panel's menu
context. This is used when checking if the panel item should be displayed.

-   Type: `string`
-   Required: Yes
