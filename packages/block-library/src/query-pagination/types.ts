export interface QueryPaginationAttributes extends Record< string, unknown > {
	paginationArrow?: string;
	showLabel?: boolean;
}

export interface QueryPaginationArrowControlsProps {
	value?: string;
	onChange: ( value?: string | number ) => void;
}

export interface QueryPaginationLabelControlProps {
	value?: boolean;
	onChange: ( value: boolean ) => void;
}
