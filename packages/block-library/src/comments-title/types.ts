import type { StyledBlockAttributes } from '../utils/types';

export interface CommentsTitleAttributes extends StyledBlockAttributes {
	className?: string;
	showPostTitle?: boolean;
	showCommentsCount?: boolean;
	level?: number;
	levelOptions?: number[];
}

export interface CommentsTitleDeprecatedAttributes extends CommentsTitleAttributes {
	singleCommentLabel?: string;
	multipleCommentsLabel?: string;
}

export interface CommentsTitleBlockContext {
	postId?: number;
	postType?: string;
}
