# UnitControl

UnitControl component allows the user to set a value as well as a unit (e.g. `px`). The allowed units are derived from the (experimental) `theme.json` settings file .

```js
// theme.json
{
	"global": {
		"settings": {
			"spacing": {
				"units": [ "px", "em", "rem", "vh", "vw" ]
			}
		}
	}
}
```

## Table of contents

1. [Development guidelines](#development-guidelines)

## Developer guidelines

### Usage

Renders a control (`input` and `select`) with the values `10` and `px` parsed from `10px`.

```jsx
import { __experimentalUnitControl as UnitControl } from '@wordpress/block-editor/';
import { useState } from '@wordpress/element';

const Example = () => {
	const [ value, setValue ] = useState( '10px' );

	return <UnitControl onChange={ setValue } value={ value } />;
};
```

### Props

#### disabledUnits

If true, the unit `<select>` is hidden.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

### isPressEnterToChange

If true, the `ENTER` key press is required in order to trigger an `onChange`. If enabled, a change is also triggered when tabbing away (`onBlur`).

-   Type: `Boolean`
-   Required: No
-   Default: `false`

#### isUnitSelectTabbable

Determines if the unit `<select>` is tabbable.

-   Type: `Boolean`
-   Required: No
-   Default: `true`

#### label

If this property is added, a label will be generated using label property as the content.

-   Type: `String`
-   Required: No

#### labelPosition

The position of the label (`top`, `side`, `bottom`, or `edge`).

-   Type: `String`
-   Required: No

#### onChange

Callback when the `value` changes.

-   Type: `Function`
-   Required: No
-   Default: `noop`

#### onUnitChange

Callback when the `unit` changes.

-   Type: `Function`
-   Required: No
-   Default: `noop`

#### size

Adjusts the size of the input.
Sizes include: `default`, `small`

-   Type: `String`
-   Required: No
-   Default: `default`

#### units

Collection of available units. These units must be one of the units defined in the `theme.json` settings file.

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

#### value

Current value. To set a unit, provide a unit with a value through the `value` prop.

Example:

```jsx
<UnitControl value="50%" />
```

-   Type: `Number`|`String`
-   Required: No
