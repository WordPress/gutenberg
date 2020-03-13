# UnitControl

UnitControl allows the user to set a value as well as a unit (e.g. `px`).

## Usage

```jsx
import { __experimentalUnitControl as UnitControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

const Example = () => {
	const [value, setValue] = useState(10);
	const [unit, setUnit] = useState('px');

	return (
		<UnitControl
			onChange={ setValue }
			onUnitChange={ setUnit }
			unit={ unit }
			value={ value}
		/>
	)
};
```

## Props

Name | Type | Default | Description
--- | --- | --- | ---
`isUnitSelectTabbable` | `boolean` | `true` | Determines if the unit `<select>` is tabbable.
`label` | `string` | | Aria label for the control.
`onChange` | `Function` | `noop` | Callback when the `value` changes.
`onUnitChange` | `Function` | `noop` | Callback when the `unit` changes.
`size` | `string` | `default` | Determines the height of the control.
`unit` | `string` | `px` | Current unit value.
`units` | `Array<string>` | | Collection of available units.
`value` | `number` |  | Current number value.