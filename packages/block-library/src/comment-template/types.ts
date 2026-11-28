import type { Block } from '@wordpress/blocks';

export interface CommentTemplateBlockContext {
	/**
	 * The post ID.
	 */
	postId?: number;
}

export interface DiscussionSettings {
	commentOrder?: string;
	threadCommentsDepth?: number;
	threadComments?: boolean;
	commentsPerPage?: number;
	pageComments?: boolean;
	defaultCommentsPage?: string;
}

export interface CommentNode {
	commentId: number;
	children?: CommentNode[];
}

export interface CommentsPlaceholderSettings {
	perPage?: number;
	pageComments?: boolean;
	threadComments?: boolean;
	threadCommentsDepth?: number;
}

export interface CommentTemplateInnerBlocksProps {
	comment: CommentNode;
	activeCommentId?: number;
	setActiveCommentId: ( commentId?: number ) => void;
	firstCommentId?: number;
	blocks: Block[];
}

export interface CommentTemplatePreviewProps {
	blocks: Block[];
	commentId: number;
	setActiveCommentId: ( commentId?: number ) => void;
	isHidden: boolean;
}

export interface CommentsListProps {
	comments: CommentNode[];
	blockProps?: Record< string, unknown >;
	activeCommentId?: number;
	setActiveCommentId: ( commentId?: number ) => void;
	blocks: Block[];
	firstCommentId?: number;
}

export interface CommentQueryArgsProps {
	postId?: number;
}

export interface DefaultPageIndexProps {
	defaultPage?: string;
	postId?: number;
	perPage: number;
	queryArgs: Record< string, unknown >;
}

export interface EmbeddedComment {
	id: number;
	_embedded?: {
		children?: Array< Array< { id: number } > >;
	};
}

export interface CommentTreeInputItem {
	id: number;
	parent: number;
}

export interface CommentTreeNode {
	commentId: number;
	children: CommentTreeNode[];
}
