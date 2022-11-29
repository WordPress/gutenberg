export type AlignmentMatrixControlProps = {
	className: string;
	id?: string | undefined;
	label: string;
	defaultValue?: string;
	value:
		| 'top left'
		| 'top center'
		| 'top right'
		| 'center left'
		| 'center center'
		| 'center right'
		| 'bottom left'
		| 'bottom center'
		| 'bottom right';
	onChange: ( newValue: string ) => void; // ??
	width: number;
};

export type AlignmentMatrixControlIconProps = {
	className: string;
	disablePointerEvents?: boolean;
	size: number;
	style: {};
	value: Pick< AlignmentMatrixControlProps, 'value' >;
	props: {};
};

export type AlignmentMatrixControlCellProps = {
	isActive: boolean;
	value: Pick< AlignmentMatrixControlProps, 'value' >;
};
