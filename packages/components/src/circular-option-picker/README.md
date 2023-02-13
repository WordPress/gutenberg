# CircularOptionPicker

CircularOptionPicker is a component that displays a set of options as circular buttons.

## Usage

```jsx
import { CircularOptionPicker } from '@wordpress/components';
import { useState } from '@wordpress/element';

const Example = () => {
	const [ currentColor, setCurrentColor ] = useState();
	const colors = [
		{ color: '#f00', name: 'Red' },
		{ color: '#0f0', name: 'Green' },
		{ color: '#00f', name: 'Blue' },
	];
	const colorOptions = (
		<>
			{ colors.map( ( { color, name }, index ) => {
				return (
					<CircularOptionPicker.Option
						key={ `${ color }-${ index }` }
						tooltipText={ name }
						style={ { backgroundColor: color, color } }
						isSelected={ index === currentColor }
						onClick={ () => setCurrentColor( index ) }
						aria-label={ name }
					/>
				);
			} ) }
		</>
	);
	return (
		<CircularOptionPicker
				options={ colorOptions }
				actions={
					<CircularOptionPicker.ButtonAction
						onClick={ () => setCurrentColor( undefined ) }
					>
						{ 'Clear' }
					</CircularOptionPicker.ButtonAction>
				}
			/>
	);
};
```

## Props

### className

A CSS class to apply to the wrapper element.

- Type: `string`
- Required: No

### actions

The action(s) to be rendered after the options, such as a 'clear' button as seen in `ColorPalette'.

Usually a `CircularOptionPicker.ButtonAction` or `CircularOptionPicker.DropdownLinkAction` component.

- Type: `ReactNode`
- Required: No

### options

The options to be rendered, such as color swatches.

Usually a `CircularOptionPicker.Option` component.

- Type: `ReactNode`
- Required: No

### children

The child elements.

- Type: `ReactNode`
- Required: No

## Subcomponents

### CircularOptionPicker.ButtonAction

A `ButtonAction` is an action that is rendered as a button alongside the options themselves.

A common use case is a 'clear' button to deselect the currently selected option.

#### Props

##### className

A CSS class to apply to the underlying `Button` component.

- Type: `string`
- Required: No

##### children

The button's children.

- Type: `ReactNode`
- Required: No

##### Inherited props

`CircularOptionPicker.ButtonAction` also inherits all of the [`Button` props](/packages/components/src/button/README.md#props), except for `href` and `target`.

### CircularOptionPicker.DropdownLinkAction

`CircularOptionPicker.DropdownLinkAction` is an action that's hidden behind a dropdown toggle. The button is formatted as a link and rendered as an `anchor` element.

#### Props

##### className

A CSS class to apply to the underlying `Dropdown` component.

- Type: `string`
- Required: No

##### linkText

The text to be displayed on the button.

- Type: `string`
- Required: Yes

##### dropdownProps

The props for the underlying `Dropdown` component.

Inherits all of the [`Dropdown` props](/packages/components/src/dropdown/README.md#props), except for `className` and `renderToggle`.

- Type: `object`
- Required: Yes

##### buttonProps

Props for the underlying `Button` component.

Inherits all of the [`Button` props](/packages/components/src/button/README.md#props), except for `href`, `target`, and `children`. 

- Type: `object`
- Required: No
