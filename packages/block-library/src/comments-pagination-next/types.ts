export interface CommentsPaginationNextAttributes extends Record<
	string,
	unknown
> {
	label?: string;
}

export interface CommentsPaginationNextBlockContext extends Record<
	string,
	unknown
> {
	'comments/paginationArrow'?: 'none' | 'arrow' | 'chevron';
}
