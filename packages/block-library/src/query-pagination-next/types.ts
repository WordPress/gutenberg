export interface QueryPaginationNextAttributes extends Record<
	string,
	unknown
> {
	label?: string;
}

export interface QueryPaginationNextBlockContext extends Record<
	string,
	unknown
> {
	paginationArrow?: 'none' | 'arrow' | 'chevron';
	showLabel?: boolean;
}
