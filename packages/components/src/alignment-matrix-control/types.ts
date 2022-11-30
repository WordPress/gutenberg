export type AlignmentMatrixControlValue =
	| 'top left'
	| 'top center'
	| 'top right'
	| 'center left'
	| 'center'
	| 'center center'
	| 'center right'
	| 'bottom left'
	| 'bottom center'
	| 'bottom right';

export type AlignmentMatrixControlProps = {
	/**
	 * Accessible label. If provided, sets the `aria-label` attribute of the
	 * underlying <Composite/> component.
	 *
	 * @default 'Alignment Matrix Control'
	 */
	label?: string;
	/**
	 * If provided, sets the default alignment value.
	 */
	defaultValue?: AlignmentMatrixControlValue;
	/**
	 * The current alignment value.
	 */
	value?: AlignmentMatrixControlValue;
	/**
	 * A function that receives the updated alignment value.
	 */
	onChange?: ( newValue: AlignmentMatrixControlValue ) => void;
	/**
	 * If provided, sets the width of the wrapper <Composite/> component.
	 */
	width?: number;
};

export type AlignmentMatrixControlIconProps = Pick<
	AlignmentMatrixControlProps,
	'value'
> & {
	disablePointerEvents?: boolean;
	size: number;
};

export type AlignmentMatrixControlCellProps = {
	isActive: boolean;
	value: NonNullable< AlignmentMatrixControlProps[ 'value' ] >;
};
