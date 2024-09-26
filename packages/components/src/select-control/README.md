# SelectControl

SelectControl allow users to select from a single or multiple option menu. It functions as a wrapper around the browser's native `<select>` element.

![A “Link To” select with “none” selected.](https://wordpress.org/gutenberg/files/2018/12/select.png)

## Design guidelines

### Usage

#### When to use a select control

Use a select control when:

-   You want users to select one or more options from a list.
-   There is a strong default option.
-   There is little available space.
-   The contents of the hidden part of the menu are obvious from its label and the one selected item. For example, if you have an option menu labelled “Month:” with the item “January” selected, the user might reasonably infer that the menu contains the 12 months of the year without having to look.

If you have a shorter list of options, consider using RadioControl instead.

![](https://wordpress.org/gutenberg/files/2018/12/select-do-multiple.png)

**Do**
Use selects when you have multiple options.

![](https://wordpress.org/gutenberg/files/2018/12/select-dont-binary.png)

**Don’t**
Use selects for binary questions.

### Behavior

A SelectControl includes a double-arrow indicator. The menu appears layered over the select.

#### Opening and Closing

Once the menu is displayed onscreen, it remains open until the user chooses a menu item, clicks outside of the menu, or switches to another browser tab.

### Content Guidelines

#### Labels

Label the SelectControl with a text label above it, or to its left, using sentence capitalization. Clicking the label allows the user to focus directly on the select.

![](https://wordpress.org/gutenberg/files/2018/12/select-do-position.png)

**Do**
Position the label above, or to the left of, the select.

![](https://wordpress.org/gutenberg/files/2018/12/select-dont-position.png)

**Don’t**
Position the label centered over the select, or right aligned against the side of the select.

**Menu Items**

-   Menu items should be short — ideally, single words — and use sentence capitalization.
-   Do not use full sentences inside menu items.
-   Ensure that menu items are ordered in a way that is most useful to users. Alphabetical or recency ordering is preferred.

![](https://wordpress.org/gutenberg/files/2018/12/select-do-options.png)

**Do**
Use short menu items.

![](https://wordpress.org/gutenberg/files/2018/12/select-dont-options.png)

**Don’t**
Use sentences in your menu.

## Development guidelines

### Usage

Render a user interface to select the size of an image.

```jsx
import { useState } from 'react';
import { SelectControl } from '@wordpress/components';

const MySelectControl = () => {
	const [ size, setSize ] = useState( '50%' );

	return (
		<SelectControl
			label="Size"
			value={ size }
			options={ [
				{ label: 'Big', value: '100%' },
				{ label: 'Medium', value: '50%' },
				{ label: 'Small', value: '25%' },
			] }
			onChange={ ( newSize ) => setSize( newSize ) }
			__nextHasNoMarginBottom
		/>
	);
};
```

Render a user interface to select multiple users from a list.

```jsx
<SelectControl
	multiple
	label={ __( 'User' ) }
	value={ this.state.users } // e.g: value = [ 'a', 'c' ]
	onChange={ ( users ) => {
		this.setState( { users } );
	} }
	options={ [
		{ value: '', label: 'Select a User', disabled: true },
		{ value: 'a', label: 'User A' },
		{ value: 'b', label: 'User B' },
		{ value: 'c', label: 'User c' },
	] }
	__nextHasNoMarginBottom
/>
```

Render a user interface to select items within groups

```jsx
const [ item, setItem ] = useState( '' );

// ...

<SelectControl
    label={ __( 'My dinosaur' ) }
    value={ item } // e.g: value = 'a'
    onChange={ ( selection ) => { setItem( selection ) } }
    __nextHasNoMarginBottom
>
	<optgroup label="Theropods">
		<option value="Tyrannosaurus">Tyrannosaurus</option>
		<option value="Velociraptor">Velociraptor</option>
		<option value="Deinonychus">Deinonychus</option>
	</optgroup>
	<optgroup label="Sauropods">
		<option value="Diplodocus">Diplodocus</option>
		<option value="Saltasaurus">Saltasaurus</option>
		<option value="Apatosaurus">Apatosaurus</option>
	</optgroup>
</SelectControl>
```

### Props

-   The set of props accepted by the component will be specified below.
-   Props not included in this set will be applied to the select element.
-   One important prop to refer is `value`. If `multiple` is `true`, `value` should be an array with the values of the selected options.
-   If `multiple` is `false`, `value` should be equal to the value of the selected option.

#### label

If this property is added, a label will be generated using label property as the content.

-   Type: `String`
-   Required: No

#### labelPosition

The position of the label (`top`, `side`, or `bottom`).

-   Type: `String`
-   Required: No

#### hideLabelFromVision

If true, the label will only be visible to screen readers.

-   Type: `Boolean`
-   Required: No

#### help

If this property is added, a help text will be generated using help property as the content.

-   Type: `String|Element`
-   Required: No

#### multiple

If this property is added, multiple values can be selected. The `value` passed should be an array.

In most cases, it is preferable to use the `FormTokenField` or `CheckboxControl` components instead.

-   Type: `Boolean`
-   Required: No

#### options

An array of objects containing the following properties, as well as any other `option` element attributes:

-   `label`: (string) The label to be shown to the user.
-   `value`: (string) The internal value used to choose the selected value. This is also the value passed to onChange when the option is selected.
-   `disabled`: (boolean) Whether or not the option should have the disabled attribute.
-   Type: `Array`
-   Required: No

#### children

An alternative to the `options` prop.
Use the `children` prop to have more control on the style of the items being rendered, like `optgroup`s or `options` and possibly avoid re-rendering due to the reference update on the `options` prop.
- Type: `ReactNode`
- Required: No

#### onChange

A function that receives the value of the new option that is being selected as input.
If multiple is true the value received is an array of the selected value.
If multiple is false the value received is a single value with the new selected value.

-   Type: `function`
-   Required: Yes

#### value

The value of the selected option. If `multiple` is true, the `value` should be an array with the values of the selected options.

-   Type: `String|String[]`
-   Required: No

#### variant

The style variant of the control.

-   Type: `'default' | 'minimal'`
-   Required: No
-   Default: `'default'`

### __next40pxDefaultSize

Start opting into the larger default height that will become the default size in a future version.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

### __nextHasNoMarginBottom

Start opting into the new margin-free styles that will become the default in a future version.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

## Related components

-   To select one option from a set, and you want to show them all the available options at once, use the `Radio` component.
-   To select one or more items from a set, use the `CheckboxControl` component.
-   To toggle a single setting on or off, use the `ToggleControl` component.
