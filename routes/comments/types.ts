/**
 * WordPress dependencies
 */
import type { Comment } from '@wordpress/core-data';

export type CommentWithPermissions = Comment< 'edit' > & {
	permissions: {
		delete: boolean;
		update: boolean;
	};
};

/**
 * Comment status values used by the WP REST API.
 * 'hold' = pending/unapproved, 'approve' = approved,
 * 'spam' and 'trash' are self-explanatory.
 */
export const COMMENT_STATUSES = {
	HOLD: 'hold',
	APPROVE: 'approve',
	SPAM: 'spam',
	TRASH: 'trash',
} as const;

export const STATUS_TABS = [
	{ slug: 'all', label: 'All' },
	{ slug: 'approve', label: 'Approved' },
	{ slug: 'hold', label: 'Pending' },
	{ slug: 'spam', label: 'Spam' },
	{ slug: 'trash', label: 'Trash' },
] as const;
