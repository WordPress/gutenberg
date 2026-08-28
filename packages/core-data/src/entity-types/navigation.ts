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
		 * `featured_media`, `comment_status`, `ping_status`, `menu_order`,
		 * `meta` or `template` on this record. The post type is registered
		 * `public => false`, and both `permalink_template` and
		 * `generated_slug` are gated on the post type being viewable and
		 * public, so neither is present either.
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
			status: ContextualField< PostStatus, 'view' | 'edit', C >;
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
			title: RenderedText< C >;
			/**
			 * The content for the navigation menu.
			 */
			content: ContextualField<
				RenderedText< C > & {
					/**
					 * Whether the content is protected with a password.
					 */
					is_protected: boolean;
					/**
					 * Version of the content block format used by the menu.
					 */
					block_version: ContextualField< string, 'edit', C >;
				},
				'view' | 'edit',
				C
			>;
		}
	}
}

export type Navigation< C extends Context = 'edit' > = OmitNevers<
	_BaseEntityRecords.Navigation< C >
>;
