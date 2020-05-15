# NumberControl

NumberControl is an enhanced HTML [`input[type="number]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number) element.

## Usage

```jsx
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';

const Example = () => {
	const [value, setValue] = useState(10);

	return (
		<NumberControl
			isShiftStepEnabled={ true }
			onChange={ setValue }
			shiftStep={ 10 }
			value={ value }
		/>
	)
};
```

## Props

Name | Type | Default | Description
--- | --- | --- | ---
`isShiftStepEnabled` | `boolean` | `true` | Determines if the unit `<select>` is tabbable.
`shiftStep` | `number` | `10` | Amount to increment by when the `shift` key is held down.