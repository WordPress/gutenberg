/**
 * Internal dependencies
 */
import { AvatarUrls, Context, ContextualField, RawField } from './common';

interface FullComment< C extends Context > {
	/**
	 * Unique identifier for the comment.
	 */
	id: number;
	/**
	 * The ID of the user object, if author was a user.
	 */
	author: number;
	/**
	 * Email address for the comment author.
	 */
	author_email: ContextualField< string, 'edit', C >;
	/**
	 * IP address for the comment author.
	 */
	author_ip: ContextualField< string, 'edit', C >;
	/**
	 * Display name for the comment author.
	 */
	author_name: string;
	/**
	 * URL for the comment author.
	 */
	author_url: string;
	/**
	 * User agent for the comment author.
	 */
	author_user_agent: ContextualField< string, 'edit', C >;
	/**
	 * The content for the comment.
	 */
	content: RawField< C >;
	/**
	 * The date the comment was published, in the site's timezone.
	 */
	date: string;
	/**
	 * The date the comment was published, as GMT.
	 */
	date_gmt: ContextualField< string, 'view' | 'edit', C >;
	/**
	 * URL to the comment.
	 */
	link: string;
	/**
	 * The ID for the parent of the comment.
	 */
	parent: number;
	/**
	 * The ID of the associated post object.
	 */
	post: ContextualField< number, 'view' | 'edit', C >;
	/**
	 * State of the comment.
	 */
	status: ContextualField< string, 'view' | 'edit', C >;
	/**
	 * Type of the comment.
	 */
	type: string;
	/**
	 * Avatar URLs for the comment author.
	 */
	author_avatar_urls: AvatarUrls;
	/**
	 * Meta fields.
	 */
	meta: ContextualField< Record< string, string >, 'view' | 'edit', C >;
}

export type Comment< C extends Context > = FullComment< C >;
