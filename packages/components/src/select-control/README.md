# SelectControl

SelectControl allow users to select from a single-option menu. It functions as a wrapper around the browser's native `<select>` element.

![A “Link To” select with “none” selected.](https://wordpress.org/gutenberg/files/2018/12/select.png)

## Table of contents

1. [Design guidelines](http://##design-guidelines)
2. [Development guidelines](http://##development-guidelines)
3. [Related components](http://##related-components)

## Design guidelines

### Usage

#### When to use a select control

Use a select control when: 

- You want users to select a single option from a list.
- There is a strong default option.
- There is little available space.
- The contents of the hidden part of the menu are obvious from its label and the one selected item. For example, if you have an option menu labelled “Month:” with the item “January” selected, the user might reasonably infer that the menu contains the 12 months of the year without having to look.

If you have a shorter list of options, or need all of the options visible to the user, consider using RadioControl instead.

![](https://wordpress.org/gutenberg/files/2018/12/select-do-multiple.png)

**Do**
Use selects when you have multiple options, and can only choose one.

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

- Menu items should be short — ideally, single words — and use sentence capitalization.
- Do not use full sentences inside menu items.
- Ensure that menu items are ordered in a way that is most useful to users. Alphabetical or recency ordering is preferred.

![](https://wordpress.org/gutenberg/files/2018/12/select-do-options.png)

**Do**
Use short menu items.

![](https://wordpress.org/gutenberg/files/2018/12/select-dont-options.png)

**Don’t**
Use sentences in your menu.

## Development guidelines

### Usage

Render a user interface to select the size of an image.

    import { SelectControl } from '@wordpress/components';
    import { withState } from '@wordpress/compose';
    
    const MySelectControl = withState( {
        size: '50%',
    } )( ( { size, setState } ) => ( 
        <SelectControl
            label="Size"
            value={ size }
            options={ [
                { label: 'Big', value: '100%' },
                { label: 'Medium', value: '50%' },
                { label: 'Small', value: '25%' },
            ] }
            onChange={ ( size ) => { setState( { size } ) } }
        />
    ) );

Render a user interface to select multiple users from a list.

        <SelectControl
            multiple
            label={ __( 'Select some users:' ) }
            value={ this.state.users } // e.g: value = [ 'a', 'c' ]
            onChange={ ( users ) => { this.setState( { users } ) } }
            options={ [
                { value: 'a', label: 'User A' },
                { value: 'b', label: 'User B' },
                { value: 'c', label: 'User c' },
            ] }
        />

### Props


- The set of props accepted by the component will be specified below.
- Props not included in this set will be applied to the select element.
- One important prop to refer is `value`. If `multiple` is `true`, `value` should be an array with the values of the selected options.
- If `multiple` is `false`, `value` should be equal to the value of the selected option.

#### label

If this property is added, a label will be generated using label property as the content.
- Type: `String`
- Required: No

#### help

If this property is added, a help text will be generated using help property as the content.
- Type: `String`
- Required: No

#### multiple

If this property is added, multiple values can be selected. The value passed should be an array.
- Type: `Boolean`
- Required: No

#### options

An array of objects containing the following properties:
- `label`: (string) The label to be shown to the user.
- `value`: (Object) The internal value used to choose the selected value. This is also the value passed to onChange when the option is selected.
- Type: `Array`
- Required: No

#### onChange

A function that receives the value of the new option that is being selected as input.
If multiple is true the value received is an array of the selected value.
If multiple is false the value received is a single value with the new selected value.
- Type: `function`
- Required: Yes

## Related components

- To select one option from a set, and you want to show them all the available options at once, use the `Radio` component.
- To select one or more items from a set, use the `CheckboxControl` component.
- To toggle a single setting on or off, use the `ToggleControl` component.
