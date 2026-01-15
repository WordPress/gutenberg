# ToggleControl

ToggleControl is used to generate a toggle user interface.

![On and off ToggleControls](https://make.wordpress.org/design/files/2019/02/toggle-control.png)

## Design guidelines

### Usage

#### When to use toggles

Use toggles when you want users to:

-   Switch a single option on or off.
-   Immediately activate or deactivate something.

**Do**
Use toggles to switch an option on or off.

**Don't**
Don't use radio buttons for settings that toggle on and off.

Toggles are preferred when the user is not expecting to submit data, as is the case with checkboxes and radio buttons.

#### Toggle position

By default, the toggle switch appears at the start (left in LTR languages) of the control, before the label. In some layouts, it may be preferable to position the toggle at the end (right in LTR languages), after the label.

Use `togglePosition="end"` when:

-   Aligning toggles with other form elements that have their controls on the right.
-   Creating settings panels where toggles should be visually grouped on one side.
-   Following platform conventions that place switches at the end.

#### Text label

Toggles should have clear inline labels so users know exactly what option the toggle controls, and whether the option is enabled or disabled.

### Behavior

When a user switches a toggle, its corresponding action takes effect immediately.

## Development guidelines

### Usage

Render a user interface to change fixed background setting.

```jsx
import { useState } from 'react';
import { ToggleControl } from '@wordpress/components';

const MyToggleControl = () => {
	const [ hasFixedBackground, setHasFixedBackground ] = useState( false );

	return (
		<ToggleControl
			label="Fixed Background"
			help={
				hasFixedBackground
					? 'Has fixed background.'
					: 'No fixed background.'
			}
			checked={ hasFixedBackground }
			onChange={ ( newValue ) => {
				setHasFixedBackground( newValue );
			} }
		/>
	);
};
```

Render a toggle with the switch positioned at the end.

```jsx
import { useState } from 'react';
import { ToggleControl } from '@wordpress/components';

const MyToggleControl = () => {
	const [ isEnabled, setIsEnabled ] = useState( false );

	return (
		<ToggleControl
			label="Enable feature"
			checked={ isEnabled }
			onChange={ setIsEnabled }
			togglePosition="end"
		/>
	);
};
```

### Props

The component accepts the following props:

#### `label`: `ReactNode`

If this property is added, a label will be generated using label property as the content.

-   Required: No

#### `help`: `ReactNode | ( ( checked: boolean ) => ReactNode )`

If this property is added, a help text will be generated using help property as the content. For controlled components, the `help` prop can also be a function which will return help text dynamically depending on the boolean `checked` parameter.

-   Required: No

#### `checked`: `boolean`

If checked is true the toggle will be checked. If checked is false the toggle will be unchecked. If no value is passed the toggle will be an uncontrolled component with unchecked initial value.

-   Required: No

#### `disabled`: `boolean`

If disabled is true the toggle will be disabled and apply the appropriate styles.

-   Required: No

#### `onChange`: `( value: boolean ) => void`

A function that receives the checked state (boolean) as input.

-   Required: Yes

#### `className`: `string`

The class that will be added with `components-base-control` and `components-toggle-control` to the classes of the wrapper div. If no className is passed only `components-base-control` and `components-toggle-control` are used.

-   Required: No

#### `togglePosition`: `'start' | 'end'`

The position of the toggle switch relative to the label. Use `'start'` to position the toggle before the label (default), or `'end'` to position it after the label.

-   Required: No
-   Default: `'start'`

## Related components

-   For the underlying toggle switch without label and help text, use the `FormToggle` component.
-   To select one option from a set, and you want to show them all the available options at once, use the `RadioControl` component.
-   To select one or more items from a set, use the `CheckboxControl` component.
