export interface CommentsPaginationPreviousAttributes extends Record<
	string,
	unknown
> {
	label?: string;
}

export interface CommentsPaginationPreviousBlockContext {
	'comments/paginationArrow'?: 'none' | 'arrow' | 'chevron';
}
