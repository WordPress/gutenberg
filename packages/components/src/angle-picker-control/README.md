<!-- This file is generated automatically and cannot be edited directly. -->

# AnglePickerControl


<p class="callout callout-info">See the <a href="https://wordpress.github.io/gutenberg/?path=/docs/components-anglepickercontrol--docs">WordPress Storybook</a> for more detailed, interactive documentation.</p>

`AnglePickerControl` is a React component to render a UI that allows users to
pick an angle. Users can choose an angle in a visual UI with the mouse by
dragging an angle indicator inside a circle or by directly inserting the
desired angle in a text field.

```jsx
import { useState } from '@wordpress/element';
import { AnglePickerControl } from '@wordpress/components';

function Example() {
  const [ angle, setAngle ] = useState( 0 );
  return (
    <AnglePickerControl
      value={ angle }
      onChange={ setAngle }
    </>
  );
}
```
## Props

### `as`

The HTML element or React component to render the component as.

 - Type: `"symbol" | "object" | "a" | "abbr" | "address" | "area" | "article" | "aside" | "audio" | "b" | ...`
 - Required: No

### `label`

Label to use for the angle picker.

 - Type: `string`
 - Required: No
 - Default: `__( 'Angle' )`

### `onChange`

A function that receives the new value of the input.

 - Type: `(value: number) => void`
 - Required: Yes

### `value`

The current value of the input. The value represents an angle in degrees
and should be a value between 0 and 360.

 - Type: `string | number`
 - Required: Yes
