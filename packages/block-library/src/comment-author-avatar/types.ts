export interface CommentAuthorAvatarAttributes extends Record<
	string,
	unknown
> {
	width: number;
	height: number;
}

export interface CommentAuthorAvatarBlockContext extends Record<
	string,
	unknown
> {
	commentId?: string | number;
}
