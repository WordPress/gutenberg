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
	 * A function that receives the new value of the input.
	 */
	onChange: ( value: number ) => void;
	/**
	 * The current value of the input. The value represents an angle in degrees
	 * and should be a value between 0 and 360.
	 */
	value: number | string;
};

export type AngleCircleProps = Pick<
	AnglePickerControlProps,
	'value' | 'onChange'
>;
