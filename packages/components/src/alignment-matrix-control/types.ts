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
	 * underlying `grid` widget.
	 *
	 * @default 'Alignment Matrix Control'
	 */
	label?: string;
	/**
	 * If provided, sets the default alignment value.
	 *
	 * @default 'center center'
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
	 * If provided, sets the width of the control.
	 *
	 * @default 92
	 */
	width?: number;
};

export type AlignmentMatrixControlIconProps = Pick<
	AlignmentMatrixControlProps,
	'value'
> & {
	/**
	 * If `true`, disables pointer events on the icon.
	 * @default true
	 */
	disablePointerEvents?: boolean;
	/**
	 * _Note: this prop is deprecated. Use the `size` prop on the parent `Icon`
	 * component instead_
	 *
	 * The size of the icon.
	 *
	 * @deprecated
	 * @ignore
	 * @default 24
	 */
	size?: number;
};

export type AlignmentMatrixControlCellProps = {
	value: NonNullable< AlignmentMatrixControlProps[ 'value' ] >;
};
