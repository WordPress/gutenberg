# ComboboxControl

`ComboboxControl` is an enhanced version of a [`SelectControl`](/packages/components/src/select-control/README.md), with the addition of being able to search for options using a search input.

## Design guidelines

These are the same as [the ones for `SelectControl`s](/packages/components/src/select-control/README.md#design-guidelines), but this component is better suited for when there are too many items to scroll through or load at once so you need to filter them based on user input.

## Development guidelines

### Usage

```jsx
import { useState } from 'react';
import { ComboboxControl } from '@wordpress/components';

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
						option.value === inputValue
					)
				)
			}
		/>
	);
}
```

### Props

#### label

The label for the control.

-   Type: `String`
-   Required: Yes

#### hideLabelFromVision

If true, the label will only be visible to screen readers.

-   Type: `Boolean`
-   Required: No

#### help

If this property is added, a help text will be generated using help property as the content.

-   Type: `String`
-   Required: No

#### options

The options that can be chosen from.

-   Type: `Array<{ value: string, label: string, disabled?: boolean }>`
-   Required: Yes

#### onFilterValueChange

Function called when the control's search input value changes. The argument contains the next input value.

-   Type: `( value: string ) => void`
-   Required: No

#### onChange

Function called with the selected value changes.

-   Type: `( value: string | null | undefined ) => void`
-   Required: No

#### value

The current value of the control.

-   Type: `string | null`
-   Required: No

#### __experimentalRenderItem

Custom renderer invoked for each option in the suggestion list. The render prop receives as its argument an object containing, under the `item` key, the single option's data (directly from the array of data passed to the `options` prop).

-   Type: `( args: { item: object } ) => ReactNode`
-   Required: No

## Related components

-   Like this component, but without a search input, the [`CustomSelectControl`](https://developer.wordpress.org/block-editor/reference-guides/components/custom-select-control/) component.

-   To select one option from a set, when you want to show all the available options at once, use the [`RadioControl`](https://developer.wordpress.org/block-editor/reference-guides/components/radio-control/) component.
-   To select one or more items from a set, use the [`CheckboxControl`](https://developer.wordpress.org/block-editor/reference-guides/components/checkbox-control/) component.
-   To toggle a single setting on or off, use the [`ToggleControl`](https://developer.wordpress.org/block-editor/reference-guides/components/toggle-control/) component.
