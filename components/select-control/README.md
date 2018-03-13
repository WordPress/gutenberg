SelectControl
=======

SelectControl component is used to generate select input fields.


## Usage

Render a user interface to select the size of an image.
```jsx
	<SelectControl
		label={ __( 'Size' ) }
		value={ size }
		options={ map( availableSizes, ( size, name ) => ( {
			value: size,
			label: startCase( name ),
		} ) ) }
		onChange={ onChange }
	/>
```

## Props

The set of props accepted by the component will be specified below.
Props not included in this set will be applied to the select element.

### label

If this property is added, a label will be generated using label property as the content.

- Type: `String`
- Required: No

### help

If this property is added, a help text will be generated using help property as the content.

- Type: `String`
- Required: No

### options

An array of objects containing the following properties:
* `label`: (string) The label to be shown to the user.
* `value`: (Object) The internal value used to choose the selected value. This is also the value passed to onChange when the option is selected.

- Type: `Array`
- Required: No

### onChange

A function that receives the value of the new option that is being selected as input.

- Type: `function`
- Required: Yes
