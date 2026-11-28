export interface CommentsPaginationAttributes extends Record<
	string,
	unknown
> {
	paginationArrow?: string;
}

export interface CommentsPaginationArrowControlsProps {
	value?: string;
	onChange: ( value?: string | number ) => void;
}
