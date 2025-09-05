# CustomSelectControl

`CustomSelectControl` allows users to select an item from a single-option menu just like [`SelectControl`](/packages/components/src/select-control/readme.md), with the addition of being able to provide custom styles for each item in the menu. This means it does not use a native `<select>`, so should only be used if the custom styling is necessary.

## Design guidelines

These are the same as [the ones for `SelectControl`s](/packages/components/src/select-control/readme.md#design-guidelines).

## Development guidelines

### Usage

```jsx
import { useState } from 'react';
import { CustomSelectControl } from '@wordpress/components';

const options = [
	{
		key: 'small',
		name: 'Small',
		style: { fontSize: '50%' },
	},
	{
		key: 'normal',
		name: 'Normal',
		style: { fontSize: '100%' },
	},
	{
		key: 'large',
		name: 'Large',
		style: { fontSize: '200%' },
	},
	{
		key: 'huge',
		name: 'Huge',
		style: { fontSize: '300%' },
	},
];

function MyCustomSelectControl() {
	const [ , setFontSize ] = useState();
	return (
		<CustomSelectControl
			__next40pxDefaultSize
			label="Font Size"
			options={ options }
			onChange={ ( { selectedItem } ) => setFontSize( selectedItem ) }
		/>
	);
}

function MyControlledCustomSelectControl() {
	const [ fontSize, setFontSize ] = useState( options[ 0 ] );
	return (
		<CustomSelectControl
			__next40pxDefaultSize
			label="Font Size"
			options={ options }
			onChange={ ( { selectedItem } ) => setFontSize( selectedItem ) }
			value={ options.find( ( option ) => option.key === fontSize.key ) }
		/>
	);
}
```

### Props

#### `className`: `string`

Optional classname for the component.

-   Required: No

#### `hideLabelFromVision`: `boolean`

Hide the label visually, while keeping available to assistive technology.

-   Required: No

#### `describedBy`: `string`

Description for the select trigger button used by assistive technology. If no value is passed, the text "Currently selected: selectedItem.name" will be used fully translated.

-   Required: No

#### `label`: `string`

Label for the control.

-   Required: Yes

#### `onChange`: `( newValue: ChangeObject ) => void`

Function called with the control's internal state changes. The `selectedItem` property contains the next selected item.

-   Required: No

#### `options`: `Array< Option >`

The list of options that can be chosen from.

-   Required: Yes

#### `size`: `'default' | 'small' | '\_\_unstable-large'`

The size of the control.

-   Default: `'default'`
-   Required: No

#### `showSelectedHint`: `boolean`

Show the hint of the selected item in the trigger button.

-   Required: No

#### `value`: `Option`

Can be used to externally control the value of the control, like in the `MyControlledCustomSelectControl` example above.

-   Required: No

#### `onMouseOver`: `MouseEventHandler< HTMLButtonElement >`

A handler for `mouseover` events on the trigger button.

-   Required: No

#### `onMouseOut`: `MouseEventHandler< HTMLButtonElement >`

A handler for `mouseout` events on the trigger button.

-   Required: No

#### `onFocus`: `FocusEventHandler< HTMLButtonElement >`

A handler for `focus` events on the trigger button.

-   Required: No

#### `onBlur`: `FocusEventHandler< HTMLButtonElement >`

A handler for `blur` events on the trigger button.

-   Required: No

#### `__next40pxDefaultSize`: `boolean`

Start opting into the larger default height that will become the default size in a future version.

- Required: No
- Default: `false`

## Related components

-   Like this component, but implemented using a native `<select>` for when custom styling is not necessary, the `SelectControl` component.

-   To select one option from a set, when you want to show all the available options at once, use the `Radio` component.
-   To select one or more items from a set, use the `CheckboxControl` component.
-   To toggle a single setting on or off, use the `ToggleControl` component.

-   If you have a lot of items, `ComboboxControl` might be a better fit.
