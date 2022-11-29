export type AlignmentMatrixControlIconProps = {
	className: string;
	disablePointerEvents?: boolean;
	size: number;
	style: {};
	value: string;
	props: {};
};

export type AlignmentMatrixControlCellProps = {
	isActive: boolean;
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
};
