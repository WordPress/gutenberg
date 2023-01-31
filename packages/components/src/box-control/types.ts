/**
 * Internal dependencies
 */
import type { InputControlProps } from '../input-control/types';
import type { UnitControlProps } from '../unit-control/types';

export type BoxControlValue = {
	top?: string;
	right?: string;
	bottom?: string;
	left?: string;
};

export type BoxControlProps = Pick<
	UnitControlProps,
	'onMouseOver' | 'onMouseOut' | 'units'
> & {
	/**
	 * If this property is true, a button to reset the box control is rendered.
	 *
	 * @default true
	 */
	allowReset?: boolean;
	id?: string;
	/**
	 * Props for the internal `InputControl` components.
	 *
	 * @default `{ min 0 }`
	 */
	inputProps?: InputControlProps;
	/**
	 * Heading label for the control.
	 *
	 * @default `__( 'Box Control' )`
	 */
	label?: string;
	/**
	 * A callback function when an input value changes.
	 */
	onChange?: ( next: BoxControlValue ) => void;
	/**
	 * The `top`, `right`, `bottom`, and `left` box dimension values to use when the control is reset.
	 *
	 * @default `{ top: undefined, right: undefined, bottom: undefined, left: undefined}`
	 */
	resetValues?: BoxControlValue;
	/**
	 * Collection of sides to allow control of. If omitted or empty, all sides will be available.
	 */
	sides?: ( keyof BoxControlValue )[];
	/**
	 * If this property is true, when the box control is unlinked, vertical and horizontal controls
	 * can be used instead of updating individual sides.
	 */
	splitOnAxis?: boolean;
	/**
	 * The current values of the control, expressed as an object of `top`, `right`, `bottom`, and `left` values.
	 */
	values?: BoxControlValue;
};
