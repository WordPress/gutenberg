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
import type { IconType } from '../icon';

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

export type RangeStep = number | 'any';
export type RangeMark = { value: number; label?: string };
export type RangeMarks = boolean | RangeMark[];

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
	marks?: RangeMarks;
	/**
	 * The minimum amount by which `value` changes. It is also a factor in
	 * validation as `value` must be a multiple of `step` (offset by `min`) to
	 * be valid. Accepts the special string value `any` that voids the
	 * validation constraint and overrides both `withInputField` and
	 * `showTooltip` props to `false`.
	 *
	 * @default 1
	 */
	step?: RangeStep;
};

export type RangeMarkProps = {
	isFilled?: boolean;
	label?: string;
	disabled?: boolean;
	key?: string;
	style?: CSSProperties;
};

export type ControlledRangeValue = number | '' | null;
export type SetControlledRangeValue = ( value?: number | null ) => void;

type RenderTooltipContentCallback = (
	value?: ControlledRangeValue
) => string | number | null | undefined;

export type RangeControlProps< IconProps = unknown > = Pick<
	BaseControlProps,
	'hideLabelFromVision' | 'help'
> &
	MarksProps & {
		/**
		 * If this property is added, a DashIcon component will be rendered
		 * after the slider with the icon equal to afterIcon.
		 */
		afterIcon?: IconType< IconProps >;
		/**
		 * If this property is true, a button to reset the the slider is
		 * rendered.
		 *
		 * @default false
		 */
		allowReset?: boolean;
		/**
		 * If this property is added, a DashIcon component will be rendered
		 * before the slider with the icon equal to beforeIcon.
		 */
		beforeIcon?: IconType< IconProps >;
		/**
		 * If supplied, this property sets the `color` for the `RangeControl`
		 * wrapper.
		 *
		 * @default `COLORS.ui.theme`
		 * @see /packages/components/src/utils/colors-values.js
		 */
		color?: CSSProperties[ 'color' ];
		/**
		 * The current input to use as a fallback if `value` is currently
		 * `undefined`.
		 */
		currentInput?: number;
		/**
		 * An icon to be shown above the slider next to it's container title.
		 */
		icon?: string;
		/**
		 * If no value exists this prop contains the slider starting position.
		 */
		initialPosition?: number;
		/**
		 * Passed as a prop to the `NumberControl` component and is only
		 * applicable if `withInputField` is true. If true, while the number
		 * input has focus, pressing `UP` or `DOWN` along with the `SHIFT` key
		 * will change the value by the `shiftStep` value.
		 *
		 * @default true
		 */
		isShiftStepEnabled?: boolean;
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
		onChange?: ( value: number ) => void;
		/**
		 * Callback for when `RangeControl` input gains focus.
		 *
		 * @default () => void
		 */
		onFocus?: FocusEventHandler< HTMLInputElement >;
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
		 * Customizes the (background) color of the rail element.
		 */
		railColor?: CSSProperties[ 'color' ];
		/**
		 * A way to customize the rendered UI of the value.
		 *
		 * @default ( value ) => value
		 */
		renderTooltipContent?: RenderTooltipContentCallback;
		/**
		 * The value to revert to if the Reset button is clicked (enabled by
		 * `allowReset`)
		 */
		resetFallbackValue?: number | string | null;
		/**
		 * Define if separator line under/above control row should be disabled
		 * or full width. By default it is placed below excluding underline the
		 * control icon.
		 */
		separatorType?: 'none' | 'fullWidth' | 'topFullWidth';
		/**
		 * Passed as a prop to the `NumberControl` component and is only
		 * applicable if `withInputField` and `isShiftStepEnabled` are both true
		 * and while the number input has focus. Acts as a multiplier of `step`.
		 *
		 * @default 10
		 */
		shiftStep?: number;
		/**
		 * Forcing the Tooltip UI to show or hide. This is overridden to `false`
		 * when `step` is set to the special string value `any`.
		 */
		showTooltip?: boolean;
		/**
		 * Customizes the (background) color of the track element.
		 */
		trackColor?: CSSProperties[ 'color' ];
		/**
		 * Define if the value selection should present a stepper control or a
		 * slider control in the bottom sheet on mobile. To use the stepper set
		 * the type value as `stepper`. Defaults to slider if no option is
		 * provided.
		 */
		type?: 'stepper';
		/**
		 * Determines if the `input` number field will render next to the
		 * RangeControl. This is overridden to `false` when `step` is set to the
		 * special string value `any`.
		 *
		 * @default true
		 */
		withInputField?: boolean;
	};

export type RailProps = MarksProps & {
	railColor?: CSSProperties[ 'color' ];
};

export type InputRangeProps = {
	describedBy?: string;
	label?: string;
	onHideTooltip?: () => undefined;
	onMouseLeave?: MouseEventHandler< HTMLInputElement >;
	onMouseMove?: MouseEventHandler< HTMLInputElement >;
	onShowTooltip?: () => undefined;
	value?: number | '';
};

export type WrapperProps = {
	className?: string;
	color?: CSSProperties[ 'color' ];
	marks?: RangeMarks;
};

export type ThumbProps = {
	isFocused?: boolean;
	disabled?: boolean;
};

export type TooltipProps = {
	show?: boolean;
	position?: string;
	inputRef?: MutableRefObject< HTMLElement | undefined >;
	tooltipPosition?: string;
	value?: ControlledRangeValue;
	renderTooltipContent?: RenderTooltipContentCallback;
	zIndex?: number;
};

export type TrackProps = {
	disabled: boolean;
	trackColor: CSSProperties[ 'color' ];
};

export type useControlledRangeValueProps = {
	initial?: number;
	max: number;
	min: number;
	value: number | null;
};

export type useControlledRangeValueReturn = [
	number | '' | null,
	( nextValue: any ) => void
];

export type useMarksArgs = NumericProps & {
	marks: RangeMarks;
	step: number;
};
