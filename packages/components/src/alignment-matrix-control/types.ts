//TODO:
// - cross check types with README.md
// - add JSDoc to main component props in types.ts

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
	defaultValue?: AlignmentMatrixControlValue;
	value?: AlignmentMatrixControlValue;
	onChange?: ( newValue: AlignmentMatrixControlValue ) => void;
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
