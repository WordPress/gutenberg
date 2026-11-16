import type { Slider } from '@base-ui/react/slider';
import type { ComponentProps } from '../../../utils/types';

export type KnobProps = Omit<
	ComponentProps< typeof Slider.Root< number > >,
	| 'orientation'
	| 'minStepsBetweenValues'
	| 'thumbAlignment'
	| 'thumbCollisionBehavior'
	| 'onValueChange'
	| 'onValueCommitted'
	| 'onKeyDown'
> &
	Pick<
		Slider.Thumb.Props,
		'inputRef' | 'getAriaValueText' | 'onKeyDown'
	> & {
		/**
		 * Whether to continue at the opposite end when passing the first or
		 * last value. Both endpoints are selectable. For angles
		 * in whole degrees, use `min={ 0 }`, `max={ 359 }`, and `wrap`.
		 *
		 * @default false
		 */
		wrap?: boolean;
		/**
		 * Sets how many units one clockwise turn adds. Zero points up.
		 * For rotation in degrees, use 360. The dial can count multiple turns
		 * between `min` and `max`. Use a positive, finite number.
		 * By default the entire range fits on the dial in one sweep.
		 * If a step covers a full turn or more, tap the left half to subtract
		 * one step or the right half to add one.
		 */
		unitsPerTurn?: number;
		/**
		 * Called with the new numeric value when the user adjusts the dial.
		 */
		onValueChange?: ( value: number ) => void;
	};
