# ComboboxControl

`ComboboxControl` is an enhanced version of a [`SelectControl`](/packages/components/src/select-control/README.md), with the addition of being able to search for options using a search input.

## Table of contents

1. [Design guidelines](#design-guidelines)
2. [Development guidelines](#development-guidelines)
3. [Related components](#related-components)

## Design guidelines

These are the same as [the ones for `SelectControl`s](/packages/components/src/select-control/README.md#design-guidelines), but this component is better suited for when there are too many items to scroll through or load at once so you need to filter them based on user input.

## Development guidelines

### Usage

```jsx
/**
 * WordPress dependencies
 */
import { ComboboxControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

const options = [
	{
		value: 'small',
		label: 'Small',
	},
	{
		value: 'normal',
		label: 'Normal',
	},
	{
		value: 'large',
		label: 'Large',
	},
	{
		value: 'huge',
		label: 'Huge',
	},
];

function MyComboboxControl() {
	const [ fontSize, setFontSize ] = useState();
	const [ filteredOptions, setFilteredOptions ] = useState( options );
	return (
		<ComboboxControl
			label="Font Size"
			value={ fontSize }
			onChange={ setFontSize }
			options={ filteredOptions }
			onFilterValueChange={ ( inputValue ) =>
				setFilteredOptions(
					options.filter( ( option ) =>
						option.label
							.toLowerCase()
							.startsWith( inputValue.toLowerCase() )
					)
				)
			}
		/>
	);
}
```

### Props

#### `allowReset`: `boolean`

Whether to render a reset button.

-   Required: No
-   Default: true

#### `className`: `string`

The component class name.

-   Required: No

#### `help`: `string`

If this property is added, a help text will be generated using help property as the content.

-   Required: No

#### `hideLabelFromVision`: `boolean`

If true, the label will only be visible to screen readers.

-   Required: No

#### `label`: `string`

The label for the control.

-   Required: Yes

#### `onChange`: `( selectedValue: string ) => void`

Function called with the selected value changes.

-   Required: No

#### `onFilterValueChange`: `( nextInput: string ) => void`

Function called with the control's search input value changes. The argument contains the next input value.

-   Required: No

#### `messages`: `Record< string, string >`

Messages to display.

-   Required: No
-   Default: `{ selected: __( 'Item selected.' ) }`

`onChange`: `( selectedValue: string ) => void`

Function called with the selected value changes.

-   Required: No

`onFilterValueChange`: `( nextInput: string ) => void`

Function called with the control's search input value changes. The argument contains the next input value.

-   Required: No
-   Default: `() => void`

#### `options`: `Array< { value: string; label: string } >`

The options that can be chosen from.

-   Required: Yes

#### `value`: `string`

The current value of the input.

-   Required: No

#### `__experimentalRenderItem`: `( args: { item: Record< string, string > ) => ReactNode )`

Custom renderer invoked for each option in the suggestion list. The render prop receives as its argument an object containing, under the `item` key, the single option's data (directly from the array of data passed to the `options` prop).

-   Required: No

## Related components

-   Like this component, but without a search input, the `CustomSelectControl` component.

-   To select one option from a set, when you want to show all the available options at once, use the `Radio` component.
-   To select one or more items from a set, use the `CheckboxControl` component.
-   To toggle a single setting on or off, use the `ToggleControl` component.
