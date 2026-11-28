export interface CommentDateAttributes extends Record< string, unknown > {
	/**
	 * Format of the date.
	 */
	format?: string | null;
	/**
	 * Whether the author name should be linked.
	 */
	isLink?: boolean;
}

export interface CommentDateBlockContext {
	/**
	 * The comment ID.
	 */
	commentId?: string | number;
}
