export type AlignmentMatrixControlValue =
	| 'top left'
	| 'top center'
	| 'top right'
	| 'center left'
	| 'center center'
	| 'center right'
	| 'bottom left'
	| 'bottom center'
	| 'bottom right';

export type AlignmentMatrixControlProps = {
	label: string;
	defaultValue?: string;
	value: AlignmentMatrixControlValue;
	onChange: ( newValue: AlignmentMatrixControlValue ) => void;
	width: number;
};

export type AlignmentMatrixControlIconProps = {
	disablePointerEvents?: boolean;
	size: number;
	value: AlignmentMatrixControlValue;
};
export type AlignmentMatrixControlCellProps = {
	isActive: boolean;
	value: AlignmentMatrixControlValue;
};
