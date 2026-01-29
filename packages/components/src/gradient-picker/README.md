# GradientPicker

<!-- This file is generated automatically and cannot be edited directly. Make edits via TypeScript types and TSDocs. -->

<p class="callout callout-info">See the <a href="https://wordpress.github.io/gutenberg/?path=/docs/components-gradientpicker--docs">WordPress Storybook</a> for more detailed, interactive documentation.</p>

GradientPicker is a React component that renders a color gradient picker to
define a multi step gradient. There's either a _linear_ or a _radial_ type
available.

```jsx
import { useState } from 'react';
import { GradientPicker } from '@wordpress/components';

const MyGradientPicker = () => {
  const [ gradient, setGradient ] = useState( null );

  return (
    <GradientPicker
      value={ gradient }
      onChange={ ( currentGradient ) => setGradient( currentGradient ) }
      gradients={ [
        {
          name: 'JShine',
          gradient:
            'linear-gradient(135deg,#12c2e9 0%,#c471ed 50%,#f64f59 100%)',
          slug: 'jshine',
        },
        {
          name: 'Moonlit Asteroid',
          gradient:
            'linear-gradient(135deg,#0F2027 0%, #203A43 0%, #2c5364 100%)',
          slug: 'moonlit-asteroid',
        },
        {
          name: 'Rastafarie',
          gradient:
            'linear-gradient(135deg,#1E9600 0%, #FFF200 0%, #FF0000 100%)',
          slug: 'rastafari',
        },
      ] }
    />
  );
};
```

## Props

### `__experimentalIsRenderedInSidebar`

 - Type: `boolean`
 - Required: No
 - Default: `false`

Whether this is rendered in the sidebar.

### `asButtons`

 - Type: `boolean`
 - Required: No
 - Default: `false`

Whether the control should present as a set of buttons,
each with its own tab stop.

### `aria-label`

 - Type: `string`
 - Required: No

A label to identify the purpose of the control.

### `aria-labelledby`

 - Type: `string`
 - Required: No

An ID of an element to provide a label for the control.

### `className`

 - Type: `string`
 - Required: No

The class name added to the wrapper.

### `clearable`

 - Type: `boolean`
 - Required: No
 - Default: `true`

Whether the palette should have a clearing button or not.

### `disableCustomGradients`

 - Type: `boolean`
 - Required: No
 - Default: `false`

If true, the gradient picker will not be displayed and only defined
gradients from `gradients` will be shown.

### `enableAlpha`

 - Type: `boolean`
 - Required: No
 - Default: `true`

Whether to enable alpha transparency options in the picker.

### `gradients`

 - Type: `GradientsProp`
 - Required: No
 - Default: `[]`

An array of objects as predefined gradients displayed above the gradient
selector. Alternatively, if there are multiple sets (or 'origins') of
gradients, you can pass an array of objects each with a `name` and a
`gradients` array which will in turn contain the predefined gradient objects.

### `headingLevel`

 - Type: `1 | 2 | 3 | 4 | 5 | 6 | "1" | "2" | "3" | "4" | ...`
 - Required: No
 - Default: `2`

The heading level. Only applies in cases where gradients are provided
from multiple origins (i.e. when the array passed as the `gradients` prop
contains two or more items).

### `loop`

 - Type: `boolean`
 - Required: No
 - Default: `true`

Prevents keyboard interaction from wrapping around.
Only used when `asButtons` is not true.

### `onChange`

 - Type: `(currentGradient: string) => void`
 - Required: Yes

The function called when a new gradient has been defined. It is passed to
the `currentGradient` as an argument.

### `value`

 - Type: `string`
 - Required: No
 - Default: `'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)'`

The current value of the gradient. Pass a css gradient string (See default value for example).
Optionally pass in a `null` value to specify no gradient is currently selected.
