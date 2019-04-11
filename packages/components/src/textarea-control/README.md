# TextareaControl

TextareaControls are TextControls that allow for multiple lines of text, and wrap overflow text onto a new line. They are a fixed height and scroll vertically when the cursor reaches the bottom of the field.

![An empty TextareaControl, and a focused TextareaControl with some content entered.](https://wordpress.org/gutenberg/files/2019/01/TextareaControl.png)

## Table of contents

1. [Design guidelines](http://#design-guidelines)
2. [Development guidelines](http://#development-guidelines)
3. [Related components](http://#related-components)

## Design guidelines

### Usage

#### When to use TextareaControl

Use TextareaControl when you need to encourage users enter an amount of text that’s longer than a single line. (A bigger box can encourage people to be more verbose, where a smaller one encourages them to be succinct.)

TextareaControl should:

- Stand out from the background of the page and indicate that users can input information.
- Have clearly differentiated active/inactive states, including focus styling.
- Make it easy to understand and address any errors via clear and direct error notices.
- Make it easy to understand the requested information by using a clear and descriptive label.

#### When not to use TextareaControl

Do not use TextareaControl if you need to let users enter shorter answers (no longer than a single line), such as a phone number or name. In this case, you should use `Text Control`.

![](https://wordpress.org/gutenberg/files/2019/01/TextareaControl-Answers-Do.png)

**Do**

Use TextareaControl to let users to enter text longer than a single line.

![](https://wordpress.org/gutenberg/files/2019/01/TextareaControl-Answers-Dont.png)

**Don’t**

Use TextareaControl for shorter answers.

## Anatomy

![](https://wordpress.org/gutenberg/files/2019/01/TextareaControl-Anatomy.png)

1. Container
2. Label

### Containers

Containers improve the discoverability of text fields by creating contrast between the text field and surrounding content.

![](https://wordpress.org/gutenberg/files/2019/01/TextareaControl-Stroke-Do.png)

**Do**
Use a stroke around the container, which clearly indicates that users can input information.

![](https://wordpress.org/gutenberg/files/2019/01/TextareaControl-Stroke-Dont.png)

**Don’t**
Use unclear visual markers to indicate a text field.

### Label text

Label text is used to inform users as to what information is requested for a text field. Every text field should have a label. Label text should be above the input field, and always visible. Write labels in sentence capitalization.

### Error text

When text input isn’t accepted, an error message can display instructions on how to fix it. Error messages are displayed below the input line, replacing helper text until fixed.

![](https://wordpress.org/gutenberg/files/2019/01/TextareaControl-Error.png)

## Development guidelines

### Usage

    import { TextareaControl } from '@wordpress/components';
    import { withState } from '@wordpress/compose';

    const MyTextareaControl = withState( {
        text: '',
    } )( ( { text, setState } ) => (
        <TextareaControl
            label="Text"
            help="Enter some text"
            value={ text }
            onChange={ ( text ) => setState( { text } ) }
        />
    ) );


### Props

The set of props accepted by the component will be specified below.

Props not included in this set will be applied to the textarea element.

#### label

If this property is added, a label will be generated using label property as the content.

- Type: `String`
- Required: No

#### help

If this property is added, a help text will be generated using help property as the content.

- Type: `String|WPElement`
- Required: No

#### rows

The number of rows the textarea should contain. Defaults to four.

- Type: `String`
- Required: No
- Default: 4

#### value

The current value of the textarea.

- Type: `String`
- Required: Yes

#### onChange

A function that receives the new value of the textarea each time it changes.

- Type: `function`
- Required: Yes

## Related components

- For a field where users only enter one line of text, use the `TextControl` component.
