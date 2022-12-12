# RadioGroup

<div class="callout callout-alert">
This component is deprecated. Consider using `RadioControl` or `ToggleGroupControl` instead.
</div>

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

Use a RadioGroup component when you want users to select one option from a small set of options.

![RadioGroup component](https://wordpress.org/gutenberg/files/2018/12/s_96EC471FE9C9D91A996770229947AAB54A03351BDE98F444FD3C1BF0CED365EA_1541792995815_ButtonGroup.png)

## Table of contents

1. [Design guidelines](#design-guidelines)
2. [Development guidelines](#development-guidelines)
3. [Related components](#related-components)

## Design guidelines

### Usage

#### Selected action

Only one option in a radio group can be selected and active at a time. Selecting one option deselects any other.

### Best practices

Radio groups should:

-   **Be clearly and accurately labeled.**
-   **Clearly communicate that clicking or tapping will trigger an action.**
-   **Use established colors appropriately.** For example, only use red buttons for actions that are difficult or impossible to undo.
-   **Have consistent locations in the interface.**
-   **Have a default option already selected.**

### States

#### Active and available radio groups

A radio group’s state makes it clear which option is active. Hover and focus states express the available selection options for buttons in a button group.

#### Disabled radio groups

Radio groups that cannot be selected can either be given a disabled state, or be hidden.

## Development guidelines

### Usage

#### Controlled

```jsx
import {
	__experimentalRadio as Radio,
	__experimentalRadioGroup as RadioGroup,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyControlledRadioRadioGroup = () => {
	const [ checked, setChecked ] = useState( '25' );
	return (
		<RadioGroup label="Width" onChange={ setChecked } checked={ checked }>
			<Radio value="25">25%</Radio>
			<Radio value="50">50%</Radio>
			<Radio value="75">75%</Radio>
			<Radio value="100">100%</Radio>
		</RadioGroup>
	);
};
```

#### Uncontrolled

When using the RadioGroup component as an uncontrolled component, the default value can be set with the `defaultChecked` prop.

```jsx
import {
	__experimentalRadio as Radio,
	__experimentalRadioGroup as RadioGroup,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyUncontrolledRadioRadioGroup = () => {
	return (
		<RadioGroup label="Width" defaultChecked="25">
			<Radio value="25">25%</Radio>
			<Radio value="50">50%</Radio>
			<Radio value="75">75%</Radio>
			<Radio value="100">100%</Radio>
		</RadioGroup>
	);
};
```

## Related components

-   For simple buttons that are related, use a `ButtonGroup` component.
-   For traditional radio options, use a `RadioControl` component.
