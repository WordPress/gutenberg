# UnitControl

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

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

### isPressEnterToChange

If true, the `ENTER` key press is required in order to trigger an `onChange`. If enabled, a change is also triggered when tabbing away (`onBlur`).

-   Type: `Boolean`
-   Required: No
-   Default: `false`

### isUnitSelectTabbable

Determines if the unit `<select>` is tabbable.

-   Type: `Boolean`
-   Required: No
-   Default: `true`

### label

If this property is added, a label will be generated using label property as the content.

-   Type: `String`
-   Required: No

### labelPosition

The position of the label (`top`, `side`, `bottom`, or `edge`).

-   Type: `String`
-   Required: No

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

Example:

```jsx
import { __experimentalUnitControl as UnitControl } from '@wordpress/block-editor/';

const Example = () => {
	const [ value, setValue ] = useState( '10px' );
	const units = [
		{ value: 'px', label: 'px', default: 0 },
		{ value: '%', label: '%', default: 10 },
		{ value: 'em', label: 'em', default: 0 },
	];

	return <UnitControl onChange={ setValue } value={ value } />;
};
```

A `default` value for (in the example above, `10` for `%`), if defined, is set as the new `value` when a unit changes. This is helpful in scenarios where changing a unit may cause drastic results, such as changing from `px` to `vh`.

### value

Current value. To set a unit, provide a unit with a value through the `value` prop.

Example:

```jsx
<UnitControl value="50%" />
```

-   Type: `Number`|`String`
-   Required: No
