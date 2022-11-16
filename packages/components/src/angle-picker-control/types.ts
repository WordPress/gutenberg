export type AnglePickerControlProps = {
	/**
	 * Start opting into the new margin-free styles that will become the default
	 * in a future version.
	 *
	 * @default false
	 */
	__nextHasNoMarginBottom?: boolean;
	/**
	 * Label to use for the angle picker.
	 *
	 * @default __( 'Angle' )
	 */
	label?: string;
	/**
	 * The current value of the input. The value represents an angle in degrees
	 * and should be a value between 0 and 360.
	 */
	onChange?: ( value: number ) => void;
	/**
	 * A function that receives the new value of the input.
	 */
	value?: number;
};

export type AngleCircleProps = Pick<
	AnglePickerControlProps,
	'value' | 'onChange'
>;
