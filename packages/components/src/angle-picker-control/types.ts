export type AnglePickerControlProps = {
	/**
	 * Start opting into the new margin-free styles that will become the default
	 * in a future version.
	 *
	 * @default false
	 * @deprecated Default behavior since WP 6.5. Prop can be safely removed.
	 * @ignore
	 */
	__nextHasNoMarginBottom?: boolean;
	/**
	 * Label to use for the angle picker.
	 *
	 * @default __( 'Angle' )
	 */
	label?: string;
	/**
	 * The maximum angle, in degrees, that can be entered.
	 *
	 * @default 360
	 */
	max?: number;
	/**
	 * The minimum angle, in degrees, that can be entered.
	 *
	 * @default 0
	 */
	min?: number;
	/**
	 * A function that receives the new value of the input.
	 */
	onChange: ( value: number ) => void;
	/**
	 * The current value of the input. The value represents an angle in degrees
	 * and should be a value between `min` and `max`.
	 */
	value: number | string;
};

export type PrivateAnglePickerControlProps = Omit<
	AnglePickerControlProps,
	'onChange' | 'value'
> & {
	/**
	 * Whether clearing the input reports `undefined` instead of `0`.
	 *
	 * @default false
	 */
	allowEmpty?: boolean;
	/**
	 * A function that receives the new value of the input, or `undefined`
	 * when the input is cleared and `allowEmpty` is set.
	 */
	onChange: ( value: number | undefined ) => void;
	/**
	 * The current value of the input.
	 */
	value: number | string | undefined;
};

export type AngleCircleProps = {
	value: AnglePickerControlProps[ 'value' ] | undefined;
	onChange: AnglePickerControlProps[ 'onChange' ];
};
