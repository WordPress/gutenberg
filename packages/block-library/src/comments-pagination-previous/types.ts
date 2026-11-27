export interface CommentsPaginationPreviousAttributes extends Record<
	string,
	unknown
> {
	label?: string;
}

export interface CommentsPaginationPreviousBlockContext extends Record<
	string,
	unknown
> {
	'comments/paginationArrow'?: 'none' | 'arrow' | 'chevron';
}
