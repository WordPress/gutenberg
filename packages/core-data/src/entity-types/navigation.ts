import type {
	Context,
	ContextualField,
	PostStatus,
	RenderedText,
	OmitNevers,
} from './helpers';
import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		/**
		 * A navigation menu.
		 *
		 * `wp_navigation` is registered with `supports` limited to `title`,
		 * `editor` and `revisions`, so the posts controller omits the fields
		 * gated on the other supports -- there is no `author`, `excerpt`,
		 * `featured_media`, `comment_status`, `ping_status`, `menu_order` or
		 * `meta` on this record. `template` is not gated on a support, so the
		 * controller adds it to every post type, including this one. The post
		 * type is registered `public => false`, and both `permalink_template`
		 * and `generated_slug` are gated on the post type being viewable and
		 * public, so neither is present either.
		 *
		 * `WP_Navigation_Fallback` then widens the schema for this post type:
		 * `status` and `content` gain the embed context, as do `content.raw`,
		 * `content.rendered`, `content.block_version` and `title.raw`, which
		 * the posts controller would otherwise keep out of an embed response.
		 */
		export interface Navigation< C extends Context > {
			/**
			 * The date the navigation menu was published, in the site's timezone.
			 */
			date: string | null;
			/**
			 * The date the navigation menu was published, as GMT.
			 */
			date_gmt: ContextualField< string | null, 'view' | 'edit', C >;
			/**
			 * The globally unique identifier for the navigation menu.
			 */
			guid: ContextualField< RenderedText< C >, 'view' | 'edit', C >;
			/**
			 * Unique identifier for the navigation menu.
			 */
			id: number;
			/**
			 * URL to the navigation menu.
			 */
			link: string;
			/**
			 * The date the navigation menu was last modified, in the site's timezone.
			 */
			modified: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * The date the navigation menu was last modified, as GMT.
			 */
			modified_gmt: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * An alphanumeric identifier for the navigation menu unique to its type.
			 */
			slug: string;
			/**
			 * A named status for the navigation menu.
			 */
			status: ContextualField< PostStatus, 'view' | 'edit' | 'embed', C >;
			/**
			 * Type of post.
			 */
			type: string;
			/**
			 * A password to protect access to the content.
			 */
			password: ContextualField< string, 'edit', C >;
			/**
			 * The title for the navigation menu.
			 */
			title: {
				raw: ContextualField< string, 'edit' | 'embed', C >;
				rendered: string;
			};
			/**
			 * The content for the navigation menu.
			 */
			content: ContextualField<
				{
					/**
					 * The source markup, exposed in the embed context as well
					 * as edit.
					 */
					raw: ContextualField< string, 'edit' | 'embed', C >;
					/**
					 * The markup after processing and filtering on the server.
					 */
					rendered: string;
					/**
					 * Whether the content is protected with a password.
					 */
					protected: boolean;
					/**
					 * Version of the content block format used by the menu.
					 */
					block_version: ContextualField<
						number,
						'edit' | 'embed',
						C
					>;
				},
				'view' | 'edit' | 'embed',
				C
			>;
			/**
			 * The theme file to use to display the navigation menu.
			 */
			template: ContextualField< string, 'view' | 'edit', C >;
		}
	}
}

export type Navigation< C extends Context = 'edit' > = OmitNevers<
	_BaseEntityRecords.Navigation< C >
>;
