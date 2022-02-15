/**
 * Internal dependencies
 */
import {
	PostStatus,
	PingStatus,
	CommentStatus,
	RawField,
	PostFormat,
	WithEdits,
} from './common';

export interface Post {
	/**
	 * The date the post was published, in the site's timezone.
	 */
	date: string | null;
	/**
	 * The date the post was published, as GMT.
	 */
	date_gmt?: string | null;
	/**
	 * The globally unique identifier for the post.
	 */
	guid?: RawField;
	/**
	 * Unique identifier for the post.
	 */
	id: number;
	/**
	 * URL to the post.
	 */
	link: string;
	/**
	 * The date the post was last modified, in the site's timezone.
	 */
	modified?: string;
	/**
	 * The date the post was last modified, as GMT.
	 */
	modified_gmt?: string;
	/**
	 * An alphanumeric identifier for the post unique to its type.
	 */
	slug: string;
	/**
	 * A named status for the post.
	 */
	status?: PostStatus;
	/**
	 * Type of post.
	 */
	type: string;
	/**
	 * A password to protect access to the content and excerpt.
	 */
	password?: string;
	/**
	 * Permalink template for the post.
	 */
	permalink_template?: string;
	/**
	 * Slug automatically generated from the post title.
	 */
	generated_slug?: string;
	/**
	 * The title for the post.
	 */
	title: RawField;
	/**
	 * The content for the post.
	 */
	content?: RawField & {
		/** Whether the content is protected with a password. */
		is_protected: boolean;
		/** Version of the content block format used by the post. */
		block_version?: string;
	};
	/**
	 * The ID for the author of the post.
	 */
	author: number;
	/**
	 * The excerpt for the post.
	 */
	excerpt: RawField;
	/**
	 * The ID of the featured media for the post.
	 */
	featured_media: number;
	/**
	 * Whether or not comments are open on the post.
	 */
	comment_status?: CommentStatus;
	/**
	 * Whether or not the post can be pinged.
	 */
	ping_status?: PingStatus;
	/**
	 * The format for the post.
	 */
	format?: PostFormat;
	/**
	 * Meta fields.
	 */
	meta?: {
		[ k: string ]: string;
	};
	/**
	 * Whether or not the post should be treated as sticky.
	 */
	sticky?: boolean;
	/**
	 * The theme file to use to display the post.
	 */
	template?: string;
	/**
	 * The terms assigned to the post in the category taxonomy.
	 */
	categories?: number[];
	/**
	 * The terms assigned to the post in the post_tag taxonomy.
	 */
	tags?: number[];
}

export interface PostWithEdits
	extends WithEdits< Post, 'guid' | 'title' | 'content' | 'excerpt' > {}
