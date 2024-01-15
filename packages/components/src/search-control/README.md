# SearchControl

SearchControl components let users display a search control.

Check out the [Storybook page](https://wordpress.github.io/gutenberg/?path=/docs/components-searchcontrol--docs) for a visual exploration of this component.

## Development guidelines

### Usage

Render a user interface to input the name of an additional css class.

```jsx
import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { SearchControl } from '@wordpress/components';

function MySearchControl( { className, setState } ) {
    const [ searchInput, setSearchInput ] = useState( '' );

    return (
        <SearchControl
            label={ __( 'Search posts' ) }
            value={ searchInput }
            onChange={ setSearchInput }
        />
    );
}
```

### Props

The set of props accepted by the component will be specified below.
Props not included in this set will be applied to the input element.

#### label

If this property is added, a label will be generated using label property as the content.

A label should always be provided as an accessibility best practice, even when a placeholder is defined
and `hideLabelFromVision` is `true`.

-   Type: `String`
-   Required: Yes

#### placeholder

If this property is added, a specific placeholder will be used for the input.

-   Type: `String`
-   Required: No
-   Default: `__( 'Search' )`

#### value

The current value of the input.

-   Type: `String`
-   Required: No

#### className

The class that will be added to the classes of the wrapper div.

-   Type: `String`
-   Required: No

#### onChange

A function that receives the value of the input.

-   Type: `function`
-   Required: Yes

#### help

If this property is added, a help text will be generated using help property as the content.

-   Type: `String|Element`
-   Required: No

### hideLabelFromVision

If true, the label will not be visible, but will be read by screen readers. Defaults to `true`.

-   Type: `Boolean`
-   Required: No

#### `size`: `'default'` | `'compact'`

The size of the component.

-   Required: No
-   Default: `'default'`

## Related components

-   To offer users more constrained options for input, use TextControl, SelectControl, RadioControl, CheckboxControl, or RangeControl.
