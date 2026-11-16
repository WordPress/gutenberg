import type { ComponentProps } from '../utils/types';

export type KnobUnit = 'deg' | 'turn' | 'rad' | 'grad';

export type KnobProps = Omit<
	ComponentProps< 'div' >,
	'children' | 'defaultValue' | 'onChange'
> & {
	/**
	 * The angle in `unit` (controlled). `0` points up and values increase
	 * clockwise. `null` shows no indicator.
	 *
	 * To render an uncontrolled component, use the `defaultValue` prop instead.
	 */
	value?: number | null;
	/**
	 * The initial angle in `unit` (uncontrolled). `null` shows no indicator.
	 * @default 0
	 */
	defaultValue?: number | null;
	/**
	 * Event handler called when the user turns the dial.
	 */
	onValueChange?: ( value: number ) => void;
	/**
	 * The CSS angle unit for `value`, `defaultValue`, `min`, `max`, `step`
	 * and `largeStep`.
	 * @default 'deg'
	 */
	unit?: KnobUnit;
	/**
	 * The smallest value. Setting `min` or `max` stops the dial at the ends
	 * instead of wrapping, and lets the value go past a full turn.
	 *
	 * Without `min` and `max`, the dial covers one full turn and wraps from
	 * the last step before a full turn back to 0.
	 * @default 0
	 */
	min?: number;
	/**
	 * The largest value. See `min`.
	 * @default One full turn, for example 360 in `deg` or 1 in `turn`.
	 */
	max?: number;
	/**
	 * The amount the value changes by with the arrow keys, and the step that
	 * dragging snaps to.
	 * @default 1 in `deg` and `grad`, 0.01 in `turn` and `rad`.
	 */
	step?: number;
	/**
	 * The amount the value changes by with Page Up, Page Down, or an arrow
	 * key while Shift is held.
	 * @default 10 in `deg` and `grad`, 0.1 in `turn` and `rad`.
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
	 * Announces the value with its unit by default, for example
	 * "90 degrees" or "0.25 turns".
	 */
	getAriaValueText?: ( value: number | null ) => string;
};
