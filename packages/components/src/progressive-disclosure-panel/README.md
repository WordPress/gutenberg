# Progressive Disclosure Panel

These panels provide progressive discovery options for their children. For
example the controls provided via block supports.

## Development guidelines

The `ProgressiveDisclosurePanel` creates a container with a header including a
dropdown menu. The menu is generated automatically from the panel's children.
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
import { __experimentalProgressiveDisclosurePanel as ProgressiveDisclosurePanel } from '@wordpress/components';
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
				<PaddingEdit
					{ ...props }
					hasValue={ hasPaddingValue }
					label={ __( 'Padding' ) }
					onDeselect={ resetPadding }
				/>
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

#### ProgressiveDisclosurePanelTitle

This is a simple component to display the panel title and house the dropdown
menu for toggling child display. It is used by the `ProgressiveDisclosurePanel`
component under the hood, so it does not typically need to be used.

##### Props
###### resetAll

A function to call when the `Reset all` menu option is selected.

-   Type: `function`
-   Required: Yes

###### toggleChild

Callback used to toggle display of an individual child component.

-   Type: `function`
-   Required: Yes

###### menuItems

This object represents the panel's children and their visibility state. It
is built by the parent panel from its children prop.

-   Type: `Object`
-   Required: No

###### menuLabel

A label for the dropdown menu.

-   Type: `String`
-   Required: No

###### title

The panel title to display.

-   Type: `String`
-   Required: No
