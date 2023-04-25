# SearchControl

SearchControl components let users display a search control.


## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Render a user interface to input the name of an additional css class.

```jsx
import { SearchControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

function MySearchControl( { className, setState } ) {
    const [ searchInput, setSearchInput ] = useState( '' );

    return (
        <SearchControl
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

-   Type: `String|WPElement`
-   Required: No
### hideLabelFromVision

If true, the label will only be visible to screen readers.

-   Type: `Boolean`
-   Required: No

## Related components

-   To offer users more constrained options for input, use TextControl, SelectControl, RadioControl, CheckboxControl, or RangeControl.
