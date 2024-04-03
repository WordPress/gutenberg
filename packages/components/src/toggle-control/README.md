# ToggleControl

ToggleControl is used to generate a toggle user interface.

## Usage

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
			onChange={ (newValue) => {
				setHasFixedBackground( newValue );
			} }
		/>
	);
};
```

## Props

The component accepts the following props:

### label

If this property is added, a label will be generated using label property as the content.

-   Type: `String`
-   Required: No

### help

If this property is added, a help text will be generated using help property as the content.
For controlled components the `help` prop can also be a function which will return a help text
dynamically depending on the boolean `checked` parameter.

-   Type: `String|Element|Function`
-   Required: No

### checked

If checked is true the toggle will be checked. If checked is false the toggle will be unchecked.
If no value is passed the toggle will be an uncontrolled component with unchecked initial value.

-   Type: `Boolean`
-   Required: No

### disabled

If disabled is true the toggle will be disabled and apply the appropriate styles.

-   Type: `Boolean`
-   Required: No

### onChange

A function that receives the checked state (boolean) as input.

-   Type: `function`
-   Required: No

### className

The class that will be added with `components-base-control` and `components-toggle-control` to the classes of the wrapper div. If no className is passed only `components-base-control` and `components-toggle-control` are used.

-		Type: `String`
-		Required: No
