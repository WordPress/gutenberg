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
		 * A synced pattern (reusable block).
		 *
		 * `wp_block` supports `title`, `excerpt`, `editor`, `revisions` and
		 * `custom-fields`, so the posts controller omits `author`,
		 * `featured_media`, `comment_status`, `ping_status` and `menu_order`.
		 * `template` is not gated on a support, so the controller adds it to
		 * every post type, including this one. The post type is registered
		 * `public => false`, and both `permalink_template` and
		 * `generated_slug` are gated on the post type being viewable and
		 * public, so neither is on this record either.
		 *
		 * `WP_REST_Blocks_Controller` then reshapes `title` and `content`: it
		 * exposes `raw` in the view context as well as edit, and removes
		 * `rendered` entirely, because rendering a pattern requires it to be
		 * inside a post. Neither field carries `rendered` on this record.
		 */
		export interface Block< C extends Context > {
			/**
			 * The date the pattern was published, in the site's timezone.
			 */
			date: string | null;
			/**
			 * The date the pattern was published, as GMT.
			 */
			date_gmt: ContextualField< string | null, 'view' | 'edit', C >;
			/**
			 * The globally unique identifier for the pattern.
			 */
			guid: ContextualField< RenderedText< C >, 'view' | 'edit', C >;
			/**
			 * Unique identifier for the pattern.
			 */
			id: number;
			/**
			 * URL to the pattern.
			 */
			link: string;
			/**
			 * The date the pattern was last modified, in the site's timezone.
			 */
			modified: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * The date the pattern was last modified, as GMT.
			 */
			modified_gmt: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * An alphanumeric identifier for the pattern unique to its type.
			 */
			slug: string;
			/**
			 * A named status for the pattern.
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
			 * The title for the pattern. Carries no `rendered` form.
			 */
			title: ContextualField< { raw: string }, 'view' | 'edit', C >;
			/**
			 * The content for the pattern. Carries no `rendered` form.
			 */
			content: ContextualField<
				{
					raw: string;
					/**
					 * Whether the content is protected with a password.
					 */
					protected: boolean;
					/**
					 * Version of the content block format used by the pattern.
					 */
					block_version: ContextualField< number, 'edit', C >;
				},
				'view' | 'edit',
				C
			>;
			/**
			 * The excerpt for the pattern.
			 */
			excerpt: RenderedText< C > & {
				protected: boolean;
			};
			/**
			 * Whether the pattern is synced, and how.
			 *
			 * Registered as post meta, but `WP_REST_Blocks_Controller` lifts it
			 * to the top level of the response and removes it from `meta`, in
			 * every context. An empty string means the pattern is fully synced.
			 */
			wp_pattern_sync_status: '' | 'partial' | 'unsynced';
			/**
			 * Meta fields. `wp_pattern_sync_status` is registered on this post
			 * type but is served at the top level instead, so it is not here.
			 */
			meta: ContextualField<
				Record< string, unknown >,
				'view' | 'edit',
				C
			>;
			/**
			 * The theme file to use to display the pattern.
			 */
			template: ContextualField< string, 'view' | 'edit', C >;
		}
	}
}

export type Block< C extends Context = 'edit' > = OmitNevers<
	_BaseEntityRecords.Block< C >
>;
