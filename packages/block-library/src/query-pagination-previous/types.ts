export interface QueryPaginationPreviousAttributes extends Record<
	string,
	unknown
> {
	label?: string;
}

export interface QueryPaginationPreviousBlockContext extends Record<
	string,
	unknown
> {
	paginationArrow?: 'none' | 'arrow' | 'chevron';
	showLabel?: boolean;
}
