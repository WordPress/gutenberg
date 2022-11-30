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
	label: string;
	defaultValue?: AlignmentMatrixControlValue;
	value: AlignmentMatrixControlValue;
	onChange: ( newValue: AlignmentMatrixControlValue ) => void;
	width: number;
};

export type AlignmentMatrixControlIconProps = Pick<
	AlignmentMatrixControlProps,
	'value'
> & {
	disablePointerEvents?: boolean;
	size: number;
};

export type AlignmentMatrixControlCellProps = Pick<
	AlignmentMatrixControlProps,
	'value'
> & {
	isActive: boolean;
};
