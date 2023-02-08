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