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

export type RangeMark = { value: number; label?: string };
// An expanded definition of this type is used in MarkProps to improve Storybook
// generated docs.
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
	marks?: boolean | { value: number; label?: string }[];
	/**
	 * The minimum amount by which `value` changes. It is also a factor in
	 * validation as `value` must be a multiple of `step` (offset by `min`) to
	 * be valid. Accepts the special string value `any` that voids the
	 * validation constraint and overrides both `withInputField` and
	 * `showTooltip` props to `false`.
	 *
	 * @default 1
	 */
	step?: number | 'any';
};

export type RangeMarkProps = {
	isFilled?: boolean;
	label?: string;
	disabled?: boolean;
	key?: string;
	style?: CSSProperties;
};

export type ControlledRangeValue = number | '' | null;

export type RangeControlProps = Pick<
	BaseControlProps,
	'hideLabelFromVision' | 'help' | '__nextHasNoMarginBottom'
> &
	MarksProps & {
		/**
		 * If this property is added, an Icon component will be rendered
		 * after the slider with the icon equal to afterIcon.
		 *
		 * For more information on `IconType` see the Icon component:
		 * /packages/components/src/icon/index.tsx
		 */
		afterIcon?: IconType;
		/**
		 * If this property is true, a button to reset the slider is
		 * rendered.
		 *
		 * @default false
		 */
		allowReset?: boolean;
		/**
		 * If this property is added, an Icon component will be rendered
		 * before the slider with the icon equal to beforeIcon.
		 *
		 * For more information on `IconType` see the Icon component:
		 * /packages/components/src/icon/index.tsx
		 */
		beforeIcon?: IconType;
		/**
		 * CSS color string for the `RangeControl` wrapper.
		 *
		 * @default COLORS.ui.theme
		 * @see /packages/components/src/utils/colors-values.js
		 */
		color?: CSSProperties[ 'color' ];
		/**
		 * The current input to use as a fallback if `value` is currently
		 * `undefined`.
		 */
		currentInput?: number;
		/**
		 * An icon to be shown above the slider next to its container title.
		 */
		icon?: string;
		/**
		 * The slider starting position, used when no `value` is passed.
		 * The `initialPosition` will be clamped between the provided `min`
		 * and `max` prop values.
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
		onChange?: ( value?: number ) => void;
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
		 * CSS color string to customize the rail element's background.
		 */
		railColor?: CSSProperties[ 'color' ];
		/**
		 * A way to customize the rendered UI of the value.
		 *
		 * @default ( value ) => value
		 */
		renderTooltipContent?: (
			value?: ControlledRangeValue
		) => string | number | null | undefined;
		/**
		 * The value to revert to if the Reset button is clicked (enabled by
		 * `allowReset`)
		 */
		resetFallbackValue?: number;
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
		 * Start opting into the larger default height that will become the default size in a future version.
		 *
		 * @default false
		 */
		__next40pxDefaultSize?: boolean;
		/**
		 * Forcing the Tooltip UI to show or hide. This is overridden to `false`
		 * when `step` is set to the special string value `any`.
		 */
		showTooltip?: boolean;
		/**
		 * CSS color string to customize the track element's background.
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
	onMouseLeave?: MouseEventHandler< HTMLInputElement >;
	onMouseMove?: MouseEventHandler< HTMLInputElement >;
	value?: number | '';
};

export type WrapperProps = Pick<
	BaseControlProps,
	'__nextHasNoMarginBottom'
> & {
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
	renderTooltipContent?: (
		value?: ControlledRangeValue
	) => string | number | null | undefined;
	zIndex?: number;
};

export type TrackProps = {
	disabled: boolean;
	trackColor: CSSProperties[ 'color' ];
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

export type UseMarksArgs = NumericProps & {
	marks: RangeMarks;
	step: number;
};
