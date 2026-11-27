export interface CommentDateAttributes extends Record< string, unknown > {
	format?: string;
	isLink?: boolean;
}

export interface CommentDateBlockContext extends Record< string, unknown > {
	commentId?: string | number;
}
