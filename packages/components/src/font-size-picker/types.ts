export type FontSizePickerProps = {
	/**
	 * If `true`, it will not be possible to choose a custom fontSize. The user
	 * will be forced to pick one of the pre-defined sizes passed in fontSizes.
	 *
	 * @default false
	 */
	disableCustomFontSizes?: boolean;
	/**
	 * If no value exists, this prop defines the starting position for the font
	 * size picker slider. Only relevant if `withSlider` is `true`.
	 */
	fallbackFontSize?: number;
	/**
	 * An array of font size objects. The object should contain properties size,
	 * name, and slug.
	 */
	fontSizes?: FontSize[];
	/**
	 * A function that receives the new font size value.
	 * If onChange is called without any parameter, it should reset the value,
	 * attending to what reset means in that context, e.g., set the font size to
	 * undefined or set the font size a starting value.
	 */
	onChange?: (
		value: number | string | undefined,
		selectedItem?: FontSize
	) => void;
	/**
	 * Available units for custom font size selection.
	 *
	 * @default [ 'px', 'em', 'rem', 'vw', 'vh' ]
	 */
	units?: string[];
	/**
	 * The current font size value.
	 */
	value?: number | string;
	/**
	 * If `true`, a slider will be displayed alongside the input field when a
	 * custom font size is active. Has no effect when `disableCustomFontSizes`
	 * is `true`.
	 *
	 * @default false
	 */
	withSlider?: boolean;
	/**
	 * If `true`, a reset button will be displayed alongside the input field
	 * when a custom font size is active. Has no effect when
	 * `disableCustomFontSizes` is `true`.
	 *
	 * @default true
	 */
	withReset?: boolean;
	/**
	 * Start opting into the new margin-free styles that will become the default
	 * in a future version, currently scheduled to be WordPress 6.4. (The prop
	 * can be safely removed once this happens.)
	 *
	 * @default false
	 * @deprecated Default behavior since WP 6.5. Prop can be safely removed.
	 * @ignore
	 */
	__nextHasNoMarginBottom?: boolean;
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

export type FontSize = {
	/**
	 * The property `size` contains a number with the font size value, in `px` or
	 * a string specifying the font size CSS property that should be used eg:
	 * "13px", "1em", or "clamp(12px, 5vw, 100px)".
	 */
	size: number | string;
	/**
	 * The `name` property includes a label for that font size e.g.: `Small`.
	 */
	name?: string;
	/**
	 * The `slug` property is a string with a unique identifier for the font
	 * size. Used for the class generation process.
	 */
	slug: string;
};

export type FontSizePickerSelectProps = Pick<
	FontSizePickerProps,
	'value' | 'size'
> & {
	fontSizes: NonNullable< FontSizePickerProps[ 'fontSizes' ] >;
	disableCustomFontSizes: NonNullable<
		FontSizePickerProps[ 'disableCustomFontSizes' ]
	>;
	onChange: NonNullable< FontSizePickerProps[ 'onChange' ] >;
	onSelectCustom: () => void;
	__next40pxDefaultSize: boolean;
};

export type FontSizePickerSelectOption = {
	key: string;
	name: string;
	value?: FontSize[ 'size' ];
	hint?: string;
};

export type FontSizePickerToggleGroupProps = Pick<
	FontSizePickerProps,
	'value' | 'size' | '__next40pxDefaultSize'
> & {
	fontSizes: NonNullable< FontSizePickerProps[ 'fontSizes' ] >;
	onChange: NonNullable< FontSizePickerProps[ 'onChange' ] >;
};
