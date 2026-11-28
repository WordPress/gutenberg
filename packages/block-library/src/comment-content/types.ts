import type { StyledBlockAttributes } from '../utils/types';

export interface CommentContentAttributes extends StyledBlockAttributes {
	className?: string;
}

export interface CommentContentBlockContext {
	commentId?: string | number;
}
