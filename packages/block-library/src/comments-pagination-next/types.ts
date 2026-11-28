export interface CommentsPaginationNextAttributes extends Record<
	string,
	unknown
> {
	label?: string;
}

export interface CommentsPaginationNextBlockContext {
	'comments/paginationArrow'?: 'none' | 'arrow' | 'chevron';
}
