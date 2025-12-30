import type { Slider } from '@base-ui/react/slider';
import type { ComponentProps } from '../../../utils/types';

export type SliderRootProps = ComponentProps< typeof Slider.Root > & {
	children?: Slider.Root.Props[ 'children' ];
	/**
	 * The uncontrolled value of the slider when initially rendered.
	 * Use when you do not need to control its value.
	 */
	defaultValue?: Slider.Root.Props[ 'defaultValue' ];
	/**
	 * The controlled value of the slider.
	 * Must be used in conjunction with `onValueChange`.
	 */
	value?: Slider.Root.Props[ 'value' ];
	/**
	 * Callback function invoked when the slider value changes.
	 * Use when you need to control the value.
	 */
	onValueChange?: Slider.Root.Props[ 'onValueChange' ];
	/**
	 * Callback function invoked when the slider value is committed
	 * (e.g., when the thumb is released after dragging).
	 */
	onValueCommitted?: Slider.Root.Props[ 'onValueCommitted' ];
	/**
	 * The minimum value of the slider.
	 *
	 * @default 0
	 */
	min?: Slider.Root.Props[ 'min' ];
	/**
	 * The maximum value of the slider.
	 *
	 * @default 100
	 */
	max?: Slider.Root.Props[ 'max' ];
	/**
	 * The step increment of the slider.
	 *
	 * @default 1
	 */
	step?: Slider.Root.Props[ 'step' ];
	/**
	 * The large step increment of the slider when pressing Page Up/Down.
	 *
	 * @default 10
	 */
	largeStep?: Slider.Root.Props[ 'largeStep' ];
	/**
	 * The orientation of the slider.
	 *
	 * @default 'horizontal'
	 */
	orientation?: Slider.Root.Props[ 'orientation' ];
	/**
	 * The name of the slider for form submission.
	 */
	name?: Slider.Root.Props[ 'name' ];
	/**
	 * Controls how the thumb aligns with the track.
	 *
	 * - `'center'`: Thumb center aligns with the track edge at min/max values.
	 * - `'edge'`: Thumb edge aligns with the track edge at min/max values.
	 *
	 * @default 'center'
	 */
	thumbAlignment?: Slider.Root.Props[ 'thumbAlignment' ];
	/**
	 * Controls how thumbs behave when they collide.
	 *
	 * - `'push'`: Thumbs push each other when they collide.
	 * - `'swap'`: Thumbs swap positions when they collide.
	 *
	 * @default 'push'
	 */
	thumbCollisionBehavior?: Slider.Root.Props[ 'thumbCollisionBehavior' ];
	/**
	 * The minimum number of steps between values in a range slider.
	 *
	 * @default 0
	 */
	minStepsBetweenValues?: Slider.Root.Props[ 'minStepsBetweenValues' ];
	/**
	 * The locale for formatting the value.
	 */
	locale?: Slider.Root.Props[ 'locale' ];
	/**
	 * The format options for formatting the value.
	 */
	format?: Slider.Root.Props[ 'format' ];
};

export type SliderControlProps = ComponentProps< typeof Slider.Control > & {
	children?: Slider.Control.Props[ 'children' ];
};

export type SliderTrackProps = ComponentProps< typeof Slider.Track > & {
	children?: Slider.Track.Props[ 'children' ];
};

export type SliderIndicatorProps = ComponentProps< typeof Slider.Indicator > & {
	children?: Slider.Indicator.Props[ 'children' ];
};

export type SliderThumbProps = ComponentProps< typeof Slider.Thumb > & {
	children?: Slider.Thumb.Props[ 'children' ];
	/**
	 * The index of the thumb in a range slider.
	 * Required for server-side rendering with multiple thumbs.
	 */
	index?: Slider.Thumb.Props[ 'index' ];
	/**
	 * A function that returns the accessible label for the thumb.
	 */
	getAriaLabel?: Slider.Thumb.Props[ 'getAriaLabel' ];
	/**
	 * A function that returns the accessible value text for the thumb.
	 */
	getAriaValueText?: Slider.Thumb.Props[ 'getAriaValueText' ];
	/**
	 * A ref to the hidden input element.
	 */
	inputRef?: Slider.Thumb.Props[ 'inputRef' ];
	/**
	 * Whether the thumb is disabled.
	 */
	disabled?: Slider.Thumb.Props[ 'disabled' ];
};

export type SliderValueProps = ComponentProps< typeof Slider.Value > & {
	/**
	 * A render function for custom value display.
	 * Receives formatted values as strings and raw values as numbers.
	 */
	children?: Slider.Value.Props[ 'children' ];
};
