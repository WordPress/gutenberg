# ComboboxControl

`ComboboxControl` is an enhanced version of a [`CustomSelectControl`](/packages/components/src/custom-select-control/readme.md), with the addition of being able to search for options using a search input.

## Table of contents

1. [Design guidelines](#design-guidelines)
2. [Development guidelines](#development-guidelines)
3. [Related components](#related-components)

## Design guidelines

These are the same as [the ones for `CustomSelectControl`s](/packages/components/src/select-control/readme.md#design-guidelines), but this component is better suited for when there are too many items to scroll through or load at once so you need to filter them based on user input.

## Development guidelines

### Usage

```jsx
/**
 * WordPress dependencies
 */
import { ComboboxControl } from "@wordpress/components";
import { useState } from "@wordpress/compose";

const options = [
	{
		key: "small",
		name: "Small",
		style: { fontSize: "50%" }
	},
	{
		key: "normal",
		name: "Normal",
		style: { fontSize: "100%" }
	},
	{
		key: "large",
		name: "Large",
		style: { fontSize: "200%" }
	},
	{
		key: "huge",
		name: "Huge",
		style: { fontSize: "300%" }
	}
];

function MyComboboxControl() {
	const [, setFontSize] = useState();
	const [filteredOptions, setFilteredOptions] = useState(options);
	return (
		<ComboboxControl
			label="Font Size"
			options={filteredOptions}
			onInputValueChange={({ inputValue }) =>
				setFilteredOptions(
					options.filter(option =>
						option.name.toLowerCase().startsWith(inputValue.toLowerCase())
					)
				)
			}
			onChange={({ selectedItem }) => setFontSize(selectedItem)}
		/>
	);
}

function MyControlledComboboxControl() {
	const [fontSize, setFontSize] = useState(options[0]);
	const [filteredOptions, setFilteredOptions] = useState(options);
	return (
		<ComboboxControl
			label="Font Size"
			options={filteredOptions}
			onInputValueChange={({ inputValue }) =>
				setFilteredOptions(
					options.filter(option =>
						option.name.toLowerCase().startsWith(inputValue.toLowerCase())
					)
				)
			}
			onChange={({ selectedItem }) => setFontSize(selectedItem)}
			value={options.find(option => option.key === fontSize.key)}
		/>
	);
}
```

### Props

#### className

A custom class name to append to the outer `<div>`.

- Type: `String`
- Required: No

#### hideLabelFromVision

Used to visually hide the label. It will always be visible to screen readers.

- Type: `Boolean`
- Required: No

#### label

The label for the control.

- Type: `String`
- Required: Yes

#### options

The options that can be chosen from.

- Type: `Array<{ key: String, name: String, style: ?{}, ...rest }>`
- Required: Yes

#### onInputValueChange

Function called with the control's search input value changes. The `inputValue` property contains the next input value.

- Type: `Function`
- Required: No

#### onChange

Function called with the control's internal state changes. The `selectedItem` property contains the next selected item.

- Type: `Function`
- Required: No

#### value

Can be used to externally control the value of the control, like in the `MyControlledComboboxControl` example above.

- Type: `Object`
- Required: No

## Related components

- Like this component, but without a search input, the `CustomSelectControl` component.

- To select one option from a set, when you want to show all the available options at once, use the `Radio` component.
- To select one or more items from a set, use the `CheckboxControl` component.
- To toggle a single setting on or off, use the `ToggleControl` component.
