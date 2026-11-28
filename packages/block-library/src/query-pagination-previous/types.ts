export interface QueryPaginationPreviousAttributes extends Record<
	string,
	unknown
> {
	label?: string;
}

export interface QueryPaginationPreviousBlockContext {
	paginationArrow?: 'none' | 'arrow' | 'chevron';
	showLabel?: boolean;
}
