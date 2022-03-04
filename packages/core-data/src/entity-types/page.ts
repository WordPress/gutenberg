/**
 * Internal dependencies
 */
import type {
	CommentingStatus,
	Context,
	ContextualField,
	PingStatus,
	PostStatus,
	RenderedText,
	OmitNevers,
} from './helpers';

import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';
import type { DefaultContextOf } from './entities';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		export interface Page< C extends Context > {
			/**
			 * The date the post was published, in the site's timezone.
			 */
			date: string | null;
			/**
			 * The date the post was published, as GMT.
			 */
			date_gmt: ContextualField< string | null, 'view' | 'edit', C >;
			/**
			 * The globally unique identifier for the post.
			 */
			guid: ContextualField< RenderedText< C >, 'view' | 'edit', C >;
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
			modified: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * The date the post was last modified, as GMT.
			 */
			modified_gmt: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * An alphanumeric identifier for the post unique to its type.
			 */
			slug: string;
			/**
			 * A named status for the post.
			 */
			status: ContextualField< PostStatus, 'view' | 'edit', C >;
			/**
			 * Type of post.
			 */
			type: string;
			/**
			 * A password to protect access to the content and excerpt.
			 */
			password: ContextualField< string, 'edit', C >;
			/**
			 * Permalink template for the post.
			 */
			permalink_template: ContextualField< string, 'edit', C >;
			/**
			 * Slug automatically generated from the post title.
			 */
			generated_slug: ContextualField< string, 'edit', C >;
			/**
			 * The ID for the parent of the post.
			 */
			parent: ContextualField< number, 'view' | 'edit', C >;
			/**
			 * The title for the post.
			 */
			title: RenderedText< C >;
			/**
			 * The content for the post.
			 */
			content: ContextualField<
				RenderedText< C > & {
					/**
					 * Whether the content is protected with a password.
					 */
					is_protected: boolean;
					/**
					 * Version of the content block format used by the page.
					 */
					block_version: ContextualField< string, 'edit', C >;
				},
				'view' | 'edit',
				C
			>;
			/**
			 * The ID for the author of the post.
			 */
			author: number;
			/**
			 * The excerpt for the post.
			 */
			excerpt: RenderedText< C > & {
				protected: boolean;
			};
			/**
			 * The ID of the featured media for the post.
			 */
			featured_media: number;
			/**
			 * Whether or not comments are open on the post.
			 */
			comment_status: ContextualField<
				CommentingStatus,
				'view' | 'edit',
				C
			>;
			/**
			 * Whether or not the post can be pinged.
			 */
			ping_status: ContextualField< PingStatus, 'view' | 'edit', C >;
			/**
			 * The order of the post in relation to other posts.
			 */
			menu_order: ContextualField< number, 'view' | 'edit', C >;
			/**
			 * Meta fields.
			 */
			meta: ContextualField<
				Record< string, string >,
				'view' | 'edit',
				C
			>;
			/**
			 * The theme file to use to display the post.
			 */
			template: ContextualField< string, 'view' | 'edit', C >;
		}
	}
}

export type Page<
	C extends Context = DefaultContextOf< 'postType', 'page' >
> = OmitNevers< _BaseEntityRecords.Page< C > >;
