// TODO:
// - add prop description
// - match README with TS prop description

export type AnglePickerControlProps = {
	/**
	 * Start opting into the new margin-free styles that will become the default
	 * in a future version.
	 *
	 * @default false
	 */
	__nextHasNoMarginBottom?: boolean;
	className?: string;
	label?: string;
	onChange: ( value: number ) => void;
	value: number;
};
