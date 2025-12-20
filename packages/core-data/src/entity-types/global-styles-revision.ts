/**
 * Internal dependencies
 */
import type { Context, ContextualField, OmitNevers } from './helpers';

import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		export interface GlobalStylesRevision< C extends Context > {
			/**
			 * The ID for the author of the global styles revision.
			 */
			author: number;
			/**
			 * The date the post global styles revision published, in the site's timezone.
			 */
			date: string | null;
			/**
			 * The date the global styles revision was published, as GMT.
			 */
			date_gmt: ContextualField< string | null, 'view' | 'edit', C >;
			/**
			 * Unique identifier for the revision.
			 */
			id: number;
			/**
			 * The date the global styles revision was last modified, in the site's timezone.
			 */
			modified: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * The date the global styles revision was last modified, as GMT.
			 */
			modified_gmt: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * Identifier for the parent of the revision.
			 */
			parent: number;
			styles: Record< string, Object >;
			settings: Record< string, Object >;
		}
	}
}

export type GlobalStylesRevision< C extends Context = 'view' > = OmitNevers<
	_BaseEntityRecords.GlobalStylesRevision< C >
>;
