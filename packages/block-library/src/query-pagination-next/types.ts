export interface QueryPaginationNextAttributes extends Record<
	string,
	unknown
> {
	label?: string;
}

export interface QueryPaginationNextBlockContext {
	paginationArrow?: 'none' | 'arrow' | 'chevron';
	showLabel?: boolean;
}
