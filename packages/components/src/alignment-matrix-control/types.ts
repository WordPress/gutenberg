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
	className: string;
	id?: string | undefined;
	label: string;
	defaultValue?: string;
	value: AlignmentMatrixControlValue;
	onChange: ( newValue: AlignmentMatrixControlValue ) => void;
	width: number;
};

export type AlignmentMatrixControlIconProps = {
	className: string;
	disablePointerEvents?: boolean;
	size: number;
	style: {};
	value: AlignmentMatrixControlValue;
	props: {};
};
export type AlignmentMatrixControlCellProps = {
	isActive: boolean;
	value: AlignmentMatrixControlValue;
};
