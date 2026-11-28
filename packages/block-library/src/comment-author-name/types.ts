import type { StyledBlockAttributes } from '../utils/types';

export interface CommentAuthorNameAttributes extends StyledBlockAttributes {
	isLink?: boolean;
	linkTarget?: string;
}

export interface CommentAuthorNameBlockContext {
	commentId?: string | number;
}
