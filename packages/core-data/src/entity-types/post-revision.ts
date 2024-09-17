/**
 * Internal dependencies
 */
import type {
	Context,
	ContextualField,
	RenderedText,
	OmitNevers,
} from './helpers';

import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		export interface PostRevision< C extends Context > {
			/**
			 * The ID for the author of the post revision.
			 */
			author: number;
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
					 * Version of the content block format used by the post.
					 */
					block_version: ContextualField< string, 'edit', C >;
				},
				'view' | 'edit',
				C
			>;
			/**
			 * The date the post was published, in the site's timezone.
			 */
			date: string | null;
			/**
			 * The date the post was published, as GMT.
			 */
			date_gmt: ContextualField< string | null, 'view' | 'edit', C >;
			/**
			 * The excerpt for the post revision.
			 */
			excerpt: RenderedText< C > & {
				protected: boolean;
			};
			/**
			 * The globally unique identifier for the post.
			 */
			guid: ContextualField< RenderedText< C >, 'view' | 'edit', C >;
			/**
			 * Unique identifier for the revision.
			 */
			id: number;
			/**
			 * Meta fields.
			 */
			meta: ContextualField<
				Record< string, string >,
				'view' | 'edit',
				C
			>;
			/**
			 * The date the post was last modified, in the site's timezone.
			 */
			modified: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * The date the post revision was last modified, as GMT.
			 */
			modified_gmt: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * Identifier for the parent of the revision.
			 */
			parent: number;
			/**
			 * An alphanumeric identifier for the post unique to its type.
			 */
			slug: string;
			/**
			 * The title for the post revision.
			 */
			title: RenderedText< C >;
		}
	}
}

export type PostRevision< C extends Context = 'view' > = OmitNevers<
	_BaseEntityRecords.PostRevision< C >
>;
