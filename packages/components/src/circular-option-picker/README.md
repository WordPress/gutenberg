# `CircularOptionPicker`

<div class="callout callout-alert">
This component is not exported, and therefore can only be used internally to the `@wordpress/components` package.
</div>

`CircularOptionPicker` is a component that displays a set of options as circular buttons.

## Usage

```jsx
import { useState } from 'react';
import { CircularOptionPicker } from '../circular-option-picker';

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

### `className`: `string`

A CSS class to apply to the wrapper element.

- Required: No

### `actions`: `ReactNode`

The action(s) to be rendered after the options, such as a 'clear' button as seen in `ColorPalette`.

Usually a `CircularOptionPicker.ButtonAction` or `CircularOptionPicker.DropdownLinkAction` component.

- Required: No

### `options`: `ReactNode`

The options to be rendered, such as color swatches.

Usually a `CircularOptionPicker.Option` component.

- Required: No

### `children`: `ReactNode`

The child elements.

- Required: No

### `asButtons`: `boolean`

Whether the control should present as a set of buttons, each with its own tab stop.

- Required: No
- Default: `false`

### `loop`: `boolean`

Prevents keyboard interaction from wrapping around. Only used when `asButtons` is not true.

- Required: No
- Default: `true`

## Subcomponents

### `CircularOptionPicker.ButtonAction`

A `ButtonAction` is an action that is rendered as a button alongside the options themselves.

A common use case is a 'clear' button to deselect the currently selected option.

#### Props

##### `className`: `string`

A CSS class to apply to the underlying `Button` component.

- Required: No

##### `children`: `ReactNode`

The button's children.

- Required: No

##### Inherited props

`CircularOptionPicker.ButtonAction` also inherits all of the [`Button` props](/packages/components/src/button/README.md#props), except for `href` and `target`.

### `CircularOptionPicker.DropdownLinkAction`

`CircularOptionPicker.DropdownLinkAction` is an action that's hidden behind a dropdown toggle. The button is formatted as a link and rendered as an `anchor` element.

#### Props

##### `className`: `string`

A CSS class to apply to the underlying `Dropdown` component.

- Required: No

##### `linkText`: `string`

The text to be displayed on the button.

- Required: Yes

##### `dropdownProps`: `object`

The props for the underlying `Dropdown` component.

Inherits all of the [`Dropdown` props](/packages/components/src/dropdown/README.md#props), except for `className` and `renderToggle`.

- Required: Yes

##### `buttonProps`: `object`

Props for the underlying `Button` component.

Inherits all of the [`Button` props](/packages/components/src/button/README.md#props), except for `href`, `target`, and `children`. 

- Required: No
