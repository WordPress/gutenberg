export interface CommentAuthorAvatarAttributes extends Record<
	string,
	unknown
> {
	width: number;
	height: number;
}

export interface CommentAuthorAvatarBlockContext {
	commentId?: string | number;
}
