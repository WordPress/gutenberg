import type { Slider } from '@base-ui/react/slider';
import type { ComponentProps } from '../../../utils/types';

type KnobRange =
	| {
			/**
			 * The lowest selectable value, in steps. Set it together with
			 * `max` to make the dial stop at both ends and count turns in
			 * between. With the default 360 steps per turn, a range from
			 * −720 to 720 allows two turns in either direction.
			 *
			 * Without `min` and `max`, the dial covers one turn and wraps.
			 * A bounded range needs at least two steps.
			 */
			min: number;
			/**
			 * The highest selectable value, in steps. Set it together with
			 * `min`.
			 */
			max: number;
	  }
	| { min?: undefined; max?: undefined };

export type KnobProps = Omit<
	ComponentProps< typeof Slider.Root< number > >,
	| 'min'
	| 'max'
	| 'value'
	| 'step'
	| 'orientation'
	| 'minStepsBetweenValues'
	| 'thumbAlignment'
	| 'thumbCollisionBehavior'
	| 'onValueChange'
	| 'onValueCommitted'
	| 'onKeyDown'
> &
	Pick< Slider.Thumb.Props, 'inputRef' | 'getAriaValueText' | 'onKeyDown' > &
	KnobRange & {
		/**
		 * The value the dial points to, in steps (controlled). The dial shows
		 * it at the nearest whole step. A wrapping dial shows a value outside
		 * one turn at the same heading, so 450 points where 90 does. A
		 * bounded dial shows a value outside its range at the nearest end.
		 *
		 * Pass `null` when no value is set. The dial then points to
		 * `placeholder` with a hollow dot.
		 *
		 * To render an uncontrolled dial, use the `defaultValue` prop instead.
		 */
		value?: number | null;
		/**
		 * Where the dial points while `value` is `null`, such as an inherited
		 * angle. The slider reports the nearest step until the user picks a
		 * value.
		 *
		 * @default 0
		 */
		placeholder?: number;
		/**
		 * How many steps make a full clockwise turn. It is a whole number of at least 2,
		 * and it sets what one step of the value means: a degree by default,
		 * a gradian with 400, or a hundredth of a turn with 100. Zero points
		 * up. The dial counts in whole steps only. Show other units, such as
		 * radians or decimals, by converting the value outside the dial.
		 *
		 * @default 360
		 */
		stepsPerTurn?: number;
		/**
		 * The number of steps that Page Up, Page Down, and Shift with an
		 * arrow key change the value by.
		 *
		 * @default 10
		 */
		largeStep?: number;
		/**
		 * Called with the new value when the user turns the dial.
		 */
		onValueChange?: ( value: number ) => void;
	};
