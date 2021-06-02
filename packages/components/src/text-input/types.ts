/**
 * Internal dependencies
 */
import type { Props as BaseFieldProps } from '../base-field/hook';
import type { FormElementProps, SizeRangeReduced } from '../utils/types';

export type TextInputArrow = 'stepper' | boolean;
type TextInputFormat = 'number' | 'type';

export type Props = Omit< BaseFieldProps, 'isClickable' | 'isSubtle' > &
	FormElementProps< string > & {
		/**
		 * Renders specified incrementer/decrementer arrows.
		 *
		 * @default true
		 */
		arrows?: TextInputArrow;
		/**
		 * The axis along which to drag a number input's value.
		 */
		dragAxis?: 'x' | 'y';
		/**
		 * Renders an error state.
		 *
		 * @default false
		 */
		error?: boolean;
		/**
		 * Modifies how `value` can be adjusted.
		 *
		 * @default 'text'
		 */
		format?: TextInputFormat;
		/**
		 * The amount of space between each child element.
		 *
		 * @default 2.5
		 */
		gap?: number;
		/**
		 * Enables incrementing/decrementing from non-numeric values, such as `auto`.
		 *
		 * @default false
		 */
		incrementFromNonNumericValue?: boolean;
		/**
		 * Renders a `cursor: pointer` on hover.
		 *
		 * @default false
		 */
		isClickable?: boolean;
		/**
		 * Fires the `onChange` callback after pressing `ENTER` or focusing away.
		 *
		 * @default false
		 */
		isCommitOnBlurOrEnter?: boolean;
		/**
		 * Renders focus styles.
		 *
		 * @default false
		 */
		isFocused?: boolean;
		/**
		 * Renders with rounded corners.
		 *
		 * @default false
		 */
		isRounded?: boolean;
		/**
		 * Enables larger `step` increment/decrement values when holding down `Shift`.
		 *
		 * @default true
		 */
		isShiftStepEnabled?: boolean;
		/**
		 * Allows for the a multiline `TextInput` to tbe resizable by dragging.
		 *
		 * @default false
		 */
		isResizable?: boolean;
		/**
		 * Renders a subtle `TextInput`.
		 *
		 * @default false
		 */
		isSubtle?: boolean;
		/**
		 * Maximum number of rows to show for a multiline `TextInput`.
		 */
		maxRows?: number;
		/**
		 * Alias for `rows`.
		 */
		minRows?: number;
		/**
		 * Renders `TextInput` to allow for multiline lines (`textarea`).
		 *
		 * @default false
		 */
		multiline?: boolean;
		/**
		 * Callback function when the `value` is committed.
		 */
		onChange?: ( value: string ) => void;
		/**
		 * Callback function when the height changes with a multiline `TextInput`.
		 */
		onHeightChange?: ( height: number ) => void;
		/**
		 * Renders prefix content within `TextInput`.
		 */
		prefix?: React.ReactElement;
		/**
		 * Step size when holding shift.
		 *
		 * @default 10
		 */
		shiftStep?: number;
		/**
		 * Determines the size of `TextInput`.
		 */
		size?: SizeRangeReduced;
		/**
		 * Renders prefix content within `TextInput`.
		 */
		suffix?: React.ReactElement;
		/**
		 * Determines if the next `value` should be committed.
		 */
		validate?: ( currentValue: string ) => boolean;
		value?: string;
	};
