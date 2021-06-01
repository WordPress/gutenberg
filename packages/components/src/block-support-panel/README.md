# Block Support Panel

These panels provide progressive discovery options for multiple controls
provided via block supports.

## Development guidelines

The `BlockSupportPanel` creates a container with a header including a dropdown
menu. The menu is generated automatically from the panel's children. Each menu
item allows for the display of the corresponding child control to be toggled
on or off. When toggled off the control's reset callback is fired allowing for
the block support provided attribtues to reset.

Whether a child control is initially displayed or not is dependent upon
whether there has previously been a value set. This is checked via the
`hasValue` function provided through the child's props.

### Usage

```jsx
import { __experimentalBlockSupportPanel as BlockSupportPanel } from '@wordpress/components';
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
		<BlockSupportPanel
			label={ __( 'Dimensions options' ) }
			title={ __( 'Dimensions' ) }
			resetAll={ resetAll }
		>
			{ ! isPaddingDisabled && (
				<PaddingEdit
					{ ...props }
					hasValue={ hasPaddingValue }
					label={ __( 'Padding' ) }
					reset={ resetPadding }
				/>
			) }
		</BlockSupportPanel>
	);
}
```

### Sub-Components

#### BlockSupportPanelTitle

This is a simple component to display the panel title and house the dropdown
menu for toggling control display. It is used by the `BlockSupportPanel`
component under the hood, so it does not typically need to be used.

##### Props
###### resetAll

A function to call when the `Reset all` menu option is selected.

-   Type: `function`
-   Required: Yes

###### toggleControl

Callback used to toggle display of an individual block support control and reset
its value if being turned off.

-   Type: `function`
-   Required: Yes

###### menuItems

This object represents the child controls and their visibility state. It
is built by the parent panel using its children.

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
