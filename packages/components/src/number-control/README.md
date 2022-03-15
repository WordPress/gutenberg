# NumberControl

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

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

## Props

### dragDirection

Determines the drag axis to increment/decrement the value.
Directions: `n` | `e` | `s` | `w`

-   Type: `String`
-   Required: No
-   Default: `n`

### dragThreshold

If `isDragEnabled` is true, this controls the amount of `px` to have been dragged before the value changes.

-   Type: `Number`
-   Required: No
-   Default: `10`

### hideHTMLArrows

If true, the default `input` HTML arrows will be hidden.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

### isDragEnabled

If true, enables mouse drag gesture to increment/decrement the number value. Holding `SHIFT` while dragging will increase the value by the `shiftStep`.

-   Type: `Boolean`
-   Required: No

### isShiftStepEnabled

If true, pressing `UP` or `DOWN` along with the `SHIFT` key will increment the value by the `shiftStep` value.

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

### max

The maximum `value` allowed.

-   Type: `Number`
-   Required: No
-   Default: `Infinity`

### min

The minimum `value` allowed.

-   Type: `Number`
-   Required: No
-   Default: `-Infinity`

### onChange

Callback fired whenever the value of the input changes.

The callback receives two arguments:

1. `newValue`: the new value of the input
2. `extra`: an object containing, under the `event` key, the original browser event.

Note that the value received as the first argument of the callback is _not_ guaranteed to be a valid value (e.g. it could be outside of the range defined by the [`min`, `max`] props, or it could not match the `step`). In order to check the value's validity, check the `event.target?.validity.valid` property from the callback's second argument (_note: given how the component works internally, the `validity` property is not guaranteed to always be defined on `event.target`. When the `validity` property is not defined, you can assume the value received as valid_).

-   Type: `(newValue, extra) => void`
-   Required: No

### required

If `true` enforces a valid number within the control's min/max range. If `false` allows an empty string as a valid value.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

### shiftStep

Amount to increment by when the `SHIFT` key is held down. This shift value is a multiplier to the `step` value. For example, if the `step` value is `5`, and `shiftStep` is `10`, each jump would increment/decrement by `50`.

-   Type: `Number`
-   Required: No
-   Default: `10`

### step

Amount by which the `value` is changed when incrementing/decrementing. It is also a factor in validation as `value` must be a multiple of `step` (offset by `min`, if specified) to be valid. Accepts the special string value `any` that voids the validation constraint and causes stepping actions to increment/decrement by `1`.

-   Type: `Number | "any"`
-   Required: No
-   Default: `1`
