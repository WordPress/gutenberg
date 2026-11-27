import type { StyledBlockAttributes } from '../utils/types';

export interface CommentReplyLinkAttributes extends StyledBlockAttributes {
	className?: string;
	textAlign?: string;
}

export interface CommentReplyLinkBlockContext extends Record<
	string,
	unknown
> {
	commentId?: string | number;
}
