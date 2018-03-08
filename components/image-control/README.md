ImageControl
=======

ImageControl is used to add/upload media field.


## Usage

Render a user interface to input the name of an additional CSS class.
```jsx
    <ImageControl
        label="Background image"
        value={ value }
        help="Select or upload an image"
        onSelect={ onSelect }
    />
```

## Props

The set of props accepted by the component will be specified below.
Props not included in this set will be applied to the MediaUpload component.

### label

If this property is added, a label will be generated using label property as the content.

- Type: `String`
- Required: No

### help

If this property is added, a help text will be generated using help property as the content.

- Type: `String`
- Required: No

### value

URL of image to be displayed preselected.

- Type: `String`
- Required: No

### onSelect

Callback called when the media modal is closed, the selected media are passed as an argument.

- Type: `Func`
- Required: Yes

## render

A callback invoked to render the Button opening the media library.

- Type: `Function`
- Required: No

The first argument of the callback is an object containing the following properties:

 - `open`: A function opening the media modal when called
