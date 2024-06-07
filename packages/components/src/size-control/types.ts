export type Size = {
	/**
	 * The property `size` contains a number with the font size value, in `px` or
	 * a string specifying the font size CSS property that should be used eg:
	 * "13px", "1em", or "clamp(12px, 5vw, 100px)".
	 */
	size: number | string;
	/**
	 * The `name` property includes a label for that size e.g.: `Small`.
	 */
	name?: string;
	/**
	 * The `slug` property is a string with a unique identifier for the font
	 * size. Used for the class generation process.
	 */
	slug: string;
};

export type SizeControlBaseProps = {
	/**
	 * If no value exists, this prop defines the starting position for the font
	 * size picker slider. Only relevant if `withSlider` is `true`.
	 */
	fallbackValue?: number;
	/**
	 * A function that receives the new font size value.
	 * If onChange is called without any parameter, it should reset the value,
	 * attending to what reset means in that context, e.g., set the font size to
	 * undefined or set the font size a starting value.
	 */
	onChange?: (
		value: number | string | undefined,
		selectedItem?: Size
	) => void;
	/**
	 * Available units for custom font size selection.
	 *
	 * @default `[ 'px', 'em', 'rem' ]`
	 */
	units?: string[];
	/**
	 * The current font size value.
	 */
	value?: number | string;
	/**
	 * If `true`, the UI will contain a slider, instead of a numeric text input
	 * field. If `false`, no slider will be present.
	 *
	 * @default false
	 */
	withSlider?: boolean;
	/**
	 * If `true`, a reset button will be displayed alongside the input field
	 * when a custom font size is active. Has no effect when
	 * `disableCustomFontSizes` or `withSlider` is `true`.
	 *
	 * @default true
	 */
	withReset?: boolean;
	/**
	 * Start opting into the larger default height that will become the default size in a future version.
	 *
	 * @default false
	 */
	__next40pxDefaultSize?: boolean;
	/**
	 * Size of the control.
	 *
	 * @default 'default'
	 */
	size?: 'default' | '__unstable-large';
};

export type SizeControlProps = SizeControlBaseProps & {
	/**
	 * Disables interaction with the control.
	 */
	isDisabled?: boolean;
	/**
	 * Whether the font size has units.
	 */
	hasUnits: boolean;
};
