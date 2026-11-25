import type { Slider } from '@base-ui/react/slider';
import type { ComponentProps } from '../../../utils/types';

type KnobRange =
	| {
			/**
			 * The lowest selectable value. Set it together with `max` to make
			 * the dial stop at both ends and count turns in between. A range
			 * from −720 to 720 degrees allows two turns in either direction.
			 *
			 * Without `min` and `max`, the dial covers one turn and wraps.
			 */
			min: number;
			/**
			 * The highest selectable value. Set it together with `min`.
			 */
			max: number;
	  }
	| { min?: undefined; max?: undefined };

export type KnobProps = Omit<
	ComponentProps< typeof Slider.Root< number > >,
	| 'min'
	| 'max'
	| 'value'
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
		 * The angle the dial points to (controlled). A wrapping dial shows a
		 * value outside one turn at the same heading, so 450 points where 90
		 * does. A bounded dial shows it at the nearest end.
		 *
		 * Pass `null` when no angle is set. The dial then points to
		 * `placeholder` with a hollow dot.
		 *
		 * To render an uncontrolled dial, use the `defaultValue` prop instead.
		 */
		value?: number | null;
		/**
		 * Where the dial points while `value` is `null`, such as an inherited
		 * angle. The slider reports this number until the user picks one.
		 *
		 * @default 0
		 */
		placeholder?: number;
		/**
		 * How many units a full clockwise turn adds. Zero points up. Use 360
		 * for degrees, 400 for gradians, 1 for turns, and `2 * Math.PI` for
		 * radians.
		 *
		 * @default 360
		 */
		unitsPerTurn?: number;
		/**
		 * The amount that Page Up, Page Down, and Shift with an arrow key
		 * change the value by.
		 *
		 * @default 10 × `step`
		 */
		largeStep?: number;
		/**
		 * Called with the new value when the user turns the dial.
		 */
		onValueChange?: ( value: number ) => void;
	};
