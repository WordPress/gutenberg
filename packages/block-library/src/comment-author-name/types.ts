import type { StyledBlockAttributes } from '../utils/types';

export interface CommentAuthorNameAttributes extends StyledBlockAttributes {
	/**
	 * Whether the author name should be linked.
	 */
	isLink?: boolean;
	/**
	 * Target of the link.
	 */
	linkTarget?: string;
}

export interface CommentAuthorNameBlockContext {
	/**
	 * The comment ID.
	 */
	commentId?: string | number;
}
