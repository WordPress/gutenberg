# UnitControl

UnitControl allows the user to set a value as well as a unit (e.g. `px`).

## Usage

```jsx
import { __experimentalUnitControl as UnitControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

const Example = () => {
	const [ value, setValue ] = useState( '10px' );

	return <UnitControl onChange={ setValue } value={ value } />;
};
```

## Props

### disabledUnits

If true, the unit `<select>` is hidden.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

### isUnitSelectTabbable

Determines if the unit `<select>` is tabbable.

-   Type: `Boolean`
-   Required: No
-   Default: `true`

### onChange

Callback when the `value` changes.

-   Type: `Function`
-   Required: No
-   Default: `noop`

### onUnitChange

Callback when the `unit` changes.

-   Type: `Function`
-   Required: No
-   Default: `noop`

### size

Adjusts the size of the input.
Sizes include: `default`, `small`

-   Type: `String`
-   Required: No
-   Default: `default`

### unit

Deprecated: Current unit value.
Instead, provide a unit with a value through the `value` prop.

Example:

```jsx
<UnitControl value="50%" />
```

-   Type: `String`
-   Required: No

### units

Collection of available units.

-   Type: `Array<Object>`
-   Required: No

### value

Current value. To set a unit, provide a unit with a value through the `value` prop.

Example:

```jsx
<UnitControl value="50%" />
```

-   Type: `Number`|`String`
-   Required: No
