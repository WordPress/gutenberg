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
> &
	Pick< Slider.Thumb.Props, 'inputRef' | 'getAriaValueText' > & {
		/**
		 * Whether the dial turns through a full circle and continues from the
		 * opposite end of the range. Both endpoints are selectable. For angles
		 * in whole degrees, use `min={ 0 }`, `max={ 359 }`, and `wrap`.
		 *
		 * @default false
		 */
		wrap?: boolean;
		/**
		 * Called with the new numeric value when the user adjusts the dial.
		 */
		onValueChange?: ( value: number ) => void;
	};
