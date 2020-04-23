# NumberControl

NumberControl is an enhanced HTML [`input[type="number]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number) element.

## Usage

```jsx
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';

const Example = () => {
	const [ value, setValue ] = useState( 10 );

	return (
		<NumberControl
			isShiftStepEnabled={ true }
			onChange={ setValue }
			shiftStep={ 10 }
			value={ value }
		/>
	);
};
```

### Props

#### dragDirection

Determines the drag axis to increment/decrement the value.
Directions: `n` | `e` | `s` | `w`

-   Type: `String`
-   Required: No
-   Default: `n`

#### dragThreshold

If `isDragEnabled` is true, this controls the amount of `px` to have been dragged before the value changes.

-   Type: `Number`
-   Required: No
-   Default: `10`

#### hideHTMLArrows

If true, the default `input` HTML arrows will be hidden.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

#### isDragEnabled

If true, enables mouse drag gesture to increment/decrement the number value. Holding `SHIFT` while dragging will increase the value by the `shiftStep`.

-   Type: `Boolean`
-   Required: No
-   Default: `true`

#### isPressEnterToChange

If true, the `ENTER` key press is required in order to trigger an `onChange`. If enabled, a change is also triggered when tabbing away (`onBlur`).

-   Type: `Boolean`
-   Required: No
-   Default: `false`

#### isShiftStepEnabled

If true, pressing `UP` or `DOWN` along with the `SHIFT` key will increment the value by the `shiftStep` value.

-   Type: `Boolean`
-   Required: No
-   Default: `true`

#### shiftStep

Amount to increment by when the `SHIFT` key is held down.

-   Type: `Number`
-   Required: No
-   Default: `10`

#### step

Amount to increment by when incrementing/decrementing.

-   Type: `Number`
-   Required: No
-   Default: `1`
