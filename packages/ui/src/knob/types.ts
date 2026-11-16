import type { ComponentProps } from '../utils/types';

export type KnobProps = Omit<
	ComponentProps< 'div' >,
	'children' | 'defaultValue' | 'onChange'
> & {
	/**
	 * The angle in degrees (controlled). `0` points up and values increase
	 * clockwise. `null` shows no indicator.
	 *
	 * To render an uncontrolled component, use the `defaultValue` prop instead.
	 */
	value?: number | null;
	/**
	 * The initial angle in degrees (uncontrolled). `null` shows no indicator.
	 * @default 0
	 */
	defaultValue?: number | null;
	/**
	 * Event handler called when the user turns the dial.
	 */
	onValueChange?: ( value: number ) => void;
	/**
	 * The smallest value. Setting `min` or `max` stops the dial at the ends
	 * instead of wrapping, and lets the value go past a full turn.
	 *
	 * Without `min` and `max`, the dial covers one full turn and wraps from
	 * the last step before 360 back to 0.
	 * @default 0
	 */
	min?: number;
	/**
	 * The largest value. See `min`.
	 * @default 360
	 */
	max?: number;
	/**
	 * The amount the value changes by with the arrow keys, and the step that
	 * dragging snaps to.
	 * @default 1
	 */
	step?: number;
	/**
	 * The amount the value changes by with Page Up, Page Down, or an arrow
	 * key while Shift is held.
	 * @default 10
	 */
	largeStep?: number;
	/**
	 * Whether the dial ignores user input.
	 * @default false
	 */
	disabled?: boolean;
	/**
	 * Returns the text that assistive technology announces for the value.
	 * Receives `null` when the value is empty.
	 *
	 * Announces the value in degrees by default.
	 */
	getAriaValueText?: ( value: number | null ) => string;
};
