/**
 * External dependencies
 */
import type {
	CSSProperties,
	FocusEventHandler,
	MouseEventHandler,
	MutableRefObject,
} from 'react';

/**
 * Internal dependencies
 */
import type { BaseControlProps } from '../base-control/types';

export type SliderSizes = 'default' | '__unstable-large';
export type SliderColors = {
	/**
	 * CSS color string to customize the Slider's error state.
	 *
	 * @default CONFIG.controlDestructiveBorderColor
	 */
	errorColor?: CSSProperties[ 'color' ];
	/**
	 * Allows customization of the thumb's color.
	 *
	 * @default COLORS.admin.theme
	 */
	thumbColor?: CSSProperties[ 'color' ];
	/**
	 * CSS color string to customize the track elements foreground color. This
	 * is the portion of the Slider's track representing progress or the actual
	 * value selected.
	 *
	 * @default COLORS.admin.theme
	 */
	trackColor?: CSSProperties[ 'color' ];
	/**
	 * CSS color string to customize the background for the track element.
	 *
	 * @default CONFIG.controlBackgroundDimColor
	 */
	trackBackgroundColor?: CSSProperties[ 'color' ];
};

export type SliderProps = SliderColors & {
	/**
	 * Default value for input.
	 */
	defaultValue?: number;
	/**
	 * Renders an error state.
	 *
	 * @default false
	 */
	error?: boolean;
	/**
	 * Renders focused styles.
	 *
	 * @default false
	 */
	isFocused?: boolean;
	/**
	 * Callback function when the `value` is committed.
	 */
	onChange?: ( value: number ) => void;
	/**
	 * Callback for when the element is hidden.
	 *
	 * @default () => void
	 */
	onHideTooltip?: () => void;
	/**
	 * Callback for when mouse exits the `RangeControl`.
	 *
	 * @default () => void
	 */
	onMouseLeave?: MouseEventHandler< HTMLInputElement >;
	/**
	 * Callback for when mouse moves within the `RangeControl`.
	 *
	 * @default () => void
	 */
	onMouseMove?: MouseEventHandler< HTMLInputElement >;
	/**
	 * Callback for when the element is shown.
	 *
	 * @default () => void
	 */
	onShowTooltip?: () => void;
	/**
	 * Toggles which sized height the slider is rendered at.
	 *
	 * @default 'default'
	 */
	size?: SliderSizes;
	/**
	 * The Slider's current value.
	 */
	value?: number;
};

export type NumericProps = {
	/**
	 * The minimum `value` allowed.
	 *
	 * @default 0
	 */
	min?: number;
	/**
	 * The maximum `value` allowed.
	 *
	 * @default 100
	 */
	max?: number;
	/**
	 * The current value of the range slider.
	 */
	value?: number;
};

export type MarksProps = NumericProps & {
	/**
	 * Disables the `input`, preventing new values from being applied.
	 *
	 * @default false
	 */
	disabled?: boolean;
	/**
	 * Renders a visual representation of `step` ticks. Custom mark indicators
	 * can be provided by an `Array`.
	 *
	 * @default false
	 */
	marks?: boolean | { value: number; label?: string }[];
	/**
	 * The minimum amount by which `value` changes. It is also a factor in
	 * validation as `value` must be a multiple of `step` (offset by `min`) to
	 * be valid. Accepts the special string value `any` that voids the
	 * validation constraint and overrides the `showTooltip` prop to `false`.
	 *
	 * @default 1
	 */
	step?: number | 'any';
};

type RenderTooltipContent = (
	value?: number | '' | null
) => string | number | null | undefined;

export type SliderControlProps = SliderProps &
	MarksProps &
	Pick< BaseControlProps, 'hideLabelFromVision' | 'help' > & {
		/**
		 * If no value exists this prop contains the slider starting position.
		 */
		initialPosition?: number;
		/**
		 * If this property is added, a label will be generated using label
		 * property as the content.
		 */
		label?: string;
		/**
		 * Callback for when `RangeControl` input loses focus.
		 *
		 * @default () => void
		 */
		onBlur?: FocusEventHandler< HTMLInputElement >;
		/**
		 * A function that receives the new value. The value will be less than
		 * `max` and more than `min` unless a reset (enabled by `allowReset`)
		 * has occurred. In which case the value will be either that of
		 * `resetFallbackValue` if it has been specified or otherwise
		 * `undefined`.
		 *
		 * @default () => void
		 */
		onChange?: ( value?: number ) => void;
		/**
		 * Callback for when `RangeControl` input gains focus.
		 *
		 * @default () => void
		 */
		onFocus?: FocusEventHandler< HTMLInputElement >;
		/**
		 * A way to customize the rendered UI of the value.
		 *
		 * @default ( value ) => value
		 */
		renderTooltipContent?: RenderTooltipContent;
		/**
		 * Forcing the Tooltip UI to show or hide. This is overridden to `false`
		 * when `step` is set to the special string value `any`.
		 */
		showTooltip?: boolean;
	};

export type TooltipProps = {
	show?: boolean;
	fillPercentage?: number;
	position?: string;
	inputRef?: MutableRefObject< HTMLElement | undefined >;
	tooltipPosition?: string;
	value?: number | '' | null;
	renderTooltipContent?: RenderTooltipContent;
	zIndex?: number;
};

export type MarkProps = {
	isFilled?: boolean;
	label?: string;
	disabled?: boolean;
	key?: string;
	style?: CSSProperties;
};

export type useMarksDataArgs = NumericProps & {
	marks: boolean | { value: number; label?: string }[];
	step: number;
};

export type UseControlledRangeValueArgs = {
	/**
	 * The initial value.
	 */
	initial?: number;
	/**
	 * The maximum value.
	 */
	max: number;
	/**
	 * The minimum value.
	 */
	min: number;
	/**
	 * The current value.
	 */
	value: number | null;
};

export type UseDebouncedHoverInteractionArgs = {
	/**
	 *  A callback function invoked when the element is hidden.
	 *
	 * @default () => {}
	 */
	onHide?: () => void;
	/**
	 * A callback function invoked when the mouse is moved out of the element.
	 *
	 * @default () => {}
	 */
	onMouseLeave?: MouseEventHandler< HTMLInputElement >;
	/**
	 * A callback function invoked when the mouse is moved.
	 *
	 * @default () => {}
	 */
	onMouseMove?: MouseEventHandler< HTMLInputElement >;
	/**
	 * A callback function invoked when the element is shown.
	 *
	 * @default () => {}
	 */
	onShow?: () => void;
	/**
	 * Timeout before the element is shown or hidden.
	 *
	 * @default 300
	 */
	timeout?: number;
};
